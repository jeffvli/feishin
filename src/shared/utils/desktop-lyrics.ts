import { z } from 'zod';

import type {
    DesktopLyricsSettings,
    DesktopLyricsSnapshot,
    DesktopLyricsTextStyle,
} from '../types/desktop-lyrics';

export const getDesktopLyricsTrackKey = (
    song: undefined | { _serverId: string; _uniqueId: string; id: string },
): null | string => (song ? JSON.stringify([song._serverId, song.id, song._uniqueId]) : null);

const getVisibleDesktopLyrics = (
    lines: string[],
    settings: Partial<Pick<DesktopLyricsSettings, 'displayMode' | 'translationBelow'>> &
        Pick<DesktopLyricsSettings, 'showTranslation' | 'splitSlashLyrics'>,
    translatedText?: string,
): string[] => {
    let original: string | undefined;
    let translation: string | undefined;
    if (lines[0]?.includes('_BREAK_')) {
        // NetEase merges original then translation using this delimiter.
        [original, translation] = lines[0].split('_BREAK_');
    } else if (
        settings.splitSlashLyrics !== false &&
        lines.length === 1 &&
        lines[0].includes('/')
    ) {
        const parts = lines[0]
            .split(/\/(?![^<]*>)/)
            .map((part) => part.trim())
            .filter(Boolean);
        // Slash format is explicitly translation / original.
        if (parts.length >= 2) [translation, original] = parts.slice(-2);
        else [original] = lines;
    } else {
        [original, translation] = lines;
    }
    if (translatedText !== undefined) translation = translatedText;
    if (original === undefined) return [];
    const mode = settings.displayMode ?? (settings.showTranslation ? 'both' : 'original');
    // A single available row is shown in either single-language mode.
    if (translation === undefined) return [original];
    if (mode === 'translation') return [translation];
    if (mode === 'original') return [original];
    return settings.translationBelow !== false ? [original, translation] : [translation, original];
};

export const getDesktopLyricsPair = (
    snapshot: DesktopLyricsSnapshot,
    settings: Partial<Pick<DesktopLyricsSettings, 'displayMode' | 'translationBelow'>> &
        Pick<
            DesktopLyricsSettings,
            'showTranslation' | 'singleLine' | 'splitSlashLyrics'
        > = defaultDesktopLyricsSettings,
): [string[], string[]] => {
    const groups = new Map<number, string[]>();
    for (const line of snapshot.lines) {
        const group = groups.get(line.startMs);
        if (group) {
            group.push(line.text);
        } else {
            groups.set(line.startMs, [line.text]);
        }
    }
    const entries = Array.from(groups);
    const timeMs = snapshot.timestamp * 1000 + snapshot.offsetMs;
    let index = -1;
    for (let i = 0; i < entries.length; i += 1) {
        if (entries[i][0] > timeMs) {
            break;
        }
        index = i;
    }
    const translated = (entry: [number, string[]]) =>
        snapshot.translationLines?.find((line) => line.startMs === entry[0])?.text;
    return [
        entries[index]
            ? getVisibleDesktopLyrics(entries[index][1], settings, translated(entries[index]))
            : [snapshot.title],
        settings.singleLine
            ? []
            : getVisibleDesktopLyrics(
                  entries[index + 1]?.[1] ?? [],
                  settings,
                  entries[index + 1] ? translated(entries[index + 1]) : undefined,
              ),
    ];
};

export const isDesktopLyricsCurrentOnBottom = (
    snapshot: DesktopLyricsSnapshot | null,
    settings: Pick<DesktopLyricsSettings, 'rollingMode' | 'singleLine'>,
): boolean => {
    if (!snapshot || !settings.rollingMode || settings.singleLine) return false;
    const starts = Array.from(new Set(snapshot.lines.map((line) => line.startMs)));
    const timeMs = snapshot.timestamp * 1000 + snapshot.offsetMs;
    const index = starts.findIndex((start) => start > timeMs);
    const currentIndex = (index < 0 ? starts.length : index) - 1;
    return currentIndex >= 0 && currentIndex % 2 === 1;
};

export const isNativeWayland = (ozonePlatform: string, sessionType?: string): boolean =>
    ozonePlatform === 'wayland' || (ozonePlatform !== 'x11' && sessionType === 'wayland');

