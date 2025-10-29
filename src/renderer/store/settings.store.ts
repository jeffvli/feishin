import type { ContextMenuItemType } from '/@/renderer/features/context-menu';

import isElectron from 'is-electron';
import { generatePath } from 'react-router';
import { z } from 'zod';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';

import i18n from '/@/i18n/i18n';
import { AppRoute } from '/@/renderer/router/routes';
import { usePlayerStore } from '/@/renderer/store/player.store';
import { mergeOverridingColumns } from '/@/renderer/store/utils';
import { FontValueSchema } from '/@/renderer/types/fonts';
import { randomString } from '/@/renderer/utils';
import { sanitizeCss } from '/@/renderer/utils/sanitize';
import { AppTheme } from '/@/shared/themes/app-theme-types';
import { LibraryItem, LyricSource } from '/@/shared/types/domain-types';
import {
    CrossfadeStyle,
    FontType,
    Platform,
    Play,
    PlaybackStyle,
    PlaybackType,
    TableColumn,
    TableType,
} from '/@/shared/types/types';

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

const PersistedTableColumnSchema = z.object({
    column: z.nativeEnum(TableColumn),
    extraProps: z.record(z.any()).optional(),
    width: z.number(),
});

const DataTablePropsSchema = z.object({
    autoFit: z.boolean(),
    columns: z.array(PersistedTableColumnSchema),
    followCurrentSong: z.boolean().optional(),
    rowHeight: z.number(),
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
    style: z.nativeEnum(PlaybackStyle),
    transcode: TranscodingConfigSchema,
    type: z.nativeEnum(PlaybackType),
    webAudio: z.boolean(),
});

const RemoteSettingsSchema = z.object({
    enabled: z.boolean(),
    password: z.string(),
    port: z.number(),
    username: z.string(),
});

const TablesSettingsSchema = z.object({
    albumDetail: DataTablePropsSchema,
    fullScreen: DataTablePropsSchema,
    nowPlaying: DataTablePropsSchema,
    sideDrawerQueue: DataTablePropsSchema,
    sideQueue: DataTablePropsSchema,
    songs: DataTablePropsSchema,
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
export const NonValidatedSettingsStateSchema = z.object({
    tables: TablesSettingsSchema,
});

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

export type DataTableProps = z.infer<typeof DataTablePropsSchema>;

export type PersistedTableColumn = z.infer<typeof PersistedTableColumnSchema>;

export interface SettingsSlice extends z.infer<typeof SettingsStateSchema> {
    actions: {
        reset: () => void;
        resetSampleRate: () => void;
        setArtistItems: (item: SortableItem<ArtistItem>[]) => void;
        setGenreBehavior: (target: GenreTarget) => void;
        setHomeItems: (item: SortableItem<HomeItem>[]) => void;
        setSettings: (data: Partial<SettingsState>) => void;
        setSidebarItems: (items: SidebarItemType[]) => void;
        setTable: (type: TableType, data: DataTableProps) => void;
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
        style: PlaybackStyle.GAPLESS,
        transcode: {
            enabled: false,
        },
        type: PlaybackType.WEB,
        webAudio: true,
    },
    remote: {
        enabled: false,
        password: randomString(8),
        port: 4333,
        username: 'feishin',
    },
    tab: 'general',
    tables: {
        albumDetail: {
            autoFit: true,
            columns: [
                {
                    column: TableColumn.TRACK_NUMBER,
                    width: 50,
                },
                {
                    column: TableColumn.TITLE_COMBINED,
                    width: 500,
                },
                {
                    column: TableColumn.DURATION,
                    width: 100,
                },
                {
                    column: TableColumn.PLAY_COUNT,
                    width: 100,
                },
                {
                    column: TableColumn.LAST_PLAYED,
                    width: 100,
                },
                {
                    column: TableColumn.USER_FAVORITE,
                    width: 100,
                },
            ],
            rowHeight: 60,
        },
        fullScreen: {
            autoFit: true,
            columns: [
                {
                    column: TableColumn.ROW_INDEX,
                    width: 80,
                },
                {
                    column: TableColumn.TITLE_COMBINED,
                    width: 500,
                },
                {
                    column: TableColumn.DURATION,
                    width: 100,
                },
                {
                    column: TableColumn.USER_FAVORITE,
                    width: 100,
                },
            ],
            followCurrentSong: true,
            rowHeight: 60,
        },
        nowPlaying: {
            autoFit: true,
            columns: [
                {
                    column: TableColumn.ROW_INDEX,
                    width: 80,
                },
                {
                    column: TableColumn.TITLE,
                    width: 500,
                },
                {
                    column: TableColumn.DURATION,
                    width: 100,
                },
                {
                    column: TableColumn.ALBUM,
                    width: 100,
                },
                {
                    column: TableColumn.ALBUM_ARTIST,
                    width: 100,
                },
                {
                    column: TableColumn.GENRE,
                    width: 100,
                },
                {
                    column: TableColumn.YEAR,
                    width: 100,
                },
            ],
            followCurrentSong: true,
            rowHeight: 30,
        },
        sideDrawerQueue: {
            autoFit: true,
            columns: [
                {
                    column: TableColumn.TITLE_COMBINED,
                    width: 500,
                },
                {
                    column: TableColumn.DURATION,
                    width: 100,
                },
            ],
            followCurrentSong: true,
            rowHeight: 60,
        },
        sideQueue: {
            autoFit: true,
            columns: [
                {
                    column: TableColumn.ROW_INDEX,
                    width: 50,
                },
                {
                    column: TableColumn.TITLE_COMBINED,
                    width: 500,
                },
                {
                    column: TableColumn.DURATION,
                    width: 100,
                },
            ],
            followCurrentSong: true,
            rowHeight: 60,
        },
        songs: {
            autoFit: true,
            columns: [
                {
                    column: TableColumn.ROW_INDEX,
                    width: 50,
                },
                {
                    column: TableColumn.TITLE_COMBINED,
                    width: 500,
                },
                {
                    column: TableColumn.DURATION,
                    width: 100,
                },
                {
                    column: TableColumn.ALBUM,
                    width: 300,
                },
                {
                    column: TableColumn.ARTIST,
                    width: 100,
                },
                {
                    column: TableColumn.YEAR,
                    width: 100,
                },
            ],
            rowHeight: 60,
        },
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
            immer((set, get) => ({
                actions: {
                    reset: () => {
                        if (!isElectron()) {
                            set({
                                ...initialState,
                                playback: {
                                    ...initialState.playback,
                                    type: PlaybackType.WEB,
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
                    setSettings: (data) => {
                        set({ ...get(), ...data });
                    },
                    setSidebarItems: (items: SidebarItemType[]) => {
                        set((state) => {
                            state.general.sidebarItems = items;
                        });
                    },
                    setTable: (type: TableType, data: DataTableProps) => {
                        set((state) => {
                            state.tables[type] = data;
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
                console.log('migrate: ', version);

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

export const useTableSettings = (type: TableType) =>
    useSettingsStore((state) => state.tables[type]);

export const useGeneralSettings = () => useSettingsStore((state) => state.general, shallow);

export const usePlaybackType = () =>
    useSettingsStore((state) => {
        const isFallback = usePlayerStore.getState().fallback;

        if (isFallback) {
            return PlaybackType.WEB;
        }

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
