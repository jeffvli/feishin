import isElectron from 'is-electron';
import mergeWith from 'lodash/mergeWith';
import { nanoid } from 'nanoid';
import { generatePath } from 'react-router';
import { z } from 'zod';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';

import i18n from '/@/i18n/i18n';
import {
    ALBUM_ARTIST_TABLE_COLUMNS,
    ALBUM_TABLE_COLUMNS,
    GENRE_TABLE_COLUMNS,
    pickGridRows,
    pickTableColumns,
    PLAYLIST_SONG_TABLE_COLUMNS,
    PLAYLIST_TABLE_COLUMNS,
    SONG_TABLE_COLUMNS,
} from '/@/renderer/components/item-list/item-table-list/default-columns';
import { audiomotionanalyzerPresets } from '/@/renderer/features/visualizer/components/audiomotionanalyzer/presets';
import { AppRoute } from '/@/renderer/router/routes';
import { mergeOverridingColumns } from '/@/renderer/store/utils';
import { FontValueSchema } from '/@/renderer/types/fonts';
import { randomString } from '/@/renderer/utils';
import { sanitizeCss } from '/@/renderer/utils/sanitize';
import { AppTheme } from '/@/shared/themes/app-theme-types';
import { LibraryItem, LyricSource } from '/@/shared/types/domain-types';
import {
    FontType,
    ItemListKey,
    ListDisplayType,
    ListPaginationType,
    Platform,
    Play,
    PlayerType,
    TableColumn,
} from '/@/shared/types/types';

const utils = isElectron() ? window.api.utils : null;

type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

const deepMergeIntoState = <T extends Record<string, any>>(
    state: T,
    updates: DeepPartial<T>,
): void => {
    // Skip 'actions' property
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { actions, ...updatesWithoutActions } = updates as any;

    // Use mergeWith to replace arrays instead of merging them by index
    mergeWith(state, updatesWithoutActions, (_objValue, srcValue) => {
        // If source value is an array, replace the entire array instead of merging
        if (Array.isArray(srcValue)) {
            return srcValue;
        }

        // Default merge behavior
        return undefined;
    });
};

const HomeItemSchema = z.enum([
    'genres',
    'mostPlayed',
    'random',
    'recentlyAdded',
    'recentlyPlayed',
    'recentlyReleased',
]);

const ArtistItemSchema = z.enum([
    'biography',
    'compilations',
    'recentAlbums',
    'similarArtists',
    'topSongs',
]);

const ArtistReleaseTypeItemSchema = z.enum([
    'releaseTypeAlbum',
    'releaseTypeEp',
    'releaseTypeSingle',
    'releaseTypeBroadcast',
    'releaseTypeOther',
    'releaseTypeCompilation',
    'appearsOn',
    'releaseTypeAudioDrama',
    'releaseTypeAudiobook',
    'releaseTypeDemo',
    'releaseTypeDjMix',
    'releaseTypeFieldRecording',
    'releaseTypeInterview',
    'releaseTypeLive',
    'releaseTypeMixtapeStreet',
    'releaseTypeRemix',
    'releaseTypeSoundtrack',
    'releaseTypeSpokenWord',
]);

const BindingActionsSchema = z.enum([
    'browserBack',
    'browserForward',
    'favoriteCurrentAdd',
    'favoriteCurrentRemove',
    'favoriteCurrentToggle',
    'favoritePreviousAdd',
    'favoritePreviousRemove',
    'favoritePreviousToggle',
    'globalSearch',
    'localSearch',
    'volumeMute',
    'navigateHome',
    'next',
    'pause',
    'play',
    'playPause',
    'previous',
    'rate0',
    'rate1',
    'rate2',
    'rate3',
    'rate4',
    'rate5',
    'toggleShuffle',
    'skipBackward',
    'skipForward',
    'stop',
    'toggleFullscreenPlayer',
    'toggleQueue',
    'toggleRepeat',
    'volumeDown',
    'volumeUp',
    'zoomIn',
    'zoomOut',
    'listPlayDefault',
    'listPlayNow',
    'listPlayNext',
    'listPlayLast',
    'listNavigateToPage',
]);

const DiscordDisplayTypeSchema = z.enum(['artist', 'feishin', 'song']);

const DiscordLinkTypeSchema = z.enum(['last_fm', 'musicbrainz', 'musicbrainz_last_fm', 'none']);

const GenreTargetSchema = z.enum(['album', 'track']);

const SideQueueTypeSchema = z.enum(['sideDrawerQueue', 'sideQueue']);

const SidebarPanelTypeSchema = z.enum(['queue', 'lyrics', 'visualizer']);

const SidebarItemTypeSchema = z.object({
    disabled: z.boolean(),
    id: z.string(),
    label: z.string(),
    route: z.union([z.nativeEnum(AppRoute), z.string()]),
});

const SortableItemSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
    z.object({
        disabled: z.boolean(),
        id: itemSchema,
    });

const ItemTableListColumnConfigSchema = z.object({
    align: z.enum(['center', 'end', 'start']),
    autoSize: z.boolean().optional(),
    id: z.nativeEnum(TableColumn),
    isEnabled: z.boolean(),
    pinned: z.union([z.literal('left'), z.literal('right'), z.literal(null)]),
    width: z.number(),
});

export type ItemTableListColumnConfig = z.infer<typeof ItemTableListColumnConfigSchema>;

const ItemGridListRowConfigSchema = z.object({
    align: z.enum(['center', 'end', 'start']),
    id: z.nativeEnum(TableColumn),
    isEnabled: z.boolean(),
});

export type ItemGridListRowConfig = z.infer<typeof ItemGridListRowConfigSchema>;

const ItemTableListPropsSchema = z.object({
    autoFitColumns: z.boolean(),
    columns: z.array(ItemTableListColumnConfigSchema),
    enableAlternateRowColors: z.boolean(),
    enableHorizontalBorders: z.boolean(),
    enableRowHoverHighlight: z.boolean(),
    enableVerticalBorders: z.boolean(),
    size: z.enum(['compact', 'default']),
});

const ItemListConfigSchema = z.object({
    display: z.nativeEnum(ListDisplayType),
    grid: z.object({
        itemGap: z.enum(['lg', 'md', 'sm', 'xl', 'xs']),
        itemsPerRow: z.number(),
        itemsPerRowEnabled: z.boolean(),
        rows: z.array(ItemGridListRowConfigSchema),
        size: z.enum(['compact', 'default', 'large']),
    }),
    itemsPerPage: z.number(),
    pagination: z.nativeEnum(ListPaginationType),
    table: ItemTableListPropsSchema,
});

const TranscodingConfigSchema = z.object({
    bitrate: z.number().optional(),
    enabled: z.boolean(),
    format: z.string().optional(),
});

const MpvSettingsSchema = z.object({
    audioExclusiveMode: z.enum(['no', 'yes']),
    audioFormat: z.enum(['float', 's16', 's32']).optional(),
    audioSampleRateHz: z.number().optional(),
    gaplessAudio: z.enum(['no', 'weak', 'yes']),
    replayGainClip: z.boolean(),
    replayGainFallbackDB: z.number().optional(),
    replayGainMode: z.enum(['album', 'no', 'track']),
    replayGainPreampDB: z.number().optional(),
});

const CssSettingsSchema = z.object({
    content: z.string().transform((val) => sanitizeCss(`<style>${val}`)),
    enabled: z.boolean(),
});

const DiscordSettingsSchema = z.object({
    clientId: z.string(),
    displayType: DiscordDisplayTypeSchema,
    enabled: z.boolean(),
    linkType: DiscordLinkTypeSchema,
    showAsListening: z.boolean(),
    showPaused: z.boolean(),
    showServerImage: z.boolean(),
});

const FontSettingsSchema = z.object({
    builtIn: FontValueSchema,
    custom: z.string().nullable(),
    system: z.string().nullable(),
    type: z.nativeEnum(FontType),
});

const SkipButtonsSchema = z.object({
    enabled: z.boolean(),
    skipBackwardSeconds: z.number(),
    skipForwardSeconds: z.number(),
});

const PlayerbarSliderTypeSchema = z.enum(['slider', 'waveform']);

const BarAlignSchema = z.enum(['top', 'bottom', 'center']);

const PlayerbarSliderSchema = z.object({
    barAlign: BarAlignSchema,
    barGap: z.number(),
    barRadius: z.number(),
    barWidth: z.number(),
    type: PlayerbarSliderTypeSchema,
});

