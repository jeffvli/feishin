import { useMemo } from 'react';

import { DraggableItems } from '/@/renderer/features/settings/components/general/draggable-items';
import {
    sidebarItems as defaultSidebarItems,
    useGeneralSettings,
    useSettingsStoreActions,
} from '/@/renderer/store';

const SIDEBAR_ITEMS: Array<[string, string]> = [
    ['Albums', 'page.sidebar.albums'],
    ['Artists', 'page.sidebar.albumArtists'],
    ['Artists-all', 'page.sidebar.artists'],
    ['Favorites', 'page.sidebar.favorites'],
    ['Folders', 'page.sidebar.folders'],
    ['Genres', 'page.sidebar.genres'],
    ['Home', 'page.sidebar.home'],
    ['Now Playing', 'page.sidebar.nowPlaying'],
    ['Playlists', 'page.sidebar.playlists'],
    ['Radio', 'page.sidebar.radio'],
    ['Search', 'page.sidebar.search'],
    ['Settings', 'page.sidebar.settings'],
    ['Tracks', 'page.sidebar.tracks'],
];

export const SidebarReorder = () => {
    const { sidebarItems } = useGeneralSettings();
    const { setSidebarItems } = useSettingsStoreActions();

    const mergedSidebarItems = useMemo(() => {
        const settingsMap = new Map(sidebarItems.map((item) => [item.id, item]));
        const defaultMap = new Map(defaultSidebarItems.map((item) => [item.id, item]));

        const merged = sidebarItems.map((item) => ({
            ...item,
            id: item.id,
        }));

        SIDEBAR_ITEMS.forEach(([itemId]) => {
            if (!settingsMap.has(itemId)) {
                const defaultItem = defaultMap.get(itemId);
                merged.push({
                    disabled: true,
                    id: itemId,
                    label: defaultItem?.label ?? itemId,
                    route: defaultItem?.route ?? '',
                });
            }
        });

        return merged;
    }, [sidebarItems]);

    return (
        <DraggableItems
            description="setting.sidebarCollapsedNavigation"
            itemLabels={SIDEBAR_ITEMS}
            setItems={setSidebarItems}
            settings={mergedSidebarItems}
            title="setting.sidebarConfiguration"
        />
    );
};
