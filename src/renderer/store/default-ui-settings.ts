export const KATIESAMP_DEFAULT_UI_SETTINGS = {
    fullScreenPlayer: {
        activeTab: 'queue',
        dynamicBackground: false,
    },
    general: {
        combinedLyricsAndVisualizer: true,
        externalLinks: false,
        homeFeatureStyle: 'multiple',
        showRatings: false,
        showVisualizerInSidebar: false,
    },
    lists: {
        album: {
            detailEnabledColumns: ['trackNumber', 'name', 'duration', 'userFavorite', 'actions'],
            display: 'table',
            enabledColumns: ['rowIndex', 'titleCombined', 'duration'],
        },
        albumArtist: {
            display: 'poster',
            enabledColumns: ['rowIndex', 'imageUrl', 'name', 'userFavorite'],
        },
        albumDetail: {
            display: 'table',
            enabledColumns: ['name', 'artists', 'duration'],
        },
        artist: {
            display: 'table',
            enabledColumns: ['imageUrl', 'name'],
        },
        fullScreen: {
            display: 'table',
            enabledColumns: ['titleCombined', 'duration', 'album', 'userFavorite'],
        },
        genre: {
            display: 'table',
            enabledColumns: ['rowIndex', 'name', 'songCount', 'albumCount'],
        },
        playlist: {
            display: 'table',
            enabledColumns: ['rowIndex', 'name', 'duration', 'songCount'],
        },
        playlistAlbum: {
            detailEnabledColumns: ['trackNumber', 'name', 'duration', 'userFavorite', 'actions'],
            display: 'poster',
            enabledColumns: [
                'rowIndex',
                'titleCombined',
                'duration',
                'genres',
                'releaseYear',
                'userFavorite',
            ],
        },
        playlistSong: {
            display: 'table',
            enabledColumns: ['rowIndex', 'titleCombined', 'duration', 'year', 'userFavorite'],
        },
        queueSong: {
            display: 'table',
            enabledColumns: [
                'rowIndex',
                'titleCombined',
                'duration',
                'album',
                'genres',
                'year',
                'userFavorite',
            ],
        },
        sideQueue: {
            display: 'table',
            enabledColumns: ['rowIndex', 'titleCombined', 'duration'],
        },
        song: {
            display: 'table',
            enabledColumns: ['rowIndex', 'titleCombined', 'duration', 'album'],
        },
    },
    sidebarEnabledItems: ['Home', 'Tracks', 'Artists-all', 'Settings'],
} as const;

export const KATIESAMP_SIDEBAR_MIGRATION_VERSION = 38;

const V1_2_0_SIDEBAR_ENABLED_ITEMS = [
    'Home',
    'Albums',
    'Tracks',
    'Artists-all',
    'Settings',
] as const;

type SidebarSettingsState = {
    general?: {
        sidebarItems?: Array<{
            disabled: boolean;
            id: string;
        }>;
    };
};

export const migrateKatiesAmpSidebarSettings = (
    state: SidebarSettingsState,
    version: number,
): void => {
    if (version >= KATIESAMP_SIDEBAR_MIGRATION_VERSION) return;

    const items = state.general?.sidebarItems;
    if (!items) return;

    const enabledIds = new Set(items.filter((item) => !item.disabled).map((item) => item.id));
    const hasV1_2_0Defaults =
        enabledIds.size === V1_2_0_SIDEBAR_ENABLED_ITEMS.length &&
        V1_2_0_SIDEBAR_ENABLED_ITEMS.every((id) => enabledIds.has(id));
    if (!hasV1_2_0Defaults) return;

    const albumsItem = items.find((item) => item.id === 'Albums');
    if (albumsItem) albumsItem.disabled = true;
};
