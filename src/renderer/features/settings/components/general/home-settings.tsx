import {
    useSettingsStoreActions,
    useGeneralSettings,
    HomeItem,
} from '../../../../store/settings.store';
import { DraggableItems } from '/@/renderer/features/settings/components/general/draggable-items';

const HOME_ITEMS: Array<[string, string]> = [
    [HomeItem.RANDOM, 'page.home.explore'],
    [HomeItem.RECENTLY_PLAYED, 'page.home.recentlyPlayed'],
    [HomeItem.RECENTLY_ADDED, 'page.home.newlyAdded'],
    [HomeItem.MOST_PLAYED, 'page.home.mostPlayed'],
    [HomeItem.RANDOM_MIXES, 'page.home.exploreMixes'],
    [HomeItem.RECENTLY_PLAYED_MIXES, 'page.home.recentlyPlayedMixes'],
    [HomeItem.RECENTLY_ADDED_MIXES, 'page.home.newlyAddedMixes'],
    [HomeItem.MOST_PLAYED_MIXES, 'page.home.mostPlayedMixes'],
];

export const HomeSettings = () => {
    const { homeItems } = useGeneralSettings();
    const { setHomeItems } = useSettingsStoreActions();

    return (
        <DraggableItems
            description="setting.homeConfiguration"
            itemLabels={HOME_ITEMS}
            setItems={setHomeItems}
            settings={homeItems}
            title="setting.homeConfiguration"
        />
    );
};