const AudioMotionAnalyzerSettingsSchema = z.object({
    alphaBars: z
        .boolean()
        .describe(
            'When set to true each bar’s amplitude affects its opacity, i.e., higher bars are rendered more opaque while shorter bars are more transparent. This is similar to the lumiBars effect, but bars’ amplitudes are preserved and it also works on Discrete mode and radial spectrum.',
        ),
    ansiBands: z
        .boolean()
        .describe(
            'When set to true, ANSI/IEC preferred frequencies are used to generate the bands for octave bands modes (see mode). The preferred base-10 scale is used to compute the center and bandedge frequencies, as specified in the ANSI S1.11-2004 standard. When false, bands are based on the equal-tempered scale, so that in 1/12 octave bands the center of each band is perfectly tuned to a musical note.',
        ),
    barSpace: z
        .number()
        .describe(
            'Customize the spacing between bars in frequency bands modes (see mode). Use a value between 0 and 1 for spacing proportional to the band width. Values >= 1 will be considered as a literal number of pixels.',
        ),
    channelLayout: z
        .enum(['single', 'dual-combined', 'dual-horizontal', 'dual-vertical'])
        .describe('Defines the number and layout of analyzer channels.'),
    colorMode: z
        .enum(['gradient', 'bar-index', 'bar-level'])
        .describe('Selects the desired mode for coloring the analyzer bars.'),
    customGradients: z.array(
        z.object({
            colorStops: z.array(
                z.object({
                    color: z.string(),
                    level: z.number().min(0).max(1).optional(),
                    levelEnabled: z.boolean().optional(),
                    pos: z.number().min(0).max(1).optional(),
                    positionEnabled: z.boolean().optional(),
                }),
            ),
            dir: z.string().optional(),
            name: z.string(),
        }),
    ),
    fadePeaks: z
        .boolean()
        .describe(
            'When true, peaks fade out instead of falling down. It has no effect when peakLine is active.',
        ),
    fftSize: z
        .number()
        .describe(
            'Number of samples used for the FFT performed by the AnalyzerNode. It must be a power of 2 between 32 and 32768, so valid values are: 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, and 32768. Higher values provide more detail in the frequency domain, but less detail in the time domain (slower response), so you may need to adjust smoothing accordingly.',
        ),
    fillAlpha: z.number(),
    frequencyScale: z.enum(['bark', 'linear', 'log', 'mel']),
    gradient: z.string(),
    gradientLeft: z.string().optional(),
    gradientRight: z.string().optional(),
    gravity: z.number(),
    ledBars: z.boolean(),
    linearAmplitude: z.boolean(),
    linearBoost: z.number(),
    lineWidth: z.number(),
    loRes: z.boolean(),
    lumiBars: z.boolean(),
    maxDecibels: z.number(),
    maxFPS: z.number(),
    maxFreq: z.number(),
    minDecibels: z.number(),
    minFreq: z.number(),
    mirror: z.number(),
    mode: z.number(),
    noteLabels: z.boolean(),
    opacity: z.number().min(0).max(1),
    outlineBars: z.boolean(),
    peakFadeTime: z.number(),
    peakHoldTime: z.number(),
    peakLine: z.boolean(),
    presets: z.array(
        z.object({
            id: z.string(),
            name: z.string(),
            value: z.any(),
        }),
    ),
    radial: z.boolean(),
    radialInvert: z.boolean(),
    radius: z.number(),
    reflexAlpha: z.number(),
    reflexBright: z.number(),
    reflexFit: z.boolean(),
    reflexRatio: z.number(),
    roundBars: z.boolean(),
    showFPS: z.boolean(),
    showPeaks: z.boolean(),
    showScaleX: z.boolean(),
    showScaleY: z.boolean(),
    smoothing: z.number(),
    spinSpeed: z.number(),
    splitGradient: z.boolean(),
    trueLeds: z.boolean(),
    volume: z.number(),
    weightingFilter: z.enum(['', 'A', 'B', 'C', 'D', 'Z']),
});

const ButterchurnSettingsSchema = z.object({
    blendTime: z.number().min(0).max(10),
    currentPreset: z.string().optional(),
    cyclePresets: z.boolean(),
    cycleTime: z.number().min(1).max(300),
    ignoredPresets: z.array(z.string()),
    includeAllPresets: z.boolean(),
    maxFPS: z.number().min(0),
    opacity: z.number().min(0).max(1),
    randomizeNextPreset: z.boolean(),
    selectedPresets: z.array(z.string()),
});

const VisualizerSettingsSchema = z.object({
    audiomotionanalyzer: AudioMotionAnalyzerSettingsSchema,
    butterchurn: ButterchurnSettingsSchema,
    type: z.enum(['audiomotionanalyzer', 'butterchurn']),
});

export enum HomeFeatureStyle {
    MULTIPLE = 'multiple',
    SINGLE = 'single',
}

export const GeneralSettingsSchema = z.object({
    accent: z
        .string()
        .refine(
            (val) => /^rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)$/.test(val),
            {
                message: 'Accent must be a valid rgb() color string',
            },
        ),
    albumBackground: z.boolean(),
    albumBackgroundBlur: z.number(),
    artistBackground: z.boolean(),
    artistBackgroundBlur: z.number(),
    artistItems: z.array(SortableItemSchema(ArtistItemSchema)),
    artistRadioCount: z.number(),
    artistReleaseTypeItems: z.array(SortableItemSchema(ArtistReleaseTypeItemSchema)),
    buttonSize: z.number(),
    combinedLyricsAndVisualizer: z.boolean(),
    disabledContextMenu: z.record(z.string(), z.boolean()),
    enableGridMultiSelect: z.boolean(),
    externalLinks: z.boolean(),
    followCurrentSong: z.boolean(),
    followSystemTheme: z.boolean(),
    genreTarget: GenreTargetSchema,
    homeFeature: z.boolean(),
    homeFeatureStyle: z.nativeEnum(HomeFeatureStyle),
    homeItems: z.array(SortableItemSchema(HomeItemSchema)),
    imageRes: z.object({
        fullScreenPlayer: z.number(),
        header: z.number(),
        itemCard: z.number(),
        sidebar: z.number(),
        table: z.number(),
    }),
    language: z.string(),
    lastFM: z.boolean(),
    lastfmApiKey: z.string(),
    musicBrainz: z.boolean(),
    nativeAspectRatio: z.boolean(),
    passwordStore: z.string().optional(),
    pathReplace: z.string(),
    pathReplaceWith: z.string(),
    playButtonBehavior: z.nativeEnum(Play),
    playerbarOpenDrawer: z.boolean(),
    playerbarSlider: PlayerbarSliderSchema,
    resume: z.boolean(),
    showLyricsInSidebar: z.boolean(),
    showRatings: z.boolean(),
    showVisualizerInSidebar: z.boolean(),
    sidebarCollapsedNavigation: z.boolean(),
    sidebarCollapseShared: z.boolean(),
    sidebarItems: z.array(SidebarItemTypeSchema),
    sidebarPanelOrder: z.array(SidebarPanelTypeSchema),
    sidebarPlaylistList: z.boolean(),
    sidebarPlaylistSorting: z.boolean(),
    sideQueueType: SideQueueTypeSchema,
    skipButtons: SkipButtonsSchema,
    theme: z.nativeEnum(AppTheme),
    themeDark: z.nativeEnum(AppTheme),
    themeLight: z.nativeEnum(AppTheme),
    useThemeAccentColor: z.boolean(),
    volumeWheelStep: z.number(),
    volumeWidth: z.number(),
    zoomFactor: z.number(),
});

const HotkeyBindingSchema = z.object({
    allowGlobal: z.boolean(),
    hotkey: z.string(),
    isGlobal: z.boolean(),
});

const HotkeysSettingsSchema = z.object({
    bindings: z
        .record(BindingActionsSchema, HotkeyBindingSchema)
        .refine((obj): obj is Required<typeof obj> =>
            BindingActionsSchema.options.every((key) => obj[key] != null),
        ),
    globalMediaHotkeys: z.boolean(),
});

const LyricsDisplaySettingsSchema = z.object({
    fontSize: z.number(),
    fontSizeUnsync: z.number(),
    gap: z.number(),
    gapUnsync: z.number(),
});

const LyricsSettingsSchema = z.object({
    alignment: z.enum(['center', 'left', 'right']),
    delayMs: z.number(),
    enableAutoTranslation: z.boolean(),
    enableNeteaseTranslation: z.boolean(),
    fetch: z.boolean(),
    follow: z.boolean(),
    preferLocalLyrics: z.boolean(),
    showMatch: z.boolean(),
    showProvider: z.boolean(),
    sources: z.array(z.nativeEnum(LyricSource)),
    translationApiKey: z.string(),
    translationApiProvider: z.string().nullable(),
    translationTargetLanguage: z.string().nullable(),
});

const ScrobbleSettingsSchema = z.object({
    enabled: z.boolean(),
    notify: z.boolean(),
    scrobbleAtDuration: z.number(),
    scrobbleAtPercentage: z.number(),
});

const PlayerFilterFieldSchema = z.enum([
    'name',
    'albumArtist',
    'artist',
    'duration',
    'genre',
    'year',
    'note',
    'path',
    'playCount',
    'favorite',
    'rating',
]);

const PlayerFilterOperatorSchema = z.enum([
    'is',
    'isNot',
    'contains',
    'notContains',
    'startsWith',
    'endsWith',
    'regex',
    'gt',
    'lt',
    'inTheRange',
    'before',
    'after',
    'beforeDate',
    'afterDate',
    'inTheRangeDate',
    'inTheLast',
    'notInTheLast',
]);

const PlayerFilterSchema = z.object({
    field: PlayerFilterFieldSchema,
    id: z.string(),
    isEnabled: z.boolean().optional(),
    operator: PlayerFilterOperatorSchema,
    value: z.union([
        z.string(),
        z.number(),
        z.boolean(),
        z.array(z.union([z.string(), z.number()])),
    ]),
});

const PlaybackSettingsSchema = z.object({
    audioDeviceId: z.string().nullable().optional(),
    audioFadeOnStatusChange: z.boolean(),
    filters: z.array(PlayerFilterSchema),
    mediaSession: z.boolean(),
    mpvExtraParameters: z.array(z.string()),
    mpvProperties: MpvSettingsSchema,
    preservePitch: z.boolean(),
    scrobble: ScrobbleSettingsSchema,
    transcode: TranscodingConfigSchema,
    type: z.nativeEnum(PlayerType),
    webAudio: z.boolean(),
});

