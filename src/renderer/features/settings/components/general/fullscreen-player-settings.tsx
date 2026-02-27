import { memo } from 'react';

import { DraggableItems } from '/@/renderer/features/settings/components/general/draggable-items';
import {
    PlayerItem,
    SortableItem,
    useGeneralSettings,
    useSettingsStoreActions,
} from '/@/renderer/store';

const PLAYER_ITEMS: Array<[PlayerItem, string]> = [
    [PlayerItem.BIT_DEPTH, 'common.bitDepth'],
    [PlayerItem.BIT_RATE, 'common.bitrate'],
    [PlayerItem.BPM, 'common.bpm'],
    [PlayerItem.CODEC, 'common.codec'],
    [PlayerItem.DISC_NUMBER, 'table.config.label.discNumber'],
    [PlayerItem.GENRES, 'entity.genre_other'],
    [PlayerItem.RELEASE_DATE, 'filter.releaseDate'],
    [PlayerItem.RELEASE_TYPE, 'common.releaseType'],
    [PlayerItem.RELEASE_YEAR, 'filter.releaseYear'],
    [PlayerItem.SAMPLE_RATE, 'common.sampleRate'],
    [PlayerItem.TRACK_NUMBER, 'table.config.label.trackNumber'],
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
