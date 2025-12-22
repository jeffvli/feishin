import { useMemo } from 'react';

import { DraggableItems } from '/@/renderer/features/settings/components/general/draggable-items';
import {
    HomeItem,
    SortableItem,
    useGeneralSettings,
    useSettingsStoreActions,
} from '/@/renderer/store';

const HOME_ITEMS: Array<[string, string]> = [
    [HomeItem.GENRES, 'page.home.genres'],
    [HomeItem.RANDOM, 'page.home.explore'],
    [HomeItem.RECENTLY_PLAYED, 'page.home.recentlyPlayed'],
    [HomeItem.RECENTLY_ADDED, 'page.home.newlyAdded'],
    [HomeItem.RECENTLY_RELEASED, 'page.home.recentlyReleased'],
    [HomeItem.MOST_PLAYED, 'page.home.mostPlayed'],
];

export const HomeSettings = () => {
    const { homeItems } = useGeneralSettings();
    const { setHomeItems } = useSettingsStoreActions();

    const mergedHomeItems = useMemo(() => {
        const settingsMap = new Map(
            homeItems.map((item) => [item.id, item as SortableItem<HomeItem>]),
        );

        const merged = homeItems.map((item) => ({
            ...item,
            id: item.id as HomeItem,
        }));

        HOME_ITEMS.forEach(([itemId]) => {
            const homeItemId = itemId as HomeItem;
            if (!settingsMap.has(homeItemId)) {
                merged.push({
                    disabled: true,
                    id: homeItemId,
                });
            }
        });

        return merged;
    }, [homeItems]);

    return (
        <DraggableItems
            description="setting.homeConfiguration"
            itemLabels={HOME_ITEMS}
            setItems={setHomeItems}
            settings={mergedHomeItems}
            title="setting.homeConfiguration"
        />
    );
};