const RemoteSettingsSchema = z.object({
    enabled: z.boolean(),
    password: z.string(),
    port: z.number(),
    username: z.string(),
});

const WindowSettingsSchema = z.object({
    disableAutoUpdate: z.boolean(),
    exitToTray: z.boolean(),
    minimizeToTray: z.boolean(),
    preventSleepOnPlayback: z.boolean(),
    releaseChannel: z.enum(['beta', 'latest']),
    startMinimized: z.boolean(),
    tray: z.boolean(),
    windowBarStyle: z.nativeEnum(Platform),
});

const QueryValueInputTypeSchema = z.enum([
    'boolean',
    'date',
    'dateRange',
    'number',
    'playlist',
    'string',
]);

const QueryBuilderCustomFieldSchema = z.object({
    label: z.string(),
    type: QueryValueInputTypeSchema,
    value: z.string(),
});

const QueryBuilderSettingsSchema = z.object({
    tag: z.array(QueryBuilderCustomFieldSchema),
});

const AutoDJSettingsSchema = z.object({
    enabled: z.boolean(),
    itemCount: z.number(),
    timing: z.number(),
});

/**
 * This schema is used for validation of the imported settings json
 */
export const ValidationSettingsStateSchema = z.object({
    autoDJ: AutoDJSettingsSchema,
    css: CssSettingsSchema,
    discord: DiscordSettingsSchema,
    font: FontSettingsSchema,
    general: GeneralSettingsSchema,
    hotkeys: HotkeysSettingsSchema,
    lists: z.record(z.nativeEnum(ItemListKey), ItemListConfigSchema),
    lyrics: LyricsSettingsSchema,
    lyricsDisplay: z.record(z.string(), LyricsDisplaySettingsSchema),
    playback: PlaybackSettingsSchema,
    queryBuilder: QueryBuilderSettingsSchema,
    remote: RemoteSettingsSchema,
    tab: z.union([
        z.literal('general'),
        z.literal('hotkeys'),
        z.literal('playback'),
        z.literal('window'),
        z.string(),
    ]),
    visualizer: VisualizerSettingsSchema,
    window: WindowSettingsSchema,
});

/**
 * This schema is merged below to create the full SettingsSchema but not used during import validation
 */
export const NonValidatedSettingsStateSchema = z.object({});

export const SettingsStateSchema = ValidationSettingsStateSchema.merge(
    NonValidatedSettingsStateSchema,
);

export enum ArtistItem {
    BIOGRAPHY = 'biography',
    RECENT_ALBUMS = 'recentAlbums',
    SIMILAR_ARTISTS = 'similarArtists',
    TOP_SONGS = 'topSongs',
}

export enum ArtistReleaseTypeItem {
    APPEARS_ON = 'appearsOn',
    RELEASE_TYPE_ALBUM = 'releaseTypeAlbum',
    RELEASE_TYPE_AUDIO_DRAMA = 'releaseTypeAudioDrama',
    RELEASE_TYPE_AUDIOBOOK = 'releaseTypeAudiobook',
    RELEASE_TYPE_BROADCAST = 'releaseTypeBroadcast',
    RELEASE_TYPE_COMPILATION = 'releaseTypeCompilation',
    RELEASE_TYPE_DEMO = 'releaseTypeDemo',
    RELEASE_TYPE_DJ_MIX = 'releaseTypeDjMix',
    RELEASE_TYPE_EP = 'releaseTypeEp',
    RELEASE_TYPE_FIELD_RECORDING = 'releaseTypeFieldRecording',
    RELEASE_TYPE_INTERVIEW = 'releaseTypeInterview',
    RELEASE_TYPE_LIVE = 'releaseTypeLive',
    RELEASE_TYPE_MIXTAPE_STREET = 'releaseTypeMixtapeStreet',
    RELEASE_TYPE_OTHER = 'releaseTypeOther',
    RELEASE_TYPE_REMIX = 'releaseTypeRemix',
    RELEASE_TYPE_SINGLE = 'releaseTypeSingle',
    RELEASE_TYPE_SOUNDTRACK = 'releaseTypeSoundtrack',
    RELEASE_TYPE_SPOKENWORD = 'releaseTypeSpokenWord',
}

export enum BarAlign {
    BOTTOM = 'bottom',
    CENTER = 'center',
    TOP = 'top',
}

export enum BindingActions {
    BROWSER_BACK = 'browserBack',
    BROWSER_FORWARD = 'browserForward',
    FAVORITE_CURRENT_ADD = 'favoriteCurrentAdd',
    FAVORITE_CURRENT_REMOVE = 'favoriteCurrentRemove',
    FAVORITE_CURRENT_TOGGLE = 'favoriteCurrentToggle',
    FAVORITE_PREVIOUS_ADD = 'favoritePreviousAdd',
    FAVORITE_PREVIOUS_REMOVE = 'favoritePreviousRemove',
    FAVORITE_PREVIOUS_TOGGLE = 'favoritePreviousToggle',
    GLOBAL_SEARCH = 'globalSearch',
    LIST_NAVIGATE_TO_PAGE = 'listNavigateToPage',
    LIST_PLAY_DEFAULT = 'listPlayDefault',
    LIST_PLAY_LAST = 'listPlayLast',
    LIST_PLAY_NEXT = 'listPlayNext',
    LIST_PLAY_NOW = 'listPlayNow',
    LOCAL_SEARCH = 'localSearch',
    MUTE = 'volumeMute',
    NAVIGATE_HOME = 'navigateHome',
    NEXT = 'next',
    PAUSE = 'pause',
    PLAY = 'play',
    PLAY_PAUSE = 'playPause',
    PREVIOUS = 'previous',
    RATE_0 = 'rate0',
    RATE_1 = 'rate1',
    RATE_2 = 'rate2',
    RATE_3 = 'rate3',
    RATE_4 = 'rate4',
    RATE_5 = 'rate5',
    SHUFFLE = 'toggleShuffle',
    SKIP_BACKWARD = 'skipBackward',
    SKIP_FORWARD = 'skipForward',
    STOP = 'stop',
    TOGGLE_FULLSCREEN_PLAYER = 'toggleFullscreenPlayer',
    TOGGLE_QUEUE = 'toggleQueue',
    TOGGLE_REPEAT = 'toggleRepeat',
    VOLUME_DOWN = 'volumeDown',
    VOLUME_UP = 'volumeUp',
    ZOOM_IN = 'zoomIn',
    ZOOM_OUT = 'zoomOut',
}

export enum DiscordDisplayType {
    ARTIST_NAME = 'artist',
    FEISHIN = 'feishin',
    SONG_NAME = 'song',
}

export enum DiscordLinkType {
    LAST_FM = 'last_fm',
    MBZ = 'musicbrainz',
    MBZ_LAST_FM = 'musicbrainz_last_fm',
    NONE = 'none',
}

export enum GenreTarget {
    ALBUM = 'album',
    TRACK = 'track',
}

export enum HomeItem {
    GENRES = 'genres',
    MOST_PLAYED = 'mostPlayed',
    RANDOM = 'random',
    RECENTLY_ADDED = 'recentlyAdded',
    RECENTLY_PLAYED = 'recentlyPlayed',
    RECENTLY_RELEASED = 'recentlyReleased',
}

export enum PlayerbarSliderType {
    SLIDER = 'slider',
    WAVEFORM = 'waveform',
}

export enum SidebarItem {
    ALBUMS = 'Albums',
    ARTISTS = 'Artists',
    ARTISTS_ALL = 'Artists-all',
    FAVORITES = 'Favorites',
    FOLDERS = 'Folders',
    GENRES = 'Genres',
    HOME = 'Home',
    NOW_PLAYING = 'Now Playing',
    PLAYLISTS = 'Playlists',
    RADIO = 'Radio',
    SEARCH = 'Search',
    SETTINGS = 'Settings',
    TRACKS = 'Tracks',
}

export type DataGridProps = {
    itemGap: 'lg' | 'md' | 'sm' | 'xl' | 'xs';
    itemsPerRow: number;
    itemsPerRowEnabled: boolean;
    rows: ItemGridListRowConfig[];
    size: 'compact' | 'default' | 'large';
};

export type DataTableProps = z.infer<typeof ItemTableListPropsSchema>;
export type ItemListSettings = {
    display: ListDisplayType;
    grid: DataGridProps;
    itemsPerPage: number;
    pagination: ListPaginationType;
    table: DataTableProps;
};

export type PlayerFilter = z.infer<typeof PlayerFilterSchema>;

export type PlayerFilterField = z.infer<typeof PlayerFilterFieldSchema>;

export type PlayerFilterOperator = z.infer<typeof PlayerFilterOperatorSchema>;

