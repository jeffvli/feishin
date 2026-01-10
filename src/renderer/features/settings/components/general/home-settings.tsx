import { memo } from 'react';

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

export const HomeSettings = memo(() => {
    const { homeItems } = useGeneralSettings();
    const { setHomeItems } = useSettingsStoreActions();

    return (
        <DraggableItems
            description="setting.homeConfiguration"
            itemLabels={HOME_ITEMS}
            items={homeItems as SortableItem<HomeItem>[]}
            setItems={setHomeItems}
            title="setting.homeConfiguration"
        />
    );
});
