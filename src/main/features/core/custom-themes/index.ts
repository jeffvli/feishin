import type { FSWatcher } from 'fs';

import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { promises as fs, watch as fsWatch } from 'fs';
import path from 'path';
import { validateHTMLColor } from 'validate-color';

const isDevelopment = process.env.NODE_ENV === 'development';

const defaultUserDataPath = app.getPath('userData');
const userDataPath = isDevelopment
    ? path.normalize(`${defaultUserDataPath}-dev`)
    : path.normalize(defaultUserDataPath);

export const THEMES_DIRNAME = 'Themes';
export const themesPath = path.join(userDataPath, THEMES_DIRNAME);

const JSON_EXTENSION = '.json';
// How long to wait after the last fs event before re-reading the folder.
// Multiple files landing at once (e.g. git pull, zip extract) fire multiple
// events; debouncing collapses them into a single reload.
const RELOAD_DEBOUNCE_MS = 150;
// Extending themes can only go this many links deep before we assume a
// cycle or a mistake and bail out, rather than looping forever.
const MAX_EXTENDS_DEPTH = 10;

const isValidCssColor = (value: unknown): value is string => {
    if (typeof value !== 'string' || !value.trim()) return false;
    return validateHTMLColor(value); // treats color names as invalid
};

// Validates every value in a theme's `colors` object, dropping (and
// warning about) anything that isn't a recognizable CSS color rather than
// letting it through to the renderer where it would crash color
// generation. Returns the sanitized colors plus a list of rejected keys so
// callers can decide whether to surface them as a theme-level error.
const sanitizeColors = (
    colors: Record<string, unknown> | undefined,
    themeId: string,
): { invalidKeys: string[]; sanitized: Record<string, unknown> | undefined } => {
    if (!colors) return { invalidKeys: [], sanitized: undefined };

    const sanitized: Record<string, unknown> = {};
    const invalidKeys: string[] = [];

    for (const [key, value] of Object.entries(colors)) {
        if (isValidCssColor(value)) {
            sanitized[key] = value;
        } else {
            invalidKeys.push(key);
            console.warn(`Custom theme "${themeId}" has an invalid color for "${key}": ${value}`);
        }
    }

    return { invalidKeys, sanitized };
};

export interface CustomTheme {
    app?: Record<string, unknown>;
    colors?: Record<string, unknown>;
    error?: string;
    extends?: string;
    filename: string;
    id: string;
    label: string;
    mantineOverride?: Record<string, unknown>;
    mode: 'dark' | 'light';
    // Absolute paths on disk. The renderer never sees these directly, it
    // gets the resolved CSS text via `stylesheetContents` instead.
    stylesheetContents?: string[];
    stylesheetPaths?: string[];
    // Non-fatal problems found while loading (e.g. unparseable color
    // values that were dropped). The theme still loads and can be
    // selected; this is surfaced in Settings so the user can fix it.
    warnings?: string[];
}

interface RawCustomTheme {
    app?: Record<string, unknown>;
    colors?: Record<string, unknown>;
    // Name (without .json) of another custom theme, or a built-in theme id,
    // to merge on top of. Custom themes always win over what they extend.
    extends?: string;
    mantineOverride?: Record<string, unknown>;
    mode?: 'dark' | 'light';
    // Paths to .css files, relative to the theme's own json file, that
    // should be inlined into the app's stylesheet when this theme is active.
    stylesheets?: string[];
}

let watcher: FSWatcher | null = null;
let debounceTimer: NodeJS.Timeout | null = null;
let cache: CustomTheme[] = [];

const idFromFilename = (filename: string) => path.basename(filename, JSON_EXTENSION);

const labelFromId = (id: string) =>
    id
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase())
        .trim() || id;

const readJsonFile = async (filePath: string): Promise<RawCustomTheme> => {
    const content = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(content);

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error('Theme file must contain a JSON object');
    }

    return parsed as RawCustomTheme;
};