export interface SettingsSlice extends z.infer<typeof SettingsStateSchema> {
    actions: {
        reset: () => void;
        resetSampleRate: () => void;
        setArtistItems: (item: SortableItem<ArtistItem>[]) => void;
        setArtistReleaseTypeItems: (item: SortableItem<ArtistReleaseTypeItem>[]) => void;
        setGenreBehavior: (target: GenreTarget) => void;
        setHomeItems: (item: SortableItem<HomeItem>[]) => void;
        setList: (type: ItemListKey, data: DeepPartial<ItemListSettings>) => void;
        setPlaybackFilters: (filters: PlayerFilter[]) => void;
        setSettings: (data: DeepPartial<SettingsState>) => void;
        setSidebarItems: (items: SidebarItemType[]) => void;
        setTable: (type: ItemListKey, data: DataTableProps) => void;
        setTranscodingConfig: (config: TranscodingConfig) => void;
        toggleMediaSession: () => void;
        toggleSidebarCollapseShare: () => void;
    };
}
export interface SettingsState extends z.infer<typeof SettingsStateSchema> {}
export type SidebarItemType = z.infer<typeof SidebarItemTypeSchema>;

export type SideQueueType = z.infer<typeof SideQueueTypeSchema>;

export type SortableItem<T extends string> = {
    disabled: boolean;
    id: T;
};

export type TranscodingConfig = z.infer<typeof TranscodingConfigSchema>;

export type VersionedSettings = SettingsState & { version: number };

export const sidebarItems: SidebarItemType[] = [
    {
        disabled: true,
        id: 'Now Playing',
        label: i18n.t('page.sidebar.nowPlaying'),
        route: AppRoute.NOW_PLAYING,
    },
    {
        disabled: true,
        id: 'Search',
        label: i18n.t('page.sidebar.search'),
        route: generatePath(AppRoute.SEARCH, { itemType: LibraryItem.SONG }),
    },
    { disabled: false, id: 'Home', label: i18n.t('page.sidebar.home'), route: AppRoute.HOME },
    {
        disabled: false,
        id: 'Favorites',
        label: i18n.t('page.sidebar.favorites'),
        route: AppRoute.FAVORITES,
    },
    {
        disabled: false,
        id: 'Albums',
        label: i18n.t('page.sidebar.albums'),
        route: AppRoute.LIBRARY_ALBUMS,
    },
    {
        disabled: false,
        id: 'Tracks',
        label: i18n.t('page.sidebar.tracks'),
        route: AppRoute.LIBRARY_SONGS,
    },
    {
        disabled: false,
        id: 'Artists',
        label: i18n.t('page.sidebar.albumArtists'),
        route: AppRoute.LIBRARY_ALBUM_ARTISTS,
    },
    {
        disabled: false,
        id: 'Artists-all',
        label: i18n.t('page.sidebar.artists'),
        route: AppRoute.LIBRARY_ARTISTS,
    },
    {
        disabled: false,
        id: 'Genres',
        label: i18n.t('page.sidebar.genres'),
        route: AppRoute.LIBRARY_GENRES,
    },
    {
        disabled: false,
        id: 'Folders',
        label: i18n.t('page.sidebar.folders'),
        route: AppRoute.LIBRARY_FOLDERS,
    },
    {
        disabled: true,
        id: 'Playlists',
        label: i18n.t('page.sidebar.playlists'),
        route: AppRoute.PLAYLISTS,
    },
    {
        disabled: false,
        id: 'Radio',
        label: i18n.t('page.sidebar.radio'),
        route: AppRoute.RADIO,
    },
    {
        disabled: true,
        id: 'Settings',
        label: i18n.t('page.sidebar.settings'),
        route: AppRoute.SETTINGS,
    },
];

const homeItems = Object.values(HomeItem).map((item) => ({
    disabled: false,
    id: item,
}));

const artistItems = Object.values(ArtistItem).map((item) => ({
    disabled: false,
    id: item,
}));

const artistReleaseTypeItems = Object.values(ArtistReleaseTypeItem).map((item) => ({
    disabled: false,
    id: item,
}));

// Determines the default/initial windowBarStyle value based on the current platform.
const getPlatformDefaultWindowBarStyle = (): Platform => {
    if (utils?.isWindows()) {
        return Platform.WINDOWS;
    }

    if (utils?.isMacOS()) {
        return Platform.MACOS;
    }

    if (utils?.isLinux()) {
        return Platform.WINDOWS;
    }

    return Platform.WEB;
};

const platformDefaultWindowBarStyle: Platform = getPlatformDefaultWindowBarStyle();

