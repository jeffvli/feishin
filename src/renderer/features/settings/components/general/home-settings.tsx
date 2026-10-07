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
    [HomeItem.PLAYLISTS, 'page.home.playlists'],
    [HomeItem.RECENTLY_PLAYED, 'page.home.recentlyPlayed'],
    [HomeItem.RECENTLY_ADDED, 'page.home.newlyAdded'],
    [HomeItem.RECENTLY_RELEASED, 'page.home.recentlyReleased'],
    [HomeItem.MOST_PLAYED, 'page.home.mostPlayed'],
    [HomeItem.SOUR_RADIO, 'Sour Radio (live)'],
    [HomeItem.FRIENDS_PLAYING, 'Friends are playing'],
    [HomeItem.YOUR_REQUESTS, 'Your requests'],
    [HomeItem.SONG_OF_THE_DAY, 'Song of the day'],
    [HomeItem.JUMP_BACK_IN, 'Jump back in'],
    [HomeItem.BLEND, 'Blend'],
    [HomeItem.LEADERBOARD, "This week's leaderboard"],
    [HomeItem.GROUP_TOP, "The group's top songs"],
    [HomeItem.SHARED_FAVORITES, 'Shared favourites'],
    [HomeItem.SMART_PLAYLISTS, 'Smart playlists'],
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