// Resolves a theme's `stylesheets` entries (relative to its own json file)
// to absolute paths, and drops anything that tries to escape the themes
// folder (e.g. `../../etc/passwd`) so theme files can't be used to read
// arbitrary files off disk.
const resolveStylesheetPaths = (themeDir: string, stylesheets?: string[]): string[] => {
    if (!stylesheets || !Array.isArray(stylesheets)) return [];

    const resolved: string[] = [];
    for (const relativePath of stylesheets) {
        if (typeof relativePath !== 'string' || !relativePath.trim()) continue;

        const absolutePath = path.resolve(themeDir, relativePath);
        const relativeToThemes = path.relative(themesPath, absolutePath);
        const escapesThemesDir =
            relativeToThemes.startsWith('..') || path.isAbsolute(relativeToThemes);

        if (escapesThemesDir) {
            console.warn(
                `Skipping linked file outside themes folder: ${relativePath} (from ${themeDir})`,
            );
            continue;
        }

        resolved.push(absolutePath);
    }

    return resolved;
};

const readStylesheetContents = async (stylesheetPaths: string[]): Promise<string[]> => {
    const contents = await Promise.all(
        stylesheetPaths.map(async (stylesheetPath) => {
            try {
                return await fs.readFile(stylesheetPath, 'utf8');
            } catch (error) {
                console.warn(`Failed to read linked stylesheet ${stylesheetPath}`, error);
                return '';
            }
        }),
    );

    return contents.filter(Boolean);
};

const mergeThemeFields = (
    base: Omit<CustomTheme, 'error' | 'filename' | 'id' | 'label'>,
    override: Omit<CustomTheme, 'error' | 'filename' | 'id' | 'label'>,
): Omit<CustomTheme, 'error' | 'filename' | 'id' | 'label'> => {
    return {
        app: { ...base.app, ...override.app },
        colors: { ...base.colors, ...override.colors },
        mantineOverride: { ...base.mantineOverride, ...override.mantineOverride },
        mode: override.mode ?? base.mode,
        stylesheetContents: [
            ...(base.stylesheetContents ?? []),
            ...(override.stylesheetContents ?? []),
        ],
        stylesheetPaths: [...(base.stylesheetPaths ?? []), ...(override.stylesheetPaths ?? [])],
    };
};

// Follows a theme's `extends` chain. `extends` may point at another custom
// theme (by filename-derived id) or, as a base case, be left unset / point
// at something we don't recognize as custom (assumed to be a built-in theme
// id, which the renderer resolves on its own via getAppTheme).
const resolveExtends = (
    id: string,
    byId: Map<string, RawCustomTheme & { themeDir: string }>,
    visited: Set<string> = new Set(),
    depth = 0,
): {
    extendsBuiltIn?: string;
    fields: Omit<CustomTheme, 'error' | 'filename' | 'id' | 'label'>;
    invalidColorKeys: string[];
} => {
    const raw = byId.get(id);

    if (!raw) {
        return { fields: { mode: 'dark' }, invalidColorKeys: [] };
    }

    if (visited.has(id) || depth > MAX_EXTENDS_DEPTH) {
        console.warn(
            `Custom theme "${id}" has a circular or too-deep "extends" chain, ignoring it`,
        );
        return { fields: { mode: 'dark' }, invalidColorKeys: [] };
    }

    visited.add(id);

    const ownStylesheetPaths = resolveStylesheetPaths(raw.themeDir, raw.stylesheets);
    const { invalidKeys, sanitized: sanitizedColors } = sanitizeColors(raw.colors, id);
    const ownFields: Omit<CustomTheme, 'error' | 'filename' | 'id' | 'label'> = {
        app: raw.app,
        colors: sanitizedColors,
        mantineOverride: raw.mantineOverride,
        mode: raw.mode ?? 'dark',
        stylesheetPaths: ownStylesheetPaths,
    };

    if (!raw.extends) {
        return { fields: ownFields, invalidColorKeys: invalidKeys };
    }

    // extends points at another custom theme we have on disk
    if (byId.has(raw.extends)) {
        const { fields: parentFields, invalidColorKeys: parentInvalidKeys } = resolveExtends(
            raw.extends,
            byId,
            visited,
            depth + 1,
        );
        return {
            fields: mergeThemeFields(parentFields, ownFields),
            invalidColorKeys: [...parentInvalidKeys, ...invalidKeys],
        };
    }

    // extends points at something we don't have as a custom theme file;
    // treat it as a built-in theme id and let the renderer merge it, since
    // only the renderer has access to the built-in theme definitions.
    return { extendsBuiltIn: raw.extends, fields: ownFields, invalidColorKeys: invalidKeys };
};