const initialState: SettingsState = {
    autoDJ: {
        enabled: false,
        itemCount: 5,
        timing: 1,
    },
    css: {
        content: '',
        enabled: false,
    },
    discord: {
        clientId: '1165957668758900787',
        displayType: DiscordDisplayType.FEISHIN,
        enabled: false,
        linkType: DiscordLinkType.NONE,
        showAsListening: false,
        showPaused: true,
        showServerImage: false,
    },
    font: {
        builtIn: 'Poppins',
        custom: null,
        system: null,
        type: FontType.BUILT_IN,
    },
    general: {
        accent: 'rgb(53, 116, 252)',
        albumBackground: false,
        albumBackgroundBlur: 3,
        artistBackground: true,
        artistBackgroundBlur: 3,
        artistItems,
        artistRadioCount: 20,
        artistReleaseTypeItems,
        buttonSize: 15,
        combinedLyricsAndVisualizer: false,
        disabledContextMenu: {},
        enableGridMultiSelect: false,
        externalLinks: true,
        followCurrentSong: true,
        followSystemTheme: false,
        genreTarget: GenreTarget.TRACK,
        homeFeature: true,
        homeFeatureStyle: HomeFeatureStyle.SINGLE,
        homeItems,
        imageRes: {
            fullScreenPlayer: 0,
            header: 300,
            itemCard: 300,
            sidebar: 400,
            table: 80,
        },
        language: 'en',
        lastFM: true,
        lastfmApiKey: '',
        musicBrainz: true,
        nativeAspectRatio: false,
        passwordStore: undefined,
        pathReplace: '',
        pathReplaceWith: '',
        playButtonBehavior: Play.NOW,
        playerbarOpenDrawer: false,
        playerbarSlider: {
            barAlign: BarAlign.CENTER,
            barGap: 1,
            barRadius: 4,
            barWidth: 2,
            type: PlayerbarSliderType.SLIDER,
        },
        resume: true,
        showLyricsInSidebar: true,
        showRatings: true,
        showVisualizerInSidebar: true,
        sidebarCollapsedNavigation: true,
        sidebarCollapseShared: false,
        sidebarItems,
        sidebarPanelOrder: ['queue', 'lyrics', 'visualizer'],
        sidebarPlaylistList: true,
        sidebarPlaylistSorting: false,
        sideQueueType: 'sideQueue',
        skipButtons: {
            enabled: false,
            skipBackwardSeconds: 5,
            skipForwardSeconds: 10,
        },
        theme: AppTheme.DEFAULT_DARK,
        themeDark: AppTheme.DEFAULT_DARK,
        themeLight: AppTheme.DEFAULT_LIGHT,
        useThemeAccentColor: false,
        volumeWheelStep: 5,
        volumeWidth: 70,
        zoomFactor: 100,
    },
    hotkeys: {
        bindings: {
            browserBack: { allowGlobal: false, hotkey: '', isGlobal: false },
            browserForward: { allowGlobal: false, hotkey: '', isGlobal: false },
            favoriteCurrentAdd: { allowGlobal: true, hotkey: '', isGlobal: false },
            favoriteCurrentRemove: { allowGlobal: true, hotkey: '', isGlobal: false },
            favoriteCurrentToggle: { allowGlobal: true, hotkey: '', isGlobal: false },
            favoritePreviousAdd: { allowGlobal: true, hotkey: '', isGlobal: false },
            favoritePreviousRemove: { allowGlobal: true, hotkey: '', isGlobal: false },
            favoritePreviousToggle: { allowGlobal: true, hotkey: '', isGlobal: false },
            globalSearch: { allowGlobal: false, hotkey: 'mod+k', isGlobal: false },
            listNavigateToPage: { allowGlobal: false, hotkey: 'mod+g', isGlobal: false },
            listPlayDefault: { allowGlobal: false, hotkey: 'enter', isGlobal: false },
            listPlayLast: { allowGlobal: false, hotkey: '', isGlobal: false },
            listPlayNext: { allowGlobal: false, hotkey: '', isGlobal: false },
            listPlayNow: { allowGlobal: false, hotkey: '', isGlobal: false },
            localSearch: { allowGlobal: false, hotkey: 'mod+f', isGlobal: false },
            navigateHome: { allowGlobal: false, hotkey: '', isGlobal: false },
            next: { allowGlobal: true, hotkey: '', isGlobal: false },
            pause: { allowGlobal: true, hotkey: '', isGlobal: false },
            play: { allowGlobal: true, hotkey: '', isGlobal: false },
            playPause: { allowGlobal: true, hotkey: 'space', isGlobal: false },
            previous: { allowGlobal: true, hotkey: '', isGlobal: false },
            rate0: { allowGlobal: true, hotkey: '', isGlobal: false },
            rate1: { allowGlobal: true, hotkey: '', isGlobal: false },
            rate2: { allowGlobal: true, hotkey: '', isGlobal: false },
            rate3: { allowGlobal: true, hotkey: '', isGlobal: false },
            rate4: { allowGlobal: true, hotkey: '', isGlobal: false },
            rate5: { allowGlobal: true, hotkey: '', isGlobal: false },
            skipBackward: { allowGlobal: true, hotkey: '', isGlobal: false },
            skipForward: { allowGlobal: true, hotkey: '', isGlobal: false },
            stop: { allowGlobal: true, hotkey: '', isGlobal: false },
            toggleFullscreenPlayer: { allowGlobal: false, hotkey: '', isGlobal: false },
            toggleQueue: { allowGlobal: false, hotkey: '', isGlobal: false },
            toggleRepeat: { allowGlobal: true, hotkey: '', isGlobal: false },
            toggleShuffle: { allowGlobal: true, hotkey: '', isGlobal: false },
            volumeDown: { allowGlobal: true, hotkey: '', isGlobal: false },
            volumeMute: { allowGlobal: true, hotkey: '', isGlobal: false },
            volumeUp: { allowGlobal: true, hotkey: '', isGlobal: false },
            zoomIn: { allowGlobal: true, hotkey: '', isGlobal: false },
            zoomOut: { allowGlobal: true, hotkey: '', isGlobal: false },
        },
        globalMediaHotkeys: true,
    },
    lists: {
        ['albumDetail']: {
            display: ListDisplayType.TABLE,
            grid: {
                itemGap: 'sm',
                itemsPerRow: 6,
                itemsPerRowEnabled: false,
                rows: [],
                size: 'default',
            },
            itemsPerPage: 100,
            pagination: ListPaginationType.INFINITE,
            table: {
                autoFitColumns: true,
                columns: pickTableColumns({
                    autoSizeColumns: [],
                    columns: SONG_TABLE_COLUMNS,
                    columnWidths: {
                        [TableColumn.DURATION]: 100,
                        [TableColumn.TITLE]: 400,
                        [TableColumn.TRACK_NUMBER]: 50,
                        [TableColumn.USER_FAVORITE]: 60,
                    },
                    enabledColumns: [
                        TableColumn.TRACK_NUMBER,
                        TableColumn.TITLE,
                        TableColumn.DURATION,
                        TableColumn.USER_FAVORITE,
                    ],
                }),
                enableAlternateRowColors: false,
                enableHorizontalBorders: false,
                enableRowHoverHighlight: true,
                enableVerticalBorders: false,
                size: 'compact',
            },
        },
        fullScreen: {
            display: ListDisplayType.TABLE,
            grid: {
                itemGap: 'sm',
                itemsPerRow: 6,
                itemsPerRowEnabled: false,
                rows: [],
                size: 'default',
            },
            itemsPerPage: 100,
            pagination: ListPaginationType.INFINITE,
            table: {
                autoFitColumns: true,
                columns: SONG_TABLE_COLUMNS.map((column) => ({
                    align: column.align,
                    autoSize: column.autoSize,
                    id: column.value,
                    isEnabled: column.isEnabled,
                    pinned: column.pinned,
                    width: column.width,
                })),
                enableAlternateRowColors: false,
                enableHorizontalBorders: false,
                enableRowHoverHighlight: true,
                enableVerticalBorders: false,
                size: 'default',
            },
        },
        [LibraryItem.ALBUM]: {
            display: ListDisplayType.GRID,
            grid: {
                itemGap: 'sm',
                itemsPerRow: 6,
                itemsPerRowEnabled: false,
                rows: pickGridRows({
                    alignLeftColumns: [
                        TableColumn.TITLE,
                        TableColumn.ALBUM_ARTIST,
                        TableColumn.YEAR,
                    ],
                    columns: ALBUM_TABLE_COLUMNS,
                    enabledColumns: [TableColumn.TITLE, TableColumn.ALBUM_ARTIST, TableColumn.YEAR],
                    pickColumns: [
                        TableColumn.TITLE,
                        TableColumn.DURATION,
                        TableColumn.ALBUM_ARTIST,
                        TableColumn.BIT_RATE,
                        TableColumn.BPM,
                        TableColumn.DATE_ADDED,
                        TableColumn.GENRE,
                        TableColumn.PLAY_COUNT,
                        TableColumn.SONG_COUNT,
                        TableColumn.RELEASE_DATE,
                        TableColumn.LAST_PLAYED,
                        TableColumn.YEAR,
                    ],
                }),
                size: 'default',
            },
            itemsPerPage: 100,
            pagination: ListPaginationType.INFINITE,
            table: {
                autoFitColumns: true,
                columns: ALBUM_TABLE_COLUMNS.map((column) => ({
                    align: column.align,
                    autoSize: column.autoSize,
                    id: column.value,
                    isEnabled: column.isEnabled,
                    pinned: column.pinned,
                    width: column.width,
                })),
                enableAlternateRowColors: false,
                enableHorizontalBorders: false,
                enableRowHoverHighlight: true,
                enableVerticalBorders: false,
                size: 'default',
            },
        },
        [LibraryItem.ALBUM_ARTIST]: {
            display: ListDisplayType.GRID,
            grid: {
                itemGap: 'sm',
                itemsPerRow: 6,
                itemsPerRowEnabled: false,
                rows: pickGridRows({
                    alignLeftColumns: [TableColumn.TITLE],
                    columns: ALBUM_ARTIST_TABLE_COLUMNS,
                    enabledColumns: [TableColumn.TITLE],
                    pickColumns: [
                        TableColumn.TITLE,
                        TableColumn.PLAY_COUNT,
                        TableColumn.ALBUM_COUNT,
                        TableColumn.SONG_COUNT,
                    ],
                }),
                size: 'default',
            },
            itemsPerPage: 100,
            pagination: ListPaginationType.INFINITE,
            table: {
                autoFitColumns: true,
                columns: pickTableColumns({
                    autoSizeColumns: [TableColumn.TITLE],
                    columns: ALBUM_ARTIST_TABLE_COLUMNS,
                    enabledColumns: [
                        TableColumn.ROW_INDEX,
                        TableColumn.IMAGE,
                        TableColumn.TITLE,
                        TableColumn.USER_FAVORITE,
                    ],
                }),
                enableAlternateRowColors: false,
                enableHorizontalBorders: false,
                enableRowHoverHighlight: true,
                enableVerticalBorders: false,
                size: 'default',
            },
        },
        [LibraryItem.ARTIST]: {
            display: ListDisplayType.GRID,
            grid: {
                itemGap: 'sm',
                itemsPerRow: 6,
                itemsPerRowEnabled: false,
                rows: pickGridRows({
                    alignLeftColumns: [TableColumn.TITLE],
                    columns: ALBUM_ARTIST_TABLE_COLUMNS,
                    enabledColumns: [TableColumn.TITLE],
                    pickColumns: [
                        TableColumn.TITLE,
                        TableColumn.PLAY_COUNT,
                        TableColumn.ALBUM_COUNT,
                        TableColumn.SONG_COUNT,
                    ],
                }),
                size: 'default',
            },
            itemsPerPage: 100,
            pagination: ListPaginationType.INFINITE,
            table: {
                autoFitColumns: true,
                columns: pickTableColumns({
                    autoSizeColumns: [TableColumn.TITLE],
                    columns: ALBUM_ARTIST_TABLE_COLUMNS,
                    enabledColumns: [
                        TableColumn.ROW_INDEX,
                        TableColumn.IMAGE,
                        TableColumn.TITLE,
                        TableColumn.ALBUM_COUNT,
                        TableColumn.SONG_COUNT,
                        TableColumn.PLAY_COUNT,
                        TableColumn.LAST_PLAYED,
                        TableColumn.USER_FAVORITE,
                        TableColumn.USER_RATING,
                    ],
                }),
                enableAlternateRowColors: false,
                enableHorizontalBorders: false,
                enableRowHoverHighlight: true,
                enableVerticalBorders: false,
                size: 'default',
            },
        },
        [LibraryItem.GENRE]: {
            display: ListDisplayType.TABLE,
            grid: {
                itemGap: 'sm',
                itemsPerRow: 6,
                itemsPerRowEnabled: false,
                rows: pickGridRows({
                    alignLeftColumns: [
                        TableColumn.TITLE,
                        TableColumn.SONG_COUNT,
                        TableColumn.ALBUM_COUNT,
                    ],
                    columns: GENRE_TABLE_COLUMNS,
                    enabledColumns: [
                        TableColumn.TITLE,
                        TableColumn.SONG_COUNT,
                        TableColumn.ALBUM_COUNT,
                    ],
                    pickColumns: [
                        TableColumn.TITLE,
                        TableColumn.ALBUM_COUNT,
                        TableColumn.SONG_COUNT,
                    ],
                }),
                size: 'default',
            },
            itemsPerPage: 100,
            pagination: ListPaginationType.INFINITE,
            table: {
                autoFitColumns: false,
                columns: GENRE_TABLE_COLUMNS.map((column) => ({
                    align: column.align,
                    autoSize: column.autoSize,
                    id: column.value,
                    isEnabled: column.isEnabled,
                    pinned: column.pinned,
                    width: column.width,
                })),
                enableAlternateRowColors: false,
                enableHorizontalBorders: false,
                enableRowHoverHighlight: true,
                enableVerticalBorders: false,
                size: 'compact',
            },
        },
        [LibraryItem.PLAYLIST]: {
            display: ListDisplayType.TABLE,
            grid: {
                itemGap: 'sm',
                itemsPerRow: 6,
                itemsPerRowEnabled: false,
                rows: pickGridRows({
                    alignLeftColumns: [TableColumn.TITLE, TableColumn.SONG_COUNT],
                    columns: PLAYLIST_TABLE_COLUMNS,
                    enabledColumns: [TableColumn.TITLE],
                    pickColumns: [TableColumn.TITLE, TableColumn.SONG_COUNT],
                }),
                size: 'default',
            },
            itemsPerPage: 100,
            pagination: ListPaginationType.INFINITE,
            table: {
                autoFitColumns: true,
                columns: pickTableColumns({
                    autoSizeColumns: [TableColumn.TITLE],
                    columns: PLAYLIST_TABLE_COLUMNS,
                    enabledColumns: [
                        TableColumn.ROW_INDEX,
                        TableColumn.TITLE,
                        TableColumn.DURATION,
                        TableColumn.SONG_COUNT,
                    ],
                }),
                enableAlternateRowColors: false,
                enableHorizontalBorders: false,
                enableRowHoverHighlight: true,
                enableVerticalBorders: false,
                size: 'default',
            },
        },
        [LibraryItem.PLAYLIST_SONG]: {
            display: ListDisplayType.TABLE,
            grid: {
                itemGap: 'sm',
                itemsPerRow: 6,
                itemsPerRowEnabled: false,
                rows: pickGridRows({
                    alignLeftColumns: [TableColumn.TITLE, TableColumn.ARTIST],
                    columns: PLAYLIST_SONG_TABLE_COLUMNS,
                    enabledColumns: [TableColumn.TITLE, TableColumn.ARTIST],
                    pickColumns: [
                        TableColumn.TITLE,
                        TableColumn.ARTIST,
                        TableColumn.DURATION,
                        TableColumn.YEAR,
                        TableColumn.BIT_RATE,
                        TableColumn.BPM,
                        TableColumn.CODEC,
                        TableColumn.DATE_ADDED,
                        TableColumn.GENRE,
                        TableColumn.LAST_PLAYED,
                        TableColumn.RELEASE_DATE,
                        TableColumn.TRACK_NUMBER,
                    ],
                }),
                size: 'default',
            },
            itemsPerPage: 100,
            pagination: ListPaginationType.INFINITE,
            table: {
                autoFitColumns: true,
                columns: PLAYLIST_SONG_TABLE_COLUMNS.map((column) => ({
                    align: column.align,
                    autoSize: column.autoSize,
                    id: column.value,
                    isEnabled: column.isEnabled,
                    pinned: column.pinned,
                    width: column.width,
                })),
                enableAlternateRowColors: false,
                enableHorizontalBorders: false,
                enableRowHoverHighlight: true,
                enableVerticalBorders: false,
                size: 'default',
            },
        },
        [LibraryItem.QUEUE_SONG]: {
            display: ListDisplayType.TABLE,
            grid: {
                itemGap: 'sm',
                itemsPerRow: 6,
                itemsPerRowEnabled: false,
                rows: [],
                size: 'default',
            },
            itemsPerPage: 100,
            pagination: ListPaginationType.INFINITE,
            table: {
                autoFitColumns: true,
                columns: SONG_TABLE_COLUMNS.map((column) => ({
                    align: column.align,
                    autoSize: column.autoSize,
                    id: column.value,
                    isEnabled: column.isEnabled,
                    pinned: column.pinned,
                    width: column.width,
                })),
                enableAlternateRowColors: false,
                enableHorizontalBorders: false,
                enableRowHoverHighlight: true,
                enableVerticalBorders: false,
                size: 'default',
            },
        },
        [LibraryItem.SONG]: {
            display: ListDisplayType.TABLE,
            grid: {
                itemGap: 'sm',
                itemsPerRow: 6,
                itemsPerRowEnabled: false,
                rows: pickGridRows({
                    alignLeftColumns: [TableColumn.TITLE, TableColumn.ARTIST],
                    columns: SONG_TABLE_COLUMNS,
                    enabledColumns: [TableColumn.TITLE, TableColumn.ARTIST],
                    pickColumns: [
                        TableColumn.TITLE,
                        TableColumn.ARTIST,
                        TableColumn.DURATION,
                        TableColumn.YEAR,
                        TableColumn.BIT_RATE,
                        TableColumn.BPM,
                        TableColumn.CODEC,
                        TableColumn.DATE_ADDED,
                        TableColumn.GENRE,
                        TableColumn.LAST_PLAYED,
                        TableColumn.RELEASE_DATE,
                        TableColumn.TRACK_NUMBER,
                    ],
                }),
                size: 'default',
            },
            itemsPerPage: 100,
            pagination: ListPaginationType.PAGINATED,
            table: {
                autoFitColumns: true,
                columns: SONG_TABLE_COLUMNS.map((column) => ({
                    align: column.align,
                    autoSize: column.autoSize,
                    id: column.value,
                    isEnabled: column.isEnabled,
                    pinned: column.pinned,
                    width: column.width,
                })),
                enableAlternateRowColors: false,
                enableHorizontalBorders: false,
                enableRowHoverHighlight: true,
                enableVerticalBorders: false,
                size: 'default',
            },
        },
        ['sideQueue']: {
            display: ListDisplayType.TABLE,
            grid: {
                itemGap: 'sm',
                itemsPerRow: 6,
                itemsPerRowEnabled: false,
                rows: [],
                size: 'default',
            },
            itemsPerPage: 100,
            pagination: ListPaginationType.INFINITE,
            table: {
                autoFitColumns: true,
                columns: pickTableColumns({
                    autoSizeColumns: [TableColumn.TITLE_COMBINED],
                    columns: SONG_TABLE_COLUMNS,
                    enabledColumns: [
                        TableColumn.ROW_INDEX,
                        TableColumn.TITLE_COMBINED,
                        TableColumn.DURATION,
                        TableColumn.USER_FAVORITE,
                    ],
                }),
                enableAlternateRowColors: false,
                enableHorizontalBorders: false,
                enableRowHoverHighlight: true,
                enableVerticalBorders: false,
                size: 'default',
            },
        },
    },
    lyrics: {
        alignment: 'center',
        delayMs: 0,
        enableAutoTranslation: false,
        enableNeteaseTranslation: false,
        fetch: true,
        follow: true,
        preferLocalLyrics: true,
        showMatch: true,
        showProvider: true,
        sources: [LyricSource.NETEASE, LyricSource.LRCLIB],
        translationApiKey: '',
        translationApiProvider: '',
        translationTargetLanguage: 'en',
    },
    lyricsDisplay: {
        default: {
            fontSize: 24,
            fontSizeUnsync: 24,
            gap: 24,
            gapUnsync: 24,
        },
    },
    playback: {
        audioDeviceId: undefined,
        audioFadeOnStatusChange: true,
        filters: [],
        mediaSession: false,
        mpvExtraParameters: [],
        mpvProperties: {
            audioExclusiveMode: 'no',
            audioFormat: undefined,
            audioSampleRateHz: 0,
            gaplessAudio: 'weak',
            replayGainClip: true,
            replayGainFallbackDB: undefined,
            replayGainMode: 'no',
            replayGainPreampDB: 0,
        },
        preservePitch: true,
        scrobble: {
            enabled: true,
            notify: false,
            scrobbleAtDuration: 240,
            scrobbleAtPercentage: 75,
        },
        transcode: {
            enabled: false,
        },
        type: PlayerType.WEB,
        webAudio: true,
    },
    queryBuilder: {
        tag: [],
    },
    remote: {
        enabled: false,
        password: randomString(8),
        port: 4333,
        username: 'feishin',
    },
    tab: 'general',
    visualizer: {
        audiomotionanalyzer: {
            alphaBars: false,
            ansiBands: false,
            barSpace: 0.7,
            channelLayout: 'single',
            colorMode: 'gradient',
            customGradients: [],
            fadePeaks: true,
            fftSize: 16384,
            fillAlpha: 0,
            frequencyScale: 'log',
            gradient: 'prism',
            gravity: 11,
            ledBars: false,
            linearAmplitude: false,
            linearBoost: 4,
            lineWidth: 1.9,
            loRes: false,
            lumiBars: false,
            maxDecibels: -25,
            maxFPS: 0,
            maxFreq: 22050,
            minDecibels: -85,
            minFreq: 20,
            mirror: 0,
            mode: 10,
            noteLabels: false,
            opacity: 1,
            outlineBars: false,
            peakFadeTime: 900,
            peakHoldTime: 500,
            peakLine: true,
            presets: audiomotionanalyzerPresets,
            radial: false,
            radialInvert: false,
            radius: 0.7,
            reflexAlpha: 0.1,
            reflexBright: 1,
            reflexFit: false,
            reflexRatio: 0.5,
            roundBars: false,
            showFPS: false,
            showPeaks: false,
            showScaleX: false,
            showScaleY: false,
            smoothing: 0.6,
            spinSpeed: 0,
            splitGradient: false,
            trueLeds: false,
            volume: 1,
            weightingFilter: '',
        },
        butterchurn: {
            blendTime: 2.5,
            currentPreset: undefined,
            cyclePresets: true,
            cycleTime: 30,
            ignoredPresets: [],
            includeAllPresets: true,
            maxFPS: 0,
            opacity: 1,
            randomizeNextPreset: true,
            selectedPresets: [],
        },
        type: 'audiomotionanalyzer',
    },
    window: {
        disableAutoUpdate: false,
        exitToTray: false,
        minimizeToTray: false,
        preventSleepOnPlayback: false,
        releaseChannel: 'latest',
        startMinimized: false,
        tray: true,
        windowBarStyle: platformDefaultWindowBarStyle,
    },
};

