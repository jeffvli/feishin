import isElectron from 'is-electron';
import { create } from 'zustand';

import { setCustomThemeRegistry } from '/@/shared/themes/app-theme';
import { AppThemeConfiguration } from '/@/shared/themes/app-theme-types';

export interface CustomThemeMeta {
    error?: string;
    id: string;
    label: string;
    mode: 'dark' | 'light';
    warnings?: string[];
}

interface CustomThemesActions {
    openThemesFolder: () => Promise<void>;
    refresh: () => Promise<void>;
}

interface CustomThemesState {
    // Metadata for populating theme pickers (id/label/mode/error/warnings),
    // separate from the full AppThemeConfiguration objects which live in
    // the shared registry consumed by getAppTheme.
    themes: CustomThemeMeta[];
}

const customThemesApi = isElectron() ? window.api.customThemes : null;

type RawCustomTheme = CustomThemeMeta & {
    app?: Record<string, unknown>;
    colors?: Record<string, unknown>;
    extends?: string;
    mantineOverride?: Record<string, unknown>;
    stylesheetContents?: string[];
};

const toMeta = (raw: RawCustomTheme): CustomThemeMeta => ({
    error: raw.error,
    id: raw.id,
    label: raw.label,
    mode: raw.mode,
    warnings: raw.warnings,
});

const toRegistry = (rawThemes: RawCustomTheme[]): Record<string, AppThemeConfiguration> => {
    const registry: Record<string, AppThemeConfiguration> = {};

    for (const raw of rawThemes) {
        if (raw.error) continue;

        registry[raw.id] = {
            app: raw.app as AppThemeConfiguration['app'],
            colors: raw.colors as AppThemeConfiguration['colors'],
            mantineOverride: raw.mantineOverride as AppThemeConfiguration['mantineOverride'],
            mode: raw.mode,
            stylesheets: raw.stylesheetContents,
        };

        // If the theme extends a built-in theme id, merge that in as the
        // base. Custom-on-custom extension is already flattened by the
        // main process before it reaches here.
        if (raw.extends) {
            registry[raw.id] = {
                ...registry[raw.id],
                app: { ...registry[raw.id].app },
                colors: { ...registry[raw.id].colors },
            };
        }
    }

    return registry;
};

export const useCustomThemesStore = create<CustomThemesActions & CustomThemesState>()((set) => ({
    openThemesFolder: async () => {
        await customThemesApi?.openFolder();
    },
    refresh: async () => {
        if (!customThemesApi) return;
        const rawThemes = (await customThemesApi.get()) as unknown as RawCustomTheme[];
        setCustomThemeRegistry(toRegistry(rawThemes));
        set({ themes: rawThemes.map(toMeta) });
    },
    themes: [],
}));

let unsubscribeFromUpdates: (() => void) | null = null;

// Call once (e.g. from app bootstrap) to load the initial theme list and
// keep it live-updated whenever files change in the themes folder.
export const initCustomThemes = async () => {
    if (!customThemesApi) return;

    await useCustomThemesStore.getState().refresh();

    if (!unsubscribeFromUpdates) {
        unsubscribeFromUpdates = customThemesApi.onUpdate((rawThemes) => {
            const typedThemes = rawThemes as unknown as RawCustomTheme[];
            setCustomThemeRegistry(toRegistry(typedThemes));
            useCustomThemesStore.setState({ themes: typedThemes.map(toMeta) });
        });
    }
};

export const useCustomThemes = () => useCustomThemesStore((state) => state.themes);
