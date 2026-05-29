import type { PlayerFilter, SettingsState } from './settings.store';

import { sanitizeCss } from '/@/renderer/utils/sanitize';

const PLAYER_FILTER_FIELDS = new Set([
    'albumArtist',
    'artist',
    'duration',
    'favorite',
    'genre',
    'name',
    'note',
    'path',
    'playCount',
    'rating',
    'year',
]);

const PLAYER_FILTER_OPERATORS = new Set([
    'after',
    'afterDate',
    'before',
    'beforeDate',
    'contains',
    'endsWith',
    'gt',
    'inTheLast',
    'inTheRange',
    'inTheRangeDate',
    'is',
    'isNot',
    'lt',
    'notContains',
    'notInTheLast',
    'regex',
    'startsWith',
]);

function isValidPlayerFilter(item: unknown): item is PlayerFilter {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
    const o = item as Record<string, unknown>;
    if (typeof o.id !== 'string') return false;
    if (typeof o.field !== 'string' || !PLAYER_FILTER_FIELDS.has(o.field)) return false;
    if (typeof o.operator !== 'string' || !PLAYER_FILTER_OPERATORS.has(o.operator)) return false;
    if (!isValidPlayerFilterValue(o.value)) return false;
    if (o.isEnabled !== undefined && typeof o.isEnabled !== 'boolean') return false;
    return true;
}

function isValidPlayerFilterValue(value: unknown): boolean {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return true;
    }
    if (!Array.isArray(value)) return false;
    return value.every((v) => typeof v === 'string' || typeof v === 'number');
}

function parsePlaybackFiltersJson(raw: string): unknown {
    const t = raw.trim();
    if (t === '') return undefined;
    try {
        const v = JSON.parse(t) as unknown;
        if (!Array.isArray(v)) return undefined;
        if (!v.every(isValidPlayerFilter)) return undefined;
        return v;
    } catch {
        return undefined;
    }
}

const APP_THEMES = new Set([
    'ayuDark',
    'ayuLight',
    'catppuccinLatte',
    'catppuccinMocha',
    'defaultDark',
    'defaultLight',
    'dracula',
    'everforestDark',
    'everforestLight',
    'githubDark',
    'githubLight',
    'glassyDark',
    'gruvboxDark',
    'gruvboxLight',
    'highContrastDark',
    'highContrastLight',
    'materialDark',
    'materialLight',
    'monokai',
    'nightOwl',
    'nord',
    'oneDark',
    'rosePine',
    'rosePineDawn',
    'rosePineMoon',
    'shadesOfPurple',
    'solarizedDark',
    'solarizedLight',
    'tokyoNight',
    'vscodeDarkPlus',
    'vscodeLightPlus',
]);

const DISCORD_DISPLAY_TYPES = new Set(['artist', 'feishin', 'song']);
const DISCORD_LINK_TYPES = new Set(['last_fm', 'musicbrainz', 'musicbrainz_last_fm', 'none']);
const LYRICS_ALIGNMENTS = new Set(['center', 'left', 'right']);
const FONT_TYPES = new Set(['builtIn', 'custom', 'system']);
const HOME_FEATURE_STYLES = new Set(['multiple', 'single']);
const SIDE_QUEUE_TYPES = new Set(['sideDrawerQueue', 'sideQueue']);
const SIDE_QUEUE_LAYOUTS = new Set(['horizontal', 'vertical']);
const SIDEBAR_PLAYLIST_FOLDER_VIEWS = new Set(['navigation', 'single', 'tree']);
const SIDEBAR_PLAYLIST_MODES = new Set(['compact', 'expanded']);
const AUTO_DJ_MODES = new Set(['albums', 'songs']);
const AUTO_DJ_STRATEGIES = new Set(['library_random', 'similar']);

export type EnvSettingsOverrides = DeepPartial<
    Pick<SettingsState, 'autoDJ' | 'css' | 'discord' | 'font' | 'general' | 'lyrics' | 'playback'>
>;

type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

interface EnvSettingSpec {
    enumSet?: Set<string>;
    key: string;
    path: readonly string[];
    skipIfEmpty?: boolean;
    transform?: (raw: string) => unknown;
    type: 'bool' | 'enum' | 'num' | 'string';
}