export const useSettingsStore = createWithEqualityFn<SettingsSlice>()(
    persist(
        devtools(
            subscribeWithSelector(
                immer((set) => ({
                    actions: {
                        reset: () => {
                            localStorage.removeItem('store_settings');
                            window.location.reload();
                        },
                        resetSampleRate: () => {
                            set((state) => {
                                state.playback.mpvProperties.audioSampleRateHz = 0;
                            });
                        },
                        setArtistItems: (items) => {
                            set((state) => {
                                state.general.artistItems = items;
                            });
                        },
                        setArtistReleaseTypeItems: (
                            items: SortableItem<ArtistReleaseTypeItem>[],
                        ) => {
                            set((state) => {
                                state.general.artistReleaseTypeItems = items;
                            });
                        },
                        setGenreBehavior: (target: GenreTarget) => {
                            set((state) => {
                                state.general.genreTarget = target;
                            });
                        },
                        setHomeItems: (items: SortableItem<HomeItem>[]) => {
                            set((state) => {
                                state.general.homeItems = items;
                            });
                        },
                        setList: (type: ItemListKey, data: DeepPartial<ItemListSettings>) => {
                            set((state) => {
                                const listState = state.lists[type];

                                if (listState && data.table) {
                                    Object.assign(listState.table, data.table);
                                    delete data.table;
                                }

                                if (listState && data.grid) {
                                    Object.assign(listState.grid, data.grid);
                                    delete data.grid;
                                }

                                if (listState) {
                                    Object.assign(listState, data);
                                }
                            });
                        },
                        setPlaybackFilters: (filters: PlayerFilter[]) => {
                            set((state) => {
                                state.playback.filters = filters;
                            });
                        },
                        setSettings: (data) => {
                            set((state) => {
                                deepMergeIntoState(state, data);
                            });
                        },
                        setSidebarItems: (items: SidebarItemType[]) => {
                            set((state) => {
                                state.general.sidebarItems = items;
                            });
                        },
                        setTable: (type: ItemListKey, data: DataTableProps) => {
                            set((state) => {
                                const listState = state.lists[type];
                                if (listState) {
                                    listState.table = data;
                                }
                            });
                        },
                        setTranscodingConfig: (config) => {
                            set((state) => {
                                state.playback.transcode = config;
                            });
                        },
                        toggleMediaSession: () => {
                            set((state) => {
                                state.playback.mediaSession = !state.playback.mediaSession;
                            });
                        },
                        toggleSidebarCollapseShare: () => {
                            set((state) => {
                                state.general.sidebarCollapseShared =
                                    !state.general.sidebarCollapseShared;
                            });
                        },
                    },
                    ...initialState,
                })),
            ),
            { name: 'store_settings' },
        ),
        {
            merge: mergeOverridingColumns,
            migrate(persistedState, version) {
                const state = persistedState as SettingsSlice;

                if (version === 8) {
                    state.general.sidebarItems = state.general.sidebarItems.filter(
                        (item) => item.id !== 'Folders',
                    );
                    state.general.sidebarItems.push({
                        disabled: false,
                        id: 'Artists-all',
                        label: i18n.t('page.sidebar.artists'),
                        route: AppRoute.LIBRARY_ARTISTS,
                    });
                }

                if (version <= 9) {
                    if (!state.window.releaseChannel) {
                        state.window.releaseChannel = initialState.window.releaseChannel;
                    }

                    if (!state.playback.mediaSession) {
                        state.playback.mediaSession = initialState.playback.mediaSession;
                    }

                    if (!state.general.artistBackgroundBlur) {
                        state.general.artistBackgroundBlur =
                            initialState.general.artistBackgroundBlur;
                    }

                    if (!state.general.artistBackground) {
                        state.general.artistBackground = initialState.general.artistBackground;
                    }

                    state.window.windowBarStyle = Platform.LINUX;

                    return state;
                }

                if (version <= 10) {
                    state.general.sidebarItems.push({
                        disabled: false,
                        id: 'Favorites',
                        label: i18n.t('page.sidebar.favorites'),
                        route: AppRoute.FAVORITES,
                    });
                }

                if (version <= 11) {
                    return {};
                }

                if (version <= 12) {
                    state.general.sidebarItems.push({
                        disabled: false,
                        id: 'Folders',
                        label: i18n.t('page.sidebar.folders'),
                        route: AppRoute.LIBRARY_FOLDERS,
                    });
                }

                if (version <= 13) {
                    state.general.homeItems.push({
                        disabled: false,
                        id: HomeItem.GENRES,
                    });
                }

                if (version <= 14) {
                    // Add bitDepth and sampleRate columns to song lists

                    const bitDepthColumn: ItemTableListColumnConfig = {
                        align: 'center',
                        autoSize: false,
                        id: TableColumn.BIT_DEPTH,
                        isEnabled: false,
                        pinned: null,
                        width: 100,
                    };

                    const sampleRateColumn: ItemTableListColumnConfig = {
                        align: 'center',
                        autoSize: false,
                        id: TableColumn.SAMPLE_RATE,
                        isEnabled: false,
                        pinned: null,
                        width: 100,
                    };

                    const columns = [bitDepthColumn, sampleRateColumn];

                    state.lists[LibraryItem.SONG]?.table.columns.push(...columns);
                    state.lists[LibraryItem.PLAYLIST_SONG]?.table.columns.push(...columns);
                    state.lists[LibraryItem.QUEUE_SONG]?.table.columns.push(...columns);
                    state.lists['albumDetail']?.table.columns.push(...columns);
                    state.lists['fullscreen']?.table.columns.push(...columns);
                    state.lists['sidequeue']?.table.columns.push(...columns);
                }

                if (version <= 15) {
                    state.general.sidebarItems.push({
                        disabled: false,
                        id: 'Radio',
                        label: i18n.t('page.sidebar.radio'),
                        route: AppRoute.RADIO,
                    });
                }

                // Version 16 introduced a bug where the release channel may have been reset
                // to the latest channel. This is to revert it.
                if (version === 16) {
                    state.window.releaseChannel = 'beta';
                }

                if (version <= 17) {
                    // Migrate lyrics settings from record structure to separate lyrics and lyricsDisplay
                    if (
                        state.lyrics &&
                        typeof state.lyrics === 'object' &&
                        'default' in state.lyrics
                    ) {
                        const oldLyrics = state.lyrics as any;
                        const defaultSettings = oldLyrics.default || oldLyrics;

                        // Extract display settings
                        const displaySettings = {
                            fontSize: defaultSettings.fontSize || 24,
                            fontSizeUnsync: defaultSettings.fontSizeUnsync || 24,
                            gap: defaultSettings.gap || 24,
                            gapUnsync: defaultSettings.gapUnsync || 24,
                        };

                        // Remove display properties from main settings
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const { fontSize, fontSizeUnsync, gap, gapUnsync, ...mainSettings } =
                            defaultSettings;

                        state.lyrics = mainSettings;
                        state.lyricsDisplay = {
                            default: displaySettings,
                        };
                    }
                }

                if (version <= 18) {
                    // Add isEnabled property to all existing player filters
                    if (state.playback?.filters && Array.isArray(state.playback.filters)) {
                        state.playback.filters = state.playback.filters.map((filter) => ({
                            ...filter,
                            isEnabled: true,
                        }));
                    }
                }

                if (version <= 19) {
                    // Add IDs to presets that don't have them
                    if (
                        state.visualizer?.audiomotionanalyzer?.presets &&
                        Array.isArray(state.visualizer.audiomotionanalyzer.presets)
                    ) {
                        state.visualizer.audiomotionanalyzer.presets =
                            state.visualizer.audiomotionanalyzer.presets.map((preset) => {
                                if (!preset.id) {
                                    return {
                                        ...preset,
                                        id: nanoid(),
                                    };
                                }
                                return preset;
                            });
                    }
                }

                if (version <= 20) {
                    // Add TITLE_ARTIST column to SONG and ALBUM table configs
                    const titleArtistColumn: ItemTableListColumnConfig = {
                        align: 'start',
                        autoSize: false,
                        id: TableColumn.TITLE_ARTIST,
                        isEnabled: false,
                        pinned: null,
                        width: 300,
                    };

                    const listKeysToUpdate: (LibraryItem | string)[] = [
                        LibraryItem.SONG,
                        LibraryItem.ALBUM,
                        LibraryItem.PLAYLIST_SONG,
                        LibraryItem.QUEUE_SONG,
                        ItemListKey.ALBUM_DETAIL,
                        ItemListKey.FULL_SCREEN,
                        ItemListKey.SIDE_QUEUE,
                    ];

                    listKeysToUpdate.forEach((listKey) => {
                        const listConfig = state.lists[listKey];
                        if (listConfig?.table?.columns) {
                            const columns = listConfig.table.columns;
                            const hasTitleArtist = columns.some(
                                (col) => col.id === TableColumn.TITLE_ARTIST,
                            );
                            if (!hasTitleArtist) {
                                const titleCombinedIndex = columns.findIndex(
                                    (col) => col.id === TableColumn.TITLE_COMBINED,
                                );
                                if (titleCombinedIndex >= 0) {
                                    columns.splice(titleCombinedIndex + 1, 0, titleArtistColumn);
                                } else {
                                    columns.push(titleArtistColumn);
                                }
                            }
                        }
                    });
                }

                if (version <= 21) {
                    // Add COMPOSER column to SONG and ALBUM table configs
                    const composerColumn: ItemTableListColumnConfig = {
                        align: 'start',
                        autoSize: false,
                        id: TableColumn.COMPOSER,
                        isEnabled: false,
                        pinned: null,
                        width: 300,
                    };

                    const listKeysToUpdate: (LibraryItem | string)[] = [
                        LibraryItem.SONG,
                        LibraryItem.ALBUM,
                        LibraryItem.PLAYLIST_SONG,
                        LibraryItem.QUEUE_SONG,
                        ItemListKey.ALBUM_DETAIL,
                        ItemListKey.FULL_SCREEN,
                        ItemListKey.SIDE_QUEUE,
                    ];

                    listKeysToUpdate.forEach((listKey) => {
                        const listConfig = state.lists[listKey];
                        if (listConfig?.table?.columns) {
                            const columns = listConfig.table.columns;
                            const hasComposer = columns.some(
                                (col) => col.id === TableColumn.COMPOSER,
                            );
                            if (!hasComposer) {
                                const artistIndex = columns.findIndex(
                                    (col) => col.id === TableColumn.ARTIST,
                                );
                                if (artistIndex >= 0) {
                                    columns.splice(artistIndex + 1, 0, composerColumn);
                                } else {
                                    columns.push(composerColumn);
                                }
                            }
                        }
                    });
                }

                return persistedState;
            },
            name: 'store_settings',
            version: 22,
        },
    ),
);

