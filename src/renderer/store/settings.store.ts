import isElectron from 'is-electron';
import { generatePath } from 'react-router';
import { z } from 'zod';
import { devtools, persist } from 'zustand/middleware';
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
import { ContextMenuItemType } from '/@/renderer/features/context-menu/events';
import { AppRoute } from '/@/renderer/router/routes';
import { mergeOverridingColumns } from '/@/renderer/store/utils';
import { FontValueSchema } from '/@/renderer/types/fonts';
import { randomString } from '/@/renderer/utils';
import { sanitizeCss } from '/@/renderer/utils/sanitize';
import { AppTheme } from '/@/shared/themes/app-theme-types';
import { LibraryItem, LyricSource } from '/@/shared/types/domain-types';
import {
    CrossfadeStyle,
    FontType,
    ItemListKey,
    ListDisplayType,
    ListPaginationType,
    Platform,
    Play,
    PlayerStyle,
    PlayerType,
    TableColumn,
} from '/@/shared/types/types';

type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

const HomeItemSchema = z.enum([
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
]);

const DiscordDisplayTypeSchema = z.enum(['artist', 'feishin', 'song']);

const DiscordLinkTypeSchema = z.enum(['last_fm', 'musicbrainz', 'musicbrainz_last_fm', 'none']);

const GenreTargetSchema = z.enum(['album', 'track']);

const SideQueueTypeSchema = z.enum(['sideDrawerQueue', 'sideQueue']);

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

