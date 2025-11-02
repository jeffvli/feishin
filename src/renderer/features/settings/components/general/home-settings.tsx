import { DraggableItems } from '/@/renderer/features/settings/components/general/draggable-items';
import { HomeItem, useGeneralSettings, useSettingsStoreActions } from '/@/renderer/store';

const HOME_ITEMS: Array<[string, string]> = [
    [HomeItem.RANDOM, 'page.home.explore'],
    [HomeItem.RECENTLY_PLAYED, 'page.home.recentlyPlayed'],
    [HomeItem.RECENTLY_ADDED, 'page.home.newlyAdded'],
    [HomeItem.RECENTLY_RELEASED, 'page.home.recentlyReleased'],
    [HomeItem.MOST_PLAYED, 'page.home.mostPlayed'],
];

export const HomeSettings = () => {
    const { homeItems } = useGeneralSettings();
    const { setHomeItems } = useSettingsStoreActions();

    const mappedHomeItems = homeItems.map((item) => ({
        ...item,
        id: item.id as HomeItem,
    }));

    return (
        <DraggableItems
            description="setting.homeConfiguration"
            itemLabels={HOME_ITEMS}
            setItems={setHomeItems}
            settings={mappedHomeItems}
            title="setting.homeConfiguration"
        />
    );
};