export const getDesktopLyricsTiming = (
    snapshot: DesktopLyricsSnapshot,
): null | { durationMs: number; startMs: number } => {
    const starts = Array.from(new Set(snapshot.lines.map((line) => line.startMs)));
    const timeMs = snapshot.timestamp * 1000 + snapshot.offsetMs;
    let index = -1;
    for (let i = 0; i < starts.length; i += 1) {
        if (starts[i] > timeMs) break;
        index = i;
    }
    if (index < 0) return null;
    const endMs = starts[index + 1] ?? (snapshot.durationMs ?? 0) + snapshot.offsetMs;
    const gap = endMs - starts[index];
    return { durationMs: gap > 0 ? gap : 4000, startMs: starts[index] };
};

export const applyDesktopLyricsTime = (
    snapshot: DesktopLyricsSnapshot,
    update: { timestamp: number; trackKey: null | string },
): DesktopLyricsSnapshot =>
    update.trackKey === snapshot.trackKey && Number.isFinite(update.timestamp)
        ? { ...snapshot, timestamp: update.timestamp }
        : snapshot;

export const desktopLyricsFontSchema = z.union([
    z
        .object({
            builtIn: z.enum(['Inter', 'Poppins', 'system-ui', 'serif', 'monospace']),
            custom: z
                .string()
                .max(4096)
                .regex(/^(?:\/|[a-zA-Z]:[\\/]|\\\\)/)
                .regex(/\.(?:ttc|ttf|otf|woff2?)$/i)
                .nullable(),
            system: z
                .string()
                .min(1)
                .max(256)
                .regex(/^[^"'\\\r\n;{}]+$/)
                .nullable(),
            type: z.enum(['builtIn', 'system', 'custom']),
        })
        .strict(),
    // Migrate the original generic-font preferences without losing their appearance.
    z.enum(['sans', 'serif', 'monospace']).transform((font) => ({
        builtIn: font === 'sans' ? ('system-ui' as const) : font,
        custom: null,
        system: null,
        type: 'builtIn' as const,
    })),
]);

const desktopLyricsColorSchema = z
    .string()
    .max(32)
    .refine((value) => {
        if (/^#[0-9a-f]{6}$/i.test(value)) return true;
        const rgb = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/.exec(value);
        return !!rgb && rgb.slice(1).every((channel) => Number(channel) <= 255);
    });

const desktopLyricsTextStyleSchema = z
    .object({
        font: desktopLyricsFontSchema,
        fontColor: desktopLyricsColorSchema,
        fontGradient: z.boolean(),
        fontGradientColor: desktopLyricsColorSchema,
        fontGradientTop: desktopLyricsColorSchema,
        fontOpacity: z.number().int().min(0).max(100),
        fontSize: z.number().int().min(1).max(128),
        outline: z.number().int().min(0).max(20),
        outlineColor: desktopLyricsColorSchema,
    })
    .strict();

const legacyNextStyle: DesktopLyricsTextStyle = {
    font: { builtIn: 'Inter', custom: null, system: null, type: 'builtIn' },
    fontColor: '#ffffff',
    fontGradient: true,
    fontGradientColor: 'rgb(53, 116, 252)',
    fontGradientTop: 'rgb(237, 237, 237)',
    fontOpacity: 80,
    fontSize: 24,
    outline: 1,
    outlineColor: '#000000',
};

const defaultNextStyle: DesktopLyricsTextStyle = {
    font: { builtIn: 'Poppins', custom: null, system: null, type: 'builtIn' },
    fontColor: 'rgb(255, 64, 64)',
    fontGradient: true,
    fontGradientColor: 'rgb(245, 184, 78)',
    fontGradientTop: 'rgb(255, 255, 255)',
    fontOpacity: 100,
    fontSize: 21,
    outline: 2,
    outlineColor: 'rgb(0, 0, 0)',
};

export const desktopLyricsSettingsSchema = z.preprocess(
    (input) => {
        if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
        const value = input as Record<string, unknown>;
        // Preserve saved styles from versions without initialization markers.
        return {
            ...value,
            displayMode:
                value.displayMode ?? (value.showTranslation === false ? 'original' : 'both'),
            nextStyleInitialized: value.nextStyleInitialized ?? value.nextStyle !== undefined,
            nextTranslationStyleInitialized:
                value.nextTranslationStyleInitialized ?? value.nextTranslationStyle !== undefined,
            translationStyleInitialized:
                value.translationStyleInitialized ??
                Object.keys(value).some(
                    (key) =>
                        key.startsWith('translation') &&
                        key !== 'translationIndependent' &&
                        key !== 'translationBelow' &&
                        key !== 'translationStyleInitialized',
                ),
        };
    },
    z
        .object({
            backgroundOpacity: z.number().int().min(0).max(100).default(35),
            displayMode: z.enum(['both', 'original', 'translation']),
            font: desktopLyricsFontSchema,
            fontColor: desktopLyricsColorSchema.default('#ffffff'),
            fontGradient: z.boolean().default(false),
            fontGradientColor: desktopLyricsColorSchema.optional(),
            fontGradientTop: desktopLyricsColorSchema.optional(),
            fontOpacity: z.number().int().min(0).max(100).default(100),
            fontSize: z.number().int().min(1).max(128),
            layout: z.enum(['center', 'diagonal']),
            nextIndependent: z.boolean().default(false),
            nextStyle: desktopLyricsTextStyleSchema.default(legacyNextStyle),
            nextStyleInitialized: z.boolean().default(false),
            nextTranslationIndependent: z.boolean().default(false),
            nextTranslationStyle: desktopLyricsTextStyleSchema.default({
                ...legacyNextStyle,
                fontSize: 20,
            }),
            nextTranslationStyleInitialized: z.boolean().default(false),
            // Preferences saved while outline was removed keep all other settings.
            outline: z
                .union([
                    z.number().int().min(0).max(20),
                    z
                        .enum(['none', 'thin', 'thick'])
                        .transform((value) => ({ none: 0, thick: 2, thin: 1 })[value]),
                ])
                .default(1),
            outlineColor: desktopLyricsColorSchema.default('#000000'),
            rollingMode: z.boolean().default(false),
            shadow: z.boolean(),
            showTranslation: z.boolean().default(true),
            singleLine: z.boolean().default(false),
            splitSlashLyrics: z.boolean().default(true),
            translationBelow: z.boolean().default(true),
            translationFont: desktopLyricsFontSchema.optional(),
            translationFontColor: desktopLyricsColorSchema.default('#ffffff'),
            translationFontGradient: z.boolean().default(false),
            translationFontGradientColor: desktopLyricsColorSchema.optional(),
            translationFontGradientTop: desktopLyricsColorSchema.optional(),
            translationFontOpacity: z.number().int().min(0).max(100).default(100),
            translationFontSize: z.number().int().min(1).max(128).optional(),
            translationIndependent: z.boolean().default(false),
            translationOutline: z.number().int().min(0).max(20).optional(),
            translationOutlineColor: desktopLyricsColorSchema.optional(),
            translationStyleInitialized: z.boolean().default(false),
            transparentBackground: z.boolean().default(true),
            widthCharacters: z.number().int().min(10).max(50).default(20),
        })
        .strict()
        .transform((value) => ({
            ...value,
            fontGradientColor: value.fontGradientColor ?? value.fontColor,
            fontGradientTop: value.fontGradientTop ?? value.fontColor,
            showTranslation: value.displayMode === 'both',
            // Existing preferences retain the same font and size for every line.
            translationFont: value.translationFont ?? value.font,
            translationFontGradientColor:
                value.translationFontGradientColor ?? value.translationFontColor,
            translationFontGradientTop:
                value.translationFontGradientTop ?? value.translationFontColor,
            translationFontSize: value.translationFontSize ?? value.fontSize,
            translationOutline: value.translationOutline ?? value.outline,
            translationOutlineColor: value.translationOutlineColor ?? value.outlineColor,
        })),
);

export const defaultDesktopLyricsSettings: DesktopLyricsSettings = {
    backgroundOpacity: 10,
    displayMode: 'both',
    font: { builtIn: 'Poppins', custom: null, system: null, type: 'builtIn' },
    fontColor: 'rgb(255, 64, 64)',
    fontGradient: true,
    fontGradientColor: 'rgb(214, 81, 63)',
    fontGradientTop: 'rgb(255, 255, 255)',
    fontOpacity: 100,
    fontSize: 24,
    layout: 'diagonal',
    nextIndependent: true,
    nextStyle: defaultNextStyle,
    nextStyleInitialized: true,
    nextTranslationIndependent: false,
    nextTranslationStyle: { ...defaultNextStyle, fontSize: 16 },
    nextTranslationStyleInitialized: false,
    outline: 2,
    outlineColor: 'rgb(0, 0, 0)',
    rollingMode: true,
    shadow: true,
    showTranslation: true,
    singleLine: false,
    splitSlashLyrics: true,
    translationBelow: true,
    translationFont: { builtIn: 'Poppins', custom: null, system: null, type: 'builtIn' },
    translationFontColor: 'rgb(255, 64, 64)',
    translationFontGradient: true,
    translationFontGradientColor: 'rgb(214, 81, 63)',
    translationFontGradientTop: 'rgb(255, 255, 255)',
    translationFontOpacity: 100,
    translationFontSize: 19,
    translationIndependent: false,
    translationOutline: 2,
    translationOutlineColor: 'rgb(0, 0, 0)',
    translationStyleInitialized: false,
    transparentBackground: true,
    widthCharacters: 20,
};

// Screen height uses physical pixels, matching the desktop lyrics controls.
export const getDefaultDesktopLyricsSettings = (screenHeight: number): DesktopLyricsSettings => {
    const fontSize = Math.floor((screenHeight / 1080) * 24);
    const nextFontSize = Math.floor(fontSize * 0.9);
    return {
        ...defaultDesktopLyricsSettings,
        fontSize,
        nextStyle: { ...defaultNextStyle, fontSize: nextFontSize },
        nextTranslationStyle: { ...defaultNextStyle, fontSize: Math.floor(nextFontSize * 0.8) },
        translationFontSize: Math.floor(fontSize * 0.8),
    };
};

export const getDesktopLyricsTextStyle = (
    settings: DesktopLyricsSettings,
): DesktopLyricsTextStyle => ({
    font: settings.font,
    fontColor: settings.fontColor,
    fontGradient: settings.fontGradient,
    fontGradientColor: settings.fontGradientColor,
    fontGradientTop: settings.fontGradientTop,
    fontOpacity: settings.fontOpacity,
    fontSize: settings.fontSize,
    outline: settings.outline,
    outlineColor: settings.outlineColor,
});

export const getEffectiveDesktopLyricsSettings = (
    settings: DesktopLyricsSettings,
): DesktopLyricsSettings => {
    const primary = getDesktopLyricsTextStyle(settings);
    const translation: DesktopLyricsTextStyle = settings.translationIndependent
        ? {
              font: settings.translationFont,
              fontColor: settings.translationFontColor,
              fontGradient: settings.translationFontGradient,
              fontGradientColor: settings.translationFontGradientColor,
              fontGradientTop: settings.translationFontGradientTop,
              fontOpacity: settings.translationFontOpacity,
              fontSize: settings.translationFontSize,
              outline: settings.translationOutline,
              outlineColor: settings.translationOutlineColor,
          }
        : { ...primary, fontSize: Math.floor(primary.fontSize * 0.8) };
    const nextStyle = settings.nextIndependent
        ? settings.nextStyle
        : {
              ...primary,
              fontOpacity: primary.fontOpacity * 0.8,
              fontSize: (primary.fontSize * 20) / 26,
          };
    const nextTranslationStyle = settings.nextTranslationIndependent
        ? settings.nextTranslationStyle
        : settings.nextIndependent
          ? { ...nextStyle, fontSize: Math.floor(nextStyle.fontSize * 0.8) }
          : {
                ...translation,
                fontOpacity: translation.fontOpacity * 0.8,
                fontSize: (translation.fontSize * 20) / 26,
            };
    return {
        ...settings,
        nextStyle,
        nextTranslationStyle,
        translationFont: translation.font,
        translationFontColor: translation.fontColor,
        translationFontGradient: translation.fontGradient,
        translationFontGradientColor: translation.fontGradientColor,
        translationFontGradientTop: translation.fontGradientTop,
        translationFontOpacity: translation.fontOpacity,
        translationFontSize: translation.fontSize,
        translationOutline: translation.outline,
        translationOutlineColor: translation.outlineColor,
    };
};

export const setDesktopLyricsIndependent = (
    settings: DesktopLyricsSettings,
    key: 'nextIndependent' | 'nextTranslationIndependent' | 'translationIndependent',
    enabled: boolean,
): DesktopLyricsSettings => {
    const updated = { ...settings, [key]: enabled };
    if (!enabled) return updated;
    if (key === 'nextIndependent') {
        if (!settings.nextStyleInitialized) updated.nextStyle = getDesktopLyricsTextStyle(settings);
        updated.nextStyleInitialized = true;
    } else if (key === 'nextTranslationIndependent') {
        if (!settings.nextTranslationStyleInitialized) {
            const original = getEffectiveDesktopLyricsSettings(settings).nextStyle;
            updated.nextTranslationStyle = {
                ...original,
                fontOpacity: Math.round(original.fontOpacity),
                fontSize: Math.max(1, Math.round(original.fontSize)),
            };
        }
        updated.nextTranslationStyleInitialized = true;
    } else {
        if (!settings.translationStyleInitialized) {
            updated.translationFont = settings.font;
            updated.translationFontColor = settings.fontColor;
            updated.translationFontGradient = settings.fontGradient;
            updated.translationFontGradientColor = settings.fontGradientColor;
            updated.translationFontGradientTop = settings.fontGradientTop;
            updated.translationFontOpacity = settings.fontOpacity;
            updated.translationFontSize = settings.fontSize;
            updated.translationOutline = settings.outline;
            updated.translationOutlineColor = settings.outlineColor;
        }
        updated.translationStyleInitialized = true;
    }
    return updated;
};

export const getDesktopLyricsFontSizes = (
    current: string[],
    next: string[],
    fontSize: number,
    availableHeight: number,
    translationFontSize = fontSize,
    nextFontSize = (fontSize * 20) / 26,
    nextTranslationFontSize = (translationFontSize * 20) / 26,
    hasRomaji = false,
): [number, number, number, number] => {
    const height = (lines: string[], primarySize: number, translatedSize: number) =>
        lines.reduce(
            (sum, line, index) =>
                sum +
                (line.split('_BREAK_').length + (line.includes('<ruby>') ? 0.5 : 0)) *
                    (hasRomaji ? 1.8 : 1) *
                    (index === lines.length - 1 ? primarySize : translatedSize),
            0,
        );
    const scale = Math.min(
        1,
        availableHeight /
            Math.max(
                1,
                1.2 *
                    (height(current, fontSize, translationFontSize) +
                        height(next, nextFontSize, nextTranslationFontSize)),
            ),
    );
    return [
        fontSize * scale,
        nextFontSize * scale,
        translationFontSize * scale,
        nextTranslationFontSize * scale,
    ];
};

// Screen height is in physical pixels, not the reduced desktop work area.
export const getDesktopLyricsControlsLayout = (screenHeight: number) => {
    const iconSize = Math.floor((screenHeight / 1080) * 18);
    return { buttonSize: iconSize + 16, chromeHeight: iconSize + 40, iconSize };
};

// Use the largest timestamp group for stable sizing throughout a track.
export const getDesktopLyricsWindowSize = (
    snapshot: DesktopLyricsSnapshot | null,
    settings: DesktopLyricsSettings,
    workArea: { height: number; width: number },
    screenHeight = 1080,
): { height: number; width: number } => {
    settings = getEffectiveDesktopLyricsSettings(settings);
    const controls = getDesktopLyricsControlsLayout(screenHeight);
    const groups = new Map<number, string[]>();
    for (const line of snapshot?.lines ?? []) {
        const group = groups.get(line.startMs) ?? [];
        group.push(line.text);
        groups.set(line.startMs, group);
    }
    let groupHeight = settings.fontSize;
    let nextGroupHeight = settings.nextStyle.fontSize;
    for (const [startMs, lines] of groups) {
        const visible = getVisibleDesktopLyrics(
            lines,
            settings,
            snapshot?.translationLines?.find((line) => line.startMs === startMs)?.text,
        );
        nextGroupHeight = Math.max(
            nextGroupHeight,
            visible.reduce(
                (sum, line, index) =>
                    sum +
                    (line.split('_BREAK_').length + (line.includes('<ruby>') ? 0.5 : 0)) *
                        (snapshot?.romajiLines?.length ? 1.8 : 1) *
                        (index === visible.length - 1
                            ? settings.nextStyle.fontSize
                            : settings.nextTranslationStyle.fontSize),
                0,
            ),
        );
        groupHeight = Math.max(
            groupHeight,
            visible.reduce(
                (sum, line, index) =>
                    sum +
                    (line.split('_BREAK_').length + (line.includes('<ruby>') ? 0.5 : 0)) *
                        (snapshot?.romajiLines?.length ? 1.8 : 1) *
                        (index === visible.length - 1
                            ? settings.fontSize
                            : settings.translationFontSize),
                0,
            ),
        );
    }
    return {
        height: Math.min(
            workArea.height,
            Math.max(
                112 + controls.chromeHeight,
                Math.ceil(
                    controls.chromeHeight +
                        (groupHeight + (settings.singleLine ? 0 : nextGroupHeight)) * 1.2,
                ),
            ),
        ),
        // Approximate full-width glyph capacity, plus 16px side padding.
        width: Math.min(
            workArea.width,
            Math.max(
                Math.ceil(settings.fontSize * settings.widthCharacters + 32),
                controls.buttonSize * 5 + 40,
            ),
        ),
    };
};