export const useSettingsStoreActions = () => useSettingsStore((state) => state.actions);

export const usePlaybackSettings = () => useSettingsStore((state) => state.playback, shallow);

export const useTableSettings = (type: ItemListKey) =>
    useSettingsStore((state) => state.lists[type as keyof typeof state.lists]);

export const useGeneralSettings = () => useSettingsStore((state) => state.general, shallow);

export const usePlaybackType = () => useSettingsStore((state) => state.playback.type, shallow);

export const usePlayButtonBehavior = () =>
    useSettingsStore((state) => state.general.playButtonBehavior, shallow);

export const useWindowSettings = () => useSettingsStore((state) => state.window, shallow);

export const useHotkeySettings = () => useSettingsStore((state) => state.hotkeys, shallow);

export const useMpvSettings = () =>
    useSettingsStore((state) => state.playback.mpvProperties, shallow);

export const useLyricsSettings = () => useSettingsStore((state) => state.lyrics, shallow);

export const useLyricsDisplaySettings = (key: string = 'default') =>
    useSettingsStore((state) => state.lyricsDisplay[key] || state.lyricsDisplay.default, shallow);

export const useRemoteSettings = () => useSettingsStore((state) => state.remote, shallow);

export const useFontSettings = () => useSettingsStore((state) => state.font, shallow);