const GeneralSettingsSchema = z.object({
    accent: z
        .string()
        .refine(
            (val) => /^rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)$/.test(val),
            {
                message: 'Accent must be a valid rgb() color string',
            },
        ),
    albumArtRes: z.number().nullable().optional(),
    albumBackground: z.boolean(),
    albumBackgroundBlur: z.number(),
    artistBackground: z.boolean(),
    artistBackgroundBlur: z.number(),
    artistItems: z.array(SortableItemSchema(ArtistItemSchema)),
    buttonSize: z.number(),
    disabledContextMenu: z.record(z.boolean()),
    doubleClickQueueAll: z.boolean(),
    externalLinks: z.boolean(),
    followSystemTheme: z.boolean(),
    genreTarget: GenreTargetSchema,
    homeFeature: z.boolean(),
    homeItems: z.array(SortableItemSchema(HomeItemSchema)),
    language: z.string(),
    lastFM: z.boolean(),
    lastfmApiKey: z.string(),
    musicBrainz: z.boolean(),
    nativeAspectRatio: z.boolean(),
    passwordStore: z.string().optional(),
    playButtonBehavior: z.nativeEnum(Play),
    playerbarOpenDrawer: z.boolean(),
    resume: z.boolean(),
    showQueueDrawerButton: z.boolean(),
    sidebarCollapsedNavigation: z.boolean(),
    sidebarCollapseShared: z.boolean(),
    sidebarItems: z.array(SidebarItemTypeSchema),
    sidebarPlaylistList: z.boolean(),
    sideQueueType: SideQueueTypeSchema,
    skipButtons: SkipButtonsSchema,
    theme: z.nativeEnum(AppTheme),
    themeDark: z.nativeEnum(AppTheme),
    themeLight: z.nativeEnum(AppTheme),
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

const LyricsSettingsSchema = z.object({
    alignment: z.enum(['center', 'left', 'right']),
    delayMs: z.number(),
    enableAutoTranslation: z.boolean(),
    enableNeteaseTranslation: z.boolean(),
    fetch: z.boolean(),
    follow: z.boolean(),
    fontSize: z.number(),
    fontSizeUnsync: z.number(),
    gap: z.number(),
    gapUnsync: z.number(),
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

const PlaybackSettingsSchema = z.object({
    audioDeviceId: z.string().nullable().optional(),
    crossfadeDuration: z.number(),
    crossfadeStyle: z.nativeEnum(CrossfadeStyle),
    mediaSession: z.boolean(),
    mpvExtraParameters: z.array(z.string()),
    mpvProperties: MpvSettingsSchema,
    muted: z.boolean(),
    preservePitch: z.boolean(),
    scrobble: ScrobbleSettingsSchema,
    style: z.nativeEnum(PlayerStyle),
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

/**
 * This schema is used for validation of the imported settings json
 */
export const ValidationSettingsStateSchema = z.object({
    css: CssSettingsSchema,
    discord: DiscordSettingsSchema,
    font: FontSettingsSchema,
    general: GeneralSettingsSchema,
    hotkeys: HotkeysSettingsSchema,
    lists: z.record(z.nativeEnum(ItemListKey), ItemListConfigSchema),
    lyrics: LyricsSettingsSchema,
    playback: PlaybackSettingsSchema,
    remote: RemoteSettingsSchema,
    tab: z.union([
        z.literal('general'),
        z.literal('hotkeys'),
        z.literal('playback'),
        z.literal('window'),
        z.string(),
    ]),
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
    COMPILATIONS = 'compilations',
    RECENT_ALBUMS = 'recentAlbums',
    SIMILAR_ARTISTS = 'similarArtists',
    TOP_SONGS = 'topSongs',
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
    MOST_PLAYED = 'mostPlayed',
    RANDOM = 'random',
    RECENTLY_ADDED = 'recentlyAdded',
    RECENTLY_PLAYED = 'recentlyPlayed',
    RECENTLY_RELEASED = 'recentlyReleased',
}

export type DataGridProps = {
    itemGap: 'lg' | 'md' | 'sm' | 'xl' | 'xs';
    itemsPerRow: number;
    itemsPerRowEnabled: boolean;
    rows: ItemGridListRowConfig[];
};

export type DataTableProps = z.infer<typeof ItemTableListPropsSchema>;
export type ItemListSettings = {
    display: ListDisplayType;
    grid: DataGridProps;
    itemsPerPage: number;
    pagination: ListPaginationType;
    table: DataTableProps;
};

export interface SettingsSlice extends z.infer<typeof SettingsStateSchema> {
    actions: {
        reset: () => void;
        resetSampleRate: () => void;
        setArtistItems: (item: SortableItem<ArtistItem>[]) => void;
        setGenreBehavior: (target: GenreTarget) => void;
        setHomeItems: (item: SortableItem<HomeItem>[]) => void;
        setList: (type: ItemListKey, data: DeepPartial<ItemListSettings>) => void;
        setSettings: (data: Partial<SettingsState>) => void;
        setSidebarItems: (items: SidebarItemType[]) => void;
        setTable: (type: ItemListKey, data: DataTableProps) => void;
        setTranscodingConfig: (config: TranscodingConfig) => void;
        toggleContextMenuItem: (item: ContextMenuItemType) => void;
        toggleMediaSession: () => void;
        toggleSidebarCollapseShare: () => void;
    };
}

export interface SettingsState extends z.infer<typeof SettingsStateSchema> {}

export type SidebarItemType = z.infer<typeof SidebarItemTypeSchema>;

export type SideQueueType = z.infer<typeof SideQueueTypeSchema>;

export type SortableItem<T> = {
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
        disabled: true,
        id: 'Playlists',
        label: i18n.t('page.sidebar.playlists'),
        route: AppRoute.PLAYLISTS,
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

// Determines the default/initial windowBarStyle value based on the current platform.
const getPlatformDefaultWindowBarStyle = (): Platform => {
    // Prefer native window bar
    return Platform.LINUX;
};

const platformDefaultWindowBarStyle: Platform = getPlatformDefaultWindowBarStyle();

const initialState: SettingsState = {
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
        albumArtRes: undefined,
        albumBackground: false,
        albumBackgroundBlur: 6,
        artistBackground: false,
        artistBackgroundBlur: 6,
        artistItems,
        buttonSize: 15,
        disabledContextMenu: {},
        doubleClickQueueAll: true,
        externalLinks: true,
        followSystemTheme: false,
        genreTarget: GenreTarget.TRACK,
        homeFeature: true,
        homeItems,
        language: 'en',
        lastFM: true,
        lastfmApiKey: '',
        musicBrainz: true,
        nativeAspectRatio: false,
        passwordStore: undefined,
        playButtonBehavior: Play.NOW,
        playerbarOpenDrawer: false,
        resume: true,
        showQueueDrawerButton: false,
        sidebarCollapsedNavigation: true,
        sidebarCollapseShared: false,
        sidebarItems,
        sidebarPlaylistList: true,
        sideQueueType: 'sideQueue',
        skipButtons: {
            enabled: false,
            skipBackwardSeconds: 5,
            skipForwardSeconds: 10,
        },
        theme: AppTheme.DEFAULT_DARK,
        themeDark: AppTheme.DEFAULT_DARK,
        themeLight: AppTheme.DEFAULT_LIGHT,
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
        globalMediaHotkeys: false,
    },
    lists: {
        fullScreen: {
            display: ListDisplayType.TABLE,
            grid: {
                itemGap: 'md',
                itemsPerRow: 6,
                itemsPerRowEnabled: false,
                rows: [],
            },
            itemsPerPage: 100,
            pagination: ListPaginationType.INFINITE,
            table: {
                autoFitColumns: false,
                columns: SONG_TABLE_COLUMNS.map((column) => ({
                    align: column.align,
                    autoSize: column.autoSize,
                    id: column.value,
                    isEnabled: column.isEnabled,
                    pinned: column.pinned,
                    width: column.width,
                })),
                enableAlternateRowColors: true,
                enableHorizontalBorders: true,
                enableRowHoverHighlight: true,
                enableVerticalBorders: false,
                size: 'default',
            },
        },
        [LibraryItem.ALBUM]: {
            display: ListDisplayType.TABLE,
            grid: {
                itemGap: 'md',
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
                        TableColumn.DURATION,
                        TableColumn.GENRE,
                        TableColumn.PLAY_COUNT,
                        TableColumn.SONG_COUNT,
                        TableColumn.YEAR,
                    ],
                }),
            },
            itemsPerPage: 100,
            pagination: ListPaginationType.INFINITE,
            table: {
                autoFitColumns: false,
                columns: ALBUM_TABLE_COLUMNS.map((column) => ({
                    align: column.align,
                    autoSize: column.autoSize,
                    id: column.value,
                    isEnabled: column.isEnabled,
                    pinned: column.pinned,
                    width: column.width,
                })),
                enableAlternateRowColors: true,
                enableHorizontalBorders: true,
                enableRowHoverHighlight: true,
                enableVerticalBorders: false,
                size: 'default',
            },
        },
        [LibraryItem.ALBUM_ARTIST]: {
            display: ListDisplayType.TABLE,
            grid: {
                itemGap: 'md',
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
            },
            itemsPerPage: 100,
            pagination: ListPaginationType.INFINITE,
            table: {
                autoFitColumns: false,
                columns: ALBUM_ARTIST_TABLE_COLUMNS.map((column) => ({
                    align: column.align,
                    autoSize: column.autoSize,
                    id: column.value,
                    isEnabled: column.isEnabled,
                    pinned: column.pinned,
                    width: column.width,
                })),
                enableAlternateRowColors: true,
                enableHorizontalBorders: true,
                enableRowHoverHighlight: true,
                enableVerticalBorders: false,
                size: 'default',
            },
        },
        [LibraryItem.ARTIST]: {
            display: ListDisplayType.TABLE,
            grid: {
                itemGap: 'md',
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
            },
            itemsPerPage: 100,
            pagination: ListPaginationType.INFINITE,
            table: {
                autoFitColumns: true,
                columns: ALBUM_ARTIST_TABLE_COLUMNS.map((column) => ({
                    align: column.align,
                    autoSize: column.autoSize,
                    id: column.value,
                    isEnabled: column.isEnabled,
                    pinned: column.pinned,
                    width: column.width,
                })),
                enableAlternateRowColors: true,
                enableHorizontalBorders: true,
                enableRowHoverHighlight: true,
                enableVerticalBorders: false,
                size: 'default',
            },
        },
        [LibraryItem.GENRE]: {
            display: ListDisplayType.TABLE,
            grid: {
                itemGap: 'md',
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
            },
            itemsPerPage: 100,
            pagination: ListPaginationType.INFINITE,
            table: {
                autoFitColumns: true,
                columns: GENRE_TABLE_COLUMNS.map((column) => ({
                    align: column.align,
                    autoSize: column.autoSize,
                    id: column.value,
                    isEnabled: column.isEnabled,
                    pinned: column.pinned,
                    width: column.width,
                })),
                enableAlternateRowColors: true,
                enableHorizontalBorders: true,
                enableRowHoverHighlight: true,
                enableVerticalBorders: false,
                size: 'compact',
            },
        },
        [LibraryItem.PLAYLIST]: {
            display: ListDisplayType.TABLE,
            grid: {
                itemGap: 'md',
                itemsPerRow: 6,
                itemsPerRowEnabled: false,
                rows: pickGridRows({
                    alignLeftColumns: [TableColumn.TITLE, TableColumn.SONG_COUNT],
                    columns: PLAYLIST_TABLE_COLUMNS,
                    enabledColumns: [TableColumn.TITLE],
                    pickColumns: [TableColumn.TITLE, TableColumn.SONG_COUNT],
                }),
            },
            itemsPerPage: 100,
            pagination: ListPaginationType.INFINITE,
            table: {
                autoFitColumns: true,
                columns: PLAYLIST_TABLE_COLUMNS.map((column) => ({
                    align: column.align,
                    autoSize: column.autoSize,
                    id: column.value,
                    isEnabled: column.isEnabled,
                    pinned: column.pinned,
                    width: column.width,
                })),
                enableAlternateRowColors: true,
                enableHorizontalBorders: true,
                enableRowHoverHighlight: true,
                enableVerticalBorders: false,
                size: 'default',
            },
        },
        [LibraryItem.PLAYLIST_SONG]: {
            display: ListDisplayType.TABLE,
            grid: {
                itemGap: 'md',
                itemsPerRow: 6,
                itemsPerRowEnabled: false,
                rows: [],
            },
            itemsPerPage: 100,
            pagination: ListPaginationType.INFINITE,
            table: {
                autoFitColumns: false,
                columns: PLAYLIST_SONG_TABLE_COLUMNS.map((column) => ({
                    align: column.align,
                    autoSize: column.autoSize,
                    id: column.value,
                    isEnabled: column.isEnabled,
                    pinned: column.pinned,
                    width: column.width,
                })),
                enableAlternateRowColors: true,
                enableHorizontalBorders: true,
                enableRowHoverHighlight: true,
                enableVerticalBorders: false,
                size: 'default',
            },
        },
        [LibraryItem.QUEUE_SONG]: {
            display: ListDisplayType.TABLE,
            grid: {
                itemGap: 'md',
                itemsPerRow: 6,
                itemsPerRowEnabled: false,
                rows: [],
            },
            itemsPerPage: 100,
            pagination: ListPaginationType.INFINITE,
            table: {
                autoFitColumns: false,
                columns: SONG_TABLE_COLUMNS.map((column) => ({
                    align: column.align,
                    autoSize: column.autoSize,
                    id: column.value,
                    isEnabled: column.isEnabled,
                    pinned: column.pinned,
                    width: column.width,
                })),
                enableAlternateRowColors: true,
                enableHorizontalBorders: true,
                enableRowHoverHighlight: true,
                enableVerticalBorders: false,
                size: 'default',
            },
        },
        [LibraryItem.SONG]: {
            display: ListDisplayType.TABLE,
            grid: {
                itemGap: 'md',
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
            },
            itemsPerPage: 100,
            pagination: ListPaginationType.INFINITE,
            table: {
                autoFitColumns: false,
                columns: SONG_TABLE_COLUMNS.map((column) => ({
                    align: column.align,
                    autoSize: column.autoSize,
                    id: column.value,
                    isEnabled: column.isEnabled,
                    pinned: column.pinned,
                    width: column.width,
                })),
                enableAlternateRowColors: true,
                enableHorizontalBorders: true,
                enableRowHoverHighlight: true,
                enableVerticalBorders: false,
                size: 'default',
            },
        },
        ['sideQueue']: {
            display: ListDisplayType.TABLE,
            grid: {
                itemGap: 'md',
                itemsPerRow: 6,
                itemsPerRowEnabled: false,
                rows: [],
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
        fetch: false,
        follow: true,
        fontSize: 24,
        fontSizeUnsync: 24,
        gap: 24,
        gapUnsync: 24,
        preferLocalLyrics: true,
        showMatch: true,
        showProvider: true,
        sources: [LyricSource.NETEASE, LyricSource.LRCLIB],
        translationApiKey: '',
        translationApiProvider: '',
        translationTargetLanguage: 'en',
    },
    playback: {
        audioDeviceId: undefined,
        crossfadeDuration: 5,
        crossfadeStyle: CrossfadeStyle.EQUALPOWER,
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
        muted: false,
        preservePitch: true,
        scrobble: {
            enabled: true,
            notify: false,
            scrobbleAtDuration: 240,
            scrobbleAtPercentage: 75,
        },
        style: PlayerStyle.GAPLESS,
        transcode: {
            enabled: false,
        },
        type: PlayerType.WEB,
        webAudio: true,
    },
    remote: {
        enabled: false,
        password: randomString(8),
        port: 4333,
        username: 'feishin',
    },
    tab: 'general',
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
            immer((set, get) => ({
                actions: {
                    reset: () => {
                        if (!isElectron()) {
                            set({
                                ...initialState,
                                playback: {
                                    ...initialState.playback,
                                    type: PlayerType.WEB,
                                },
                            });
                        } else {
                            set(initialState);
                        }
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
                    setSettings: (data) => {
                        set({ ...get(), ...data });
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
                    toggleContextMenuItem: (item: ContextMenuItemType) => {
                        set((state) => {
                            state.general.disabledContextMenu[item] =
                                !state.general.disabledContextMenu[item];
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

                return persistedState;
            },
            name: 'store_settings',
            version: 10,
        },
    ),
);

export const useSettingsStoreActions = () => useSettingsStore((state) => state.actions);

export const usePlaybackSettings = () => useSettingsStore((state) => state.playback, shallow);

export const useTableSettings = (type: ItemListKey) =>
    useSettingsStore((state) => state.lists[type as keyof typeof state.lists]);

export const useGeneralSettings = () => useSettingsStore((state) => state.general, shallow);

export const usePlaybackType = () =>
    useSettingsStore((state) => {
        return state.playback.type;
    });

export const usePlayButtonBehavior = () =>
    useSettingsStore((state) => state.general.playButtonBehavior, shallow);

export const useWindowSettings = () => useSettingsStore((state) => state.window, shallow);

export const useHotkeySettings = () => useSettingsStore((state) => state.hotkeys, shallow);

export const useMpvSettings = () =>
    useSettingsStore((state) => state.playback.mpvProperties, shallow);

export const useLyricsSettings = () => useSettingsStore((state) => state.lyrics, shallow);

export const useRemoteSettings = () => useSettingsStore((state) => state.remote, shallow);

export const useFontSettings = () => useSettingsStore((state) => state.font, shallow);

export const useDiscordSettings = () => useSettingsStore((state) => state.discord, shallow);

export const useCssSettings = () => useSettingsStore((state) => state.css, shallow);

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
