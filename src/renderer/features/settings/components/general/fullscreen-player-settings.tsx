import { memo } from 'react';

import { DraggableItems } from '/@/renderer/features/settings/components/general/draggable-items';
import {
    PlayerItem,
    SortableItem,
    useGeneralSettings,
    useSettingsStoreActions,
} from '/@/renderer/store';

const PLAYER_ITEMS: Array<[PlayerItem, string]> = [
    [PlayerItem.CODEC, 'common.codec'],
    [PlayerItem.RELEASE_TYPE, 'common.releaseType'],
    [PlayerItem.YEAR, 'common.year'],
];

export const FullscreenPlayerSettings = memo(() => {
    const { playerItems } = useGeneralSettings();
    const { setPlayerItems } = useSettingsStoreActions();

    return (
        <DraggableItems
            description="setting.playerItemConfiguration"
            itemLabels={PLAYER_ITEMS}
            items={playerItems as SortableItem<PlayerItem>[]}
            setItems={setPlayerItems}
            title="setting.playerItemConfiguration"
        />
    );
});