const loadThemesFromDisk = async (): Promise<CustomTheme[]> => {
    await fs.mkdir(themesPath, { recursive: true });

    const entries = await fs.readdir(themesPath, { withFileTypes: true });

    const jsonFiles: typeof entries = [];

    for (const entry of entries) {
        if (!entry.name.toLowerCase().endsWith(JSON_EXTENSION)) continue;

        const fullPath = path.join(themesPath, entry.name);

        try {
            const stat = await fs.stat(fullPath); // follows symlinks
            if (stat.isFile()) {
                jsonFiles.push(entry);
            }
        } catch {
            // broken symlink or inaccessible file
        }
    }

    const byId = new Map<string, RawCustomTheme & { themeDir: string }>();
    const parseErrors = new Map<string, string>();

    await Promise.all(
        jsonFiles.map(async (entry) => {
            const id = idFromFilename(entry.name);
            const filePath = path.join(themesPath, entry.name);

            try {
                const raw = await readJsonFile(filePath);
                byId.set(id, { ...raw, themeDir: themesPath });
            } catch (error) {
                parseErrors.set(id, error instanceof Error ? error.message : String(error));
            }
        }),
    );

    const themes: CustomTheme[] = [];

    for (const entry of jsonFiles) {
        const id = idFromFilename(entry.name);

        if (parseErrors.has(id)) {
            themes.push({
                error: parseErrors.get(id),
                filename: entry.name,
                id,
                label: labelFromId(id),
                mode: 'dark',
            });
            continue;
        }

        const { extendsBuiltIn, fields, invalidColorKeys } = resolveExtends(id, byId);
        const stylesheetContents = await readStylesheetContents(fields.stylesheetPaths ?? []);

        themes.push({
            ...fields,
            extends: extendsBuiltIn,
            filename: entry.name,
            id,
            label: labelFromId(id),
            stylesheetContents,
            stylesheetPaths: undefined,
            warnings:
                invalidColorKeys.length > 0
                    ? [`Ignored invalid color value(s) for: ${invalidColorKeys.join(', ')}`]
                    : undefined,
        });
    }

    return themes.sort((a, b) => a.label.localeCompare(b.label));
};

const broadcastThemes = (themes: CustomTheme[]) => {
    BrowserWindow.getAllWindows().forEach((window) => {
        window.webContents.send('custom-themes-updated', themes);
    });
};

const reloadThemes = async () => {
    try {
        cache = await loadThemesFromDisk();
        broadcastThemes(cache);
    } catch (error) {
        console.error('Failed to load custom themes', error);
    }
};

const scheduleReload = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        reloadThemes().catch((error) => console.error('Failed to reload custom themes', error));
    }, RELOAD_DEBOUNCE_MS);
};

const startWatcher = async () => {
    if (watcher) return;

    await fs.mkdir(themesPath, { recursive: true });

    try {
        watcher = fsWatch(themesPath, (_eventType, filename) => {
            if (!filename) {
                // Some platforms omit the filename on certain events (e.g. a
                // whole-directory rename); safest to just reload.
                scheduleReload();
                return;
            }

            // We only care about additions/removals/edits of .json theme
            // files themselves. Linked stylesheets are re-read on demand
            // as part of loading their parent theme, so we don't need a
            // dedicated watch for those files here; edit the .json (or its
            // mtime) to pick up stylesheet edits, or just reload manually.
            if (filename.toLowerCase().endsWith(JSON_EXTENSION)) {
                scheduleReload();
            }
        });
    } catch (error) {
        console.error('Failed to watch themes folder', error);
    }
};

ipcMain.handle('custom-themes-get', async () => {
    if (cache.length === 0) {
        await reloadThemes();
    }
    return cache;
});

ipcMain.handle('custom-themes-open-folder', async () => {
    await fs.mkdir(themesPath, { recursive: true });
    await shell.openPath(themesPath);
    return true;
});

ipcMain.handle('custom-themes-reload', async () => {
    await reloadThemes();
    return cache;
});

app.whenReady()
    .then(async () => {
        await startWatcher();
        await reloadThemes();
    })
    .catch((error) => console.error('Failed to initialize custom themes', error));

app.on('before-quit', () => {
    if (watcher) {
        watcher.close();
        watcher = null;
    }

    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
    }
});