export const useDiscordSettings = () => useSettingsStore((state) => state.discord, shallow);

export const useCssSettings = () => useSettingsStore((state) => state.css, shallow);

export const useQueryBuilderSettings = () =>
    useSettingsStore((state) => state.queryBuilder, shallow);

const getSettingsStoreVersion = () => useSettingsStore.persist.getOptions().version!;

export const useSettingsForExport = (): SettingsState & { version: number } =>
    useSettingsStore((state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- actions needs to be omitted from the export as it contains store functions
        const { actions, ...otherSettings } = state;
        return {
            ...otherSettings,
            version: getSettingsStoreVersion(),
        };
    });

export const migrateSettings = (settings: SettingsState, settingsVersion: number): SettingsState =>
    useSettingsStore.persist.getOptions().migrate!(settings, settingsVersion) as SettingsState;

export const useListSettings = (type: ItemListKey) =>
    useSettingsStore(
        (state) => state.lists[type as keyof typeof state.lists],
        shallow,
    ) as ItemListSettings;

export const usePrimaryColor = () => useSettingsStore((store) => store.general.accent, shallow);

export const usePlayerbarSlider = () =>
    useSettingsStore((store) => store.general.playerbarSlider, shallow);

export const useGenreTarget = () => useSettingsStore((store) => store.general.genreTarget, shallow);

export const useLanguage = () => useSettingsStore((state) => state.general.language, shallow);

export const useAccent = () => useSettingsStore((state) => state.general.accent, shallow);

export const useNativeAspectRatio = () =>
    useSettingsStore((state) => state.general.nativeAspectRatio, shallow);

export const useButtonSize = () => useSettingsStore((state) => state.general.buttonSize, shallow);

export const useSkipButtons = () => useSettingsStore((state) => state.general.skipButtons, shallow);

export const useImageRes = () => useSettingsStore((state) => state.general.imageRes, shallow);

export const useVolumeWidth = () => useSettingsStore((state) => state.general.volumeWidth, shallow);

export const useFollowCurrentSong = () =>
    useSettingsStore((state) => state.general.followCurrentSong, shallow);

export const useThemeSettings = () =>
    useSettingsStore(
        (state) => ({
            followSystemTheme: state.general.followSystemTheme,
            theme: state.general.theme,
            themeDark: state.general.themeDark,
            themeLight: state.general.themeLight,
            useThemeAccentColor: state.general.useThemeAccentColor,
        }),
        shallow,
    );

export const useSideQueueType = () =>
    useSettingsStore((state) => state.general.sideQueueType, shallow);

export const useVolumeWheelStep = () =>
    useSettingsStore((state) => state.general.volumeWheelStep, shallow);

export const useSidebarPlaylistList = () =>
    useSettingsStore((state) => state.general.sidebarPlaylistList, shallow);

export const useSidebarPlaylistSorting = () =>
    useSettingsStore((state) => state.general.sidebarPlaylistSorting, shallow);

export const useSidebarItems = () =>
    useSettingsStore((state) => state.general.sidebarItems, shallow);

export const useSidebarCollapsedNavigation = () =>
    useSettingsStore((state) => state.general.sidebarCollapsedNavigation, shallow);

export const usePlayerbarOpenDrawer = () =>
    useSettingsStore((state) => state.general.playerbarOpenDrawer, shallow);

export const useShowRatings = () => useSettingsStore((state) => state.general.showRatings, shallow);

export const useArtistRadioCount = () =>
    useSettingsStore((state) => state.general.artistRadioCount, shallow);

export const useArtistBackground = () =>
    useSettingsStore(
        (state) => ({
            artistBackground: state.general.artistBackground,
            artistBackgroundBlur: state.general.artistBackgroundBlur,
        }),
        shallow,
    );

export const useAlbumBackground = () =>
    useSettingsStore(
        (state) => ({
            albumBackground: state.general.albumBackground,
            albumBackgroundBlur: state.general.albumBackgroundBlur,
        }),
        shallow,
    );

export const useExternalLinks = () =>
    useSettingsStore(
        (state) => ({
            externalLinks: state.general.externalLinks,
            lastFM: state.general.lastFM,
            musicBrainz: state.general.musicBrainz,
        }),
        shallow,
    );

export const useHomeFeature = () => useSettingsStore((state) => state.general.homeFeature, shallow);

export const useHomeFeatureStyle = () =>
    useSettingsStore((state) => state.general.homeFeatureStyle);

export const useHomeItems = () => useSettingsStore((state) => state.general.homeItems, shallow);

export const useArtistItems = () => useSettingsStore((state) => state.general.artistItems, shallow);

export const useArtistReleaseTypeItems = () =>
    useSettingsStore((state) => state.general.artistReleaseTypeItems, shallow);

export const useZoomFactor = () => useSettingsStore((state) => state.general.zoomFactor, shallow);

export const usePathReplace = () =>
    useSettingsStore(
        (state) => ({
            pathReplace: state.general.pathReplace,
            pathReplaceWith: state.general.pathReplaceWith,
        }),
        shallow,
    );

export const useLastfmApiKey = () =>
    useSettingsStore((state) => state.general.lastfmApiKey, shallow);

export const useSidebarPanelOrder = () =>
    useSettingsStore((state) => state.general.sidebarPanelOrder, shallow);

export const useCombinedLyricsAndVisualizer = () =>
    useSettingsStore((state) => state.general.combinedLyricsAndVisualizer, shallow);

export const useShowLyricsInSidebar = () =>
    useSettingsStore((state) => state.general.showLyricsInSidebar, shallow);

export const useShowVisualizerInSidebar = () =>
    useSettingsStore((state) => state.general.showVisualizerInSidebar, shallow);

export const useAutoDJSettings = () => useSettingsStore((store) => store.autoDJ, shallow);

export const useVisualizerSettings = () => useSettingsStore((store) => store.visualizer, shallow);

export const subscribeButterchurnPreset = (
    onChange: (preset: string | undefined, prevPreset: string | undefined) => void,
) => {
    return useSettingsStore.subscribe(
        (state) => state.visualizer.butterchurn.currentPreset,
        (preset, prevPreset) => {
            onChange(preset, prevPreset);
        },
    );
};

export const useButterchurnSettings = () => {
    return useSettingsStore((store) => {
        return {
            blendTime: store.visualizer.butterchurn.blendTime,
            cyclePresets: store.visualizer.butterchurn.cyclePresets,
            cycleTime: store.visualizer.butterchurn.cycleTime,
            ignoredPresets: store.visualizer.butterchurn.ignoredPresets,
            includeAllPresets: store.visualizer.butterchurn.includeAllPresets,
            maxFPS: store.visualizer.butterchurn.maxFPS,
            opacity: store.visualizer.butterchurn.opacity,
            randomizeNextPreset: store.visualizer.butterchurn.randomizeNextPreset,
            selectedPresets: store.visualizer.butterchurn.selectedPresets,
        };
    }, shallow);
};
