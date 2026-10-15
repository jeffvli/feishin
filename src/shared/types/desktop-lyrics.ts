export type DesktopLyricsFont = {
    builtIn: 'Inter' | 'monospace' | 'Poppins' | 'serif' | 'system-ui';
    custom: null | string;
    system: null | string;
    type: 'builtIn' | 'custom' | 'system';
};

export type DesktopLyricsLabels = {
    close: string;
    title?: string;
    unlock: string;
};

// Keep persisted font/translation field names: emphasis below, supporting text above.
export type DesktopLyricsSettings = {
    backgroundOpacity: number;
    displayMode: 'both' | 'original' | 'translation';
    font: DesktopLyricsFont;
    fontColor: string;
    fontGradient: boolean;
    fontGradientColor: string;
    fontGradientTop: string;
    fontOpacity: number;
    fontSize: number;
    layout: 'center' | 'diagonal';
    nextIndependent: boolean;
    nextStyle: DesktopLyricsTextStyle;
    nextStyleInitialized: boolean;
    nextTranslationIndependent: boolean;
    nextTranslationStyle: DesktopLyricsTextStyle;
    nextTranslationStyleInitialized: boolean;
    outline: number;
    outlineColor: string;
    rollingMode: boolean;
    shadow: boolean;
    // Legacy compatibility value, derived from displayMode. UI uses the three modes.
    showTranslation: boolean;
    singleLine: boolean;
    splitSlashLyrics: boolean;
    translationBelow: boolean;
    translationFont: DesktopLyricsFont;
    translationFontColor: string;
    translationFontGradient: boolean;
    translationFontGradientColor: string;
    translationFontGradientTop: string;
    translationFontOpacity: number;
    translationFontSize: number;
    translationIndependent: boolean;
    translationOutline: number;
    translationOutlineColor: string;
    translationStyleInitialized: boolean;
    transparentBackground: boolean;
    widthCharacters: number;
};

export type DesktopLyricsSnapshot = {
    durationMs?: number;
    language: string;
    lines: { startMs: number; text: string }[];
    offsetMs: number;
    playing: boolean;
    romajiLines?: { startMs: number; text: string }[];
    timestamp: number;
    title: string;
    trackKey: null | string;
    translationLines?: { startMs: number; text: string }[];
};

export type DesktopLyricsState = {
    locked: boolean;
    open: boolean;
    revision: number;
    wayland: boolean;
};

export type DesktopLyricsTextStyle = Pick<
    DesktopLyricsSettings,
    | 'font'
    | 'fontColor'
    | 'fontGradient'
    | 'fontGradientColor'
    | 'fontGradientTop'
    | 'fontOpacity'
    | 'fontSize'
    | 'outline'
    | 'outlineColor'
>;

export type DesktopLyricsUpdate = {
    revision: number;
    screenHeight?: number;
    snapshot: DesktopLyricsSnapshot | null;
};
