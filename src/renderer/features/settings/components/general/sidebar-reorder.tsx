import { DraggableItems } from '/@/renderer/features/settings/components/general/draggable-items';
import { useGeneralSettings, useSettingsStoreActions } from '/@/renderer/store';

const SIDEBAR_ITEMS: Array<[string, string]> = [
    ['Albums', 'page.sidebar.albums'],
    ['Artists', 'page.sidebar.artists'],
    ['Folders', 'page.sidebar.folders'],
    ['Genres', 'page.sidebar.genres'],
    ['Home', 'page.sidebar.home'],
    ['Now Playing', 'page.sidebar.nowPlaying'],
    ['Playlists', 'page.sidebar.playlists'],
    ['Search', 'page.sidebar.search'],
    ['Settings', 'page.sidebar.settings'],
    ['Tracks', 'page.sidebar.tracks'],
];

export const SidebarReorder = () => {
    const { sidebarItems } = useGeneralSettings();
    const { setSidebarItems } = useSettingsStoreActions();

    return (
        <DraggableItems
            description="setting.sidebarCollapsedNavigation"
            itemLabels={SIDEBAR_ITEMS}
            setItems={setSidebarItems}
            settings={sidebarItems}
            title="setting.sidebarConfiguration"
        />
    );
};