function setAtPath(obj: EnvSettingsOverrides, path: readonly string[], value: unknown): void {
    if (path.length < 2) return;
    let cur: Record<string, unknown> = obj as Record<string, unknown>;
    for (let i = 0; i < path.length - 1; i++) {
        const key = path[i]!;
        const existing = cur[key];
        const next: Record<string, unknown> =
            existing !== null &&
            existing !== undefined &&
            typeof existing === 'object' &&
            !Array.isArray(existing)
                ? { ...(existing as Record<string, unknown>) }
                : {};
        cur[key] = next;
        cur = next;
    }
    cur[path[path.length - 1]!] = value;
}

const RGB_ACCENT_REGEX = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;

const ENV_SETTING_SPECS: EnvSettingSpec[] = [
    {
        key: 'FS_GENERAL_ACCENT',
        path: ['general', 'accent'],
        transform: (s) => (RGB_ACCENT_REGEX.test(s) ? s : undefined),
        type: 'string',
    },
    { key: 'FS_GENERAL_ALBUM_BACKGROUND', path: ['general', 'albumBackground'], type: 'bool' },
    {
        key: 'FS_GENERAL_ALBUM_BACKGROUND_BLUR',
        path: ['general', 'albumBackgroundBlur'],
        type: 'num',
    },
    { key: 'FS_GENERAL_ARTIST_BACKGROUND', path: ['general', 'artistBackground'], type: 'bool' },
    {
        key: 'FS_GENERAL_ARTIST_BACKGROUND_BLUR',
        path: ['general', 'artistBackgroundBlur'],
        type: 'num',
    },
    {
        key: 'FS_GENERAL_BLUR_EXPLICIT_IMAGES',
        path: ['general', 'blurExplicitImages'],
        type: 'bool',
    },
    {
        key: 'FS_GENERAL_COMBINED_LYRICS_AND_VISUALIZER',
        path: ['general', 'combinedLyricsAndVisualizer'],
        type: 'bool',
    },
    {
        key: 'FS_GENERAL_ENABLE_GRID_MULTI_SELECT',
        path: ['general', 'enableGridMultiSelect'],
        type: 'bool',
    },
    { key: 'FS_GENERAL_FOLLOW_CURRENT_SONG', path: ['general', 'followCurrentSong'], type: 'bool' },
    { key: 'FS_GENERAL_HOME_FEATURE', path: ['general', 'homeFeature'], type: 'bool' },
    {
        enumSet: HOME_FEATURE_STYLES,
        key: 'FS_GENERAL_HOME_FEATURE_STYLE',
        path: ['general', 'homeFeatureStyle'],
        type: 'enum',
    },
    {
        key: 'FS_GENERAL_LANGUAGE',
        path: ['general', 'language'],
        skipIfEmpty: true,
        type: 'string',
    },
    {
        key: 'FS_GENERAL_PRIMARY_SHADE',
        path: ['general', 'primaryShade'],
        transform: (s) => {
            const n = parseNum(s);
            return n !== undefined ? Math.min(9, Math.max(0, Math.round(n))) : undefined;
        },
        type: 'num',
    },
    { enumSet: APP_THEMES, key: 'FS_GENERAL_THEME', path: ['general', 'theme'], type: 'enum' },
    {
        enumSet: APP_THEMES,
        key: 'FS_GENERAL_THEME_DARK',
        path: ['general', 'themeDark'],
        type: 'enum',
    },
    {
        enumSet: APP_THEMES,
        key: 'FS_GENERAL_THEME_LIGHT',
        path: ['general', 'themeLight'],
        type: 'enum',
    },
    { key: 'FS_GENERAL_FOLLOW_SYSTEM_THEME', path: ['general', 'followSystemTheme'], type: 'bool' },
    { key: 'FS_GENERAL_PATH_REPLACE', path: ['general', 'pathReplace'], type: 'string' },
    { key: 'FS_GENERAL_PATH_REPLACE_WITH', path: ['general', 'pathReplaceWith'], type: 'string' },
    { key: 'FS_GENERAL_LASTFM_API_KEY', path: ['general', 'lastfmApiKey'], type: 'string' },
    { key: 'FS_GENERAL_LAST_FM', path: ['general', 'lastFM'], type: 'bool' },
    { key: 'FS_GENERAL_LISTEN_BRAINZ', path: ['general', 'listenBrainz'], type: 'bool' },
    { key: 'FS_GENERAL_MUSIC_BRAINZ', path: ['general', 'musicBrainz'], type: 'bool' },
    { key: 'FS_GENERAL_QOBUZ', path: ['general', 'qobuz'], type: 'bool' },
    { key: 'FS_GENERAL_SPOTIFY', path: ['general', 'spotify'], type: 'bool' },
    { key: 'FS_GENERAL_SPOTIFY_NATIVE_APP', path: ['general', 'nativeSpotify'], type: 'bool' },
    { key: 'FS_GENERAL_NATIVE_ASPECT_RATIO', path: ['general', 'nativeAspectRatio'], type: 'bool' },
    {
        key: 'FS_GENERAL_PLAYERBAR_OPEN_DRAWER',
        path: ['general', 'playerbarOpenDrawer'],
        type: 'bool',
    },
    { key: 'FS_GENERAL_EXTERNAL_LINKS', path: ['general', 'externalLinks'], type: 'bool' },
    {
        key: 'FS_GENERAL_SHOW_LYRICS_IN_SIDEBAR',
        path: ['general', 'showLyricsInSidebar'],
        type: 'bool',
    },
    { key: 'FS_GENERAL_SHOW_RATINGS', path: ['general', 'showRatings'], type: 'bool' },
    {
        key: 'FS_GENERAL_SHOW_VISUALIZER_IN_SIDEBAR',
        path: ['general', 'showVisualizerInSidebar'],
        type: 'bool',
    },
    {
        key: 'FS_GENERAL_SIDEBAR_COLLAPSED_NAVIGATION',
        path: ['general', 'sidebarCollapsedNavigation'],
        type: 'bool',
    },
    {
        key: 'FS_GENERAL_SIDEBAR_COLLAPSE_SHARED',
        path: ['general', 'sidebarCollapseShared'],
        type: 'bool',
    },
    {
        key: 'FS_GENERAL_SIDEBAR_PLAYLIST_FOLDERS',
        path: ['general', 'sidebarPlaylistFolders'],
        type: 'bool',
    },
    {
        key: 'FS_GENERAL_SIDEBAR_PLAYLIST_FOLDER_SEPARATOR',
        path: ['general', 'sidebarPlaylistFolderSeparator'],
        skipIfEmpty: true,
        type: 'string',
    },
    {
        key: 'FS_GENERAL_SIDEBAR_PLAYLIST_FOLDER_TREE_INDENT',
        path: ['general', 'sidebarPlaylistFolderTreeIndent'],
        transform: (s) => {
            const n = parseNum(s);
            return n !== undefined ? Math.min(64, Math.max(0, Math.round(n))) : undefined;
        },
        type: 'num',
    },
    {
        key: 'FS_GENERAL_SIDEBAR_PLAYLIST_FOLDER_TREE_LINE_COLOR',
        path: ['general', 'sidebarPlaylistFolderTreeLineColor'],
        type: 'string',
    },
    {
        enumSet: SIDEBAR_PLAYLIST_FOLDER_VIEWS,
        key: 'FS_GENERAL_SIDEBAR_PLAYLIST_FOLDER_VIEW',
        path: ['general', 'sidebarPlaylistFolderView'],
        type: 'enum',
    },
    {
        key: 'FS_GENERAL_SIDEBAR_PLAYLIST_LIST',
        path: ['general', 'sidebarPlaylistList'],
        type: 'bool',
    },
    {
        enumSet: SIDEBAR_PLAYLIST_MODES,
        key: 'FS_GENERAL_SIDEBAR_PLAYLIST_MODE',
        path: ['general', 'sidebarPlaylistMode'],
        type: 'enum',
    },
    {
        key: 'FS_GENERAL_SIDEBAR_PLAYLIST_SORTING',
        path: ['general', 'sidebarPlaylistSorting'],
        type: 'bool',
    },
    {
        enumSet: SIDE_QUEUE_TYPES,
        key: 'FS_GENERAL_SIDE_QUEUE_TYPE',
        path: ['general', 'sideQueueType'],
        type: 'enum',
    },
    {
        enumSet: SIDE_QUEUE_LAYOUTS,
        key: 'FS_GENERAL_SIDE_QUEUE_LAYOUT',
        path: ['general', 'sideQueueLayout'],
        type: 'enum',
    },
    { key: 'FS_GENERAL_RESUME', path: ['general', 'resume'], type: 'bool' },
    {
        key: 'FS_GENERAL_USE_THEME_ACCENT_COLOR',
        path: ['general', 'useThemeAccentColor'],
        type: 'bool',
    },
    {
        key: 'FS_GENERAL_USE_THEME_PRIMARY_SHADE',
        path: ['general', 'useThemePrimaryShade'],
        type: 'bool',
    },
    { key: 'FS_GENERAL_ZOOM_FACTOR', path: ['general', 'zoomFactor'], type: 'num' },
    { key: 'FS_PLAYBACK_MEDIA_SESSION', path: ['playback', 'mediaSession'], type: 'bool' },
    { key: 'FS_PLAYBACK_WEB_AUDIO', path: ['playback', 'webAudio'], type: 'bool' },
    {
        key: 'FS_PLAYBACK_AUDIO_FADE_ON_STATUS_CHANGE',
        path: ['playback', 'audioFadeOnStatusChange'],
        type: 'bool',
    },
    { key: 'FS_PLAYBACK_PRESERVE_PITCH', path: ['playback', 'preservePitch'], type: 'bool' },
    {
        key: 'FS_PLAYBACK_SCROBBLE_ENABLED',
        path: ['playback', 'scrobble', 'enabled'],
        type: 'bool',
    },
    { key: 'FS_PLAYBACK_SCROBBLE_NOTIFY', path: ['playback', 'scrobble', 'notify'], type: 'bool' },
    {
        key: 'FS_PLAYBACK_SCROBBLE_AT_DURATION',
        path: ['playback', 'scrobble', 'scrobbleAtDuration'],
        type: 'num',
    },
    {
        key: 'FS_PLAYBACK_SCROBBLE_AT_PERCENTAGE',
        path: ['playback', 'scrobble', 'scrobbleAtPercentage'],
        type: 'num',
    },
    {
        key: 'FS_PLAYBACK_TRANSCODE_ENABLED',
        path: ['playback', 'transcode', 'enabled'],
        type: 'bool',
    },
    {
        key: 'FS_PLAYBACK_TRANSCODE_FORMAT',
        path: ['playback', 'transcode', 'format'],
        skipIfEmpty: true,
        type: 'string',
    },
    {
        key: 'FS_PLAYBACK_TRANSCODE_BITRATE',
        path: ['playback', 'transcode', 'bitrate'],
        type: 'num',
    },
    {
        key: 'FS_PLAYBACK_FILTERS',
        path: ['playback', 'filters'],
        transform: parsePlaybackFiltersJson,
        type: 'string',
    },
    { key: 'FS_DISCORD_ENABLED', path: ['discord', 'enabled'], type: 'bool' },
    {
        key: 'FS_DISCORD_CLIENT_ID',
        path: ['discord', 'clientId'],
        skipIfEmpty: true,
        type: 'string',
    },
    {
        enumSet: DISCORD_DISPLAY_TYPES,
        key: 'FS_DISCORD_DISPLAY_TYPE',
        path: ['discord', 'displayType'],
        type: 'enum',
    },
    {
        enumSet: DISCORD_LINK_TYPES,
        key: 'FS_DISCORD_LINK_TYPE',
        path: ['discord', 'linkType'],
        type: 'enum',
    },
    { key: 'FS_DISCORD_SHOW_AS_LISTENING', path: ['discord', 'showAsListening'], type: 'bool' },
    { key: 'FS_DISCORD_SHOW_PAUSED', path: ['discord', 'showPaused'], type: 'bool' },
    { key: 'FS_DISCORD_SHOW_SERVER_IMAGE', path: ['discord', 'showServerImage'], type: 'bool' },
    { key: 'FS_DISCORD_SHOW_STATE_ICON', path: ['discord', 'showStateIcon'], type: 'bool' },
    { key: 'FS_LYRICS_FETCH', path: ['lyrics', 'fetch'], type: 'bool' },
    { key: 'FS_LYRICS_FOLLOW', path: ['lyrics', 'follow'], type: 'bool' },
    { key: 'FS_LYRICS_DELAY_MS', path: ['lyrics', 'delayMs'], type: 'num' },
    { key: 'FS_LYRICS_PREFER_LOCAL', path: ['lyrics', 'preferLocalLyrics'], type: 'bool' },
    { key: 'FS_LYRICS_SHOW_MATCH', path: ['lyrics', 'showMatch'], type: 'bool' },
    { key: 'FS_LYRICS_SHOW_PROVIDER', path: ['lyrics', 'showProvider'], type: 'bool' },
    {
        key: 'FS_LYRICS_ENABLE_AUTO_TRANSLATION',
        path: ['lyrics', 'enableAutoTranslation'],
        type: 'bool',
    },
    { key: 'FS_LYRICS_TRANSLATION_API_KEY', path: ['lyrics', 'translationApiKey'], type: 'string' },
    {
        key: 'FS_LYRICS_TRANSLATION_TARGET_LANGUAGE',
        path: ['lyrics', 'translationTargetLanguage'],
        skipIfEmpty: true,
        type: 'string',
    },
    {
        enumSet: LYRICS_ALIGNMENTS,
        key: 'FS_LYRICS_ALIGNMENT',
        path: ['lyrics', 'alignment'],
        type: 'enum',
    },
    {
        enumSet: AUTO_DJ_STRATEGIES,
        key: 'FS_AUTO_DJ_ALBUM_STRATEGY',
        path: ['autoDJ', 'albumStrategy'],
        type: 'enum',
    },
    { key: 'FS_AUTO_DJ_ENABLED', path: ['autoDJ', 'enabled'], type: 'bool' },
    { key: 'FS_AUTO_DJ_ITEM_COUNT', path: ['autoDJ', 'itemCount'], type: 'num' },
    { enumSet: AUTO_DJ_MODES, key: 'FS_AUTO_DJ_MODE', path: ['autoDJ', 'mode'], type: 'enum' },
    {
        enumSet: AUTO_DJ_STRATEGIES,
        key: 'FS_AUTO_DJ_SONG_STRATEGY',
        path: ['autoDJ', 'songStrategy'],
        type: 'enum',
    },
    { key: 'FS_AUTO_DJ_TIMING', path: ['autoDJ', 'timing'], type: 'num' },
    {
        key: 'FS_CSS_CONTENT',
        path: ['css', 'content'],
        transform: (s) => (s.trim() === '' ? undefined : sanitizeCss(`<style>${s}`)),
        type: 'string',
    },
    { key: 'FS_CSS_ENABLED', path: ['css', 'enabled'], type: 'bool' },
    { enumSet: FONT_TYPES, key: 'FS_FONT_TYPE', path: ['font', 'type'], type: 'enum' },
    { key: 'FS_FONT_BUILT_IN', path: ['font', 'builtIn'], skipIfEmpty: true, type: 'string' },
    {
        key: 'FS_FONT_SYSTEM',
        path: ['font', 'system'],
        transform: (s) => (s === '' ? null : s),
        type: 'string',
    },
];

export function getEnvSettingsOverrides(): EnvSettingsOverrides {
    const w = getWin();
    const get = (key: string): string | undefined => {
        const v = w[key];
        if (typeof v !== 'string') return undefined;
        if (isUnsubstitutedPlaceholder(v)) return undefined;
        return v;
    };

    const overrides: EnvSettingsOverrides = {};

    for (const spec of ENV_SETTING_SPECS) {
        const raw = get(spec.key);
        const value = parseValue(raw, spec);
        if (value !== undefined) {
            setAtPath(overrides, spec.path, value);
        }
    }

    return overrides;
}

function getWin(): Record<string, unknown> & Window {
    if (typeof window === 'undefined') return {} as Record<string, unknown> & Window;
    return window as unknown as Record<string, unknown> & Window;
}

function isUnsubstitutedPlaceholder(s: string): boolean {
    return s.length > 0 && s.startsWith('${FS_') && s.endsWith('}');
}

function parseBool(s: string | undefined): boolean | undefined {
    if (s === undefined || s === '') return undefined;
    const lower = s.toLowerCase();
    if (lower === 'true' || lower === '1') return true;
    if (lower === 'false' || lower === '0') return false;
    return undefined;
}

function parseEnum<T extends string>(s: string | undefined, allowed: Set<string>): T | undefined {
    if (s === undefined || s === '') return undefined;
    const v = s.trim();
    return allowed.has(v) ? (v as T) : undefined;
}

function parseNum(s: string | undefined): number | undefined {
    if (s === undefined || s === '') return undefined;
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
}

function parseValue(raw: string | undefined, spec: EnvSettingSpec): unknown {
    if (raw === undefined) return undefined;
    if (spec.transform) return spec.transform(raw);
    switch (spec.type) {
        case 'bool':
            return parseBool(raw);
        case 'enum':
            return spec.enumSet ? parseEnum(raw, spec.enumSet) : undefined;
        case 'num':
            return parseNum(raw);
        case 'string':
            if (spec.skipIfEmpty && raw === '') return undefined;
            return raw;
        default:
            return undefined;
    }
}
