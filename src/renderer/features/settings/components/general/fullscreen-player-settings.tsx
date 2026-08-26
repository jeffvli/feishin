import { memo } from 'react';

interface FullscreenPlayerSettingsProps {
    showDescription?: boolean;
}

import { DraggableItems } from '/@/renderer/features/settings/components/general/draggable-items';
import {
    PlayerItem,
    SortableItem,
    useGeneralSettings,
    useSettingsStoreActions,
} from '/@/renderer/store';

const PLAYER_ITEMS: Array<[PlayerItem, string]> = [
    [PlayerItem.TITLE, 'common.title'],
    [PlayerItem.ARTIST, 'entity.artist_one'],
    [PlayerItem.ALBUM, 'entity.album_one'],
    [PlayerItem.BIT_DEPTH, 'common.bitDepth'],
    [PlayerItem.BIT_RATE, 'common.bitrate'],
    [PlayerItem.BPM, 'common.bpm'],
    [PlayerItem.CODEC, 'common.codec'],
    [PlayerItem.DATE, 'filter.date'],
    [PlayerItem.DISC_NUMBER, 'table.config.label.discNumber'],
    [PlayerItem.GENRES, 'entity.genre_other'],
    [PlayerItem.RELEASE_DATE, 'filter.releaseDate'],
    [PlayerItem.RELEASE_TYPE, 'common.releaseType'],
    [PlayerItem.RELEASE_YEAR, 'filter.releaseYear'],
    [PlayerItem.SAMPLE_RATE, 'common.sampleRate'],
    [PlayerItem.TRACK_NUMBER, 'table.config.label.trackNumber'],
    [PlayerItem.YEAR, 'filter.year'],
];

export const FullscreenPlayerSettings = memo(
    ({ showDescription = true }: FullscreenPlayerSettingsProps) => {
        const { playerItems } = useGeneralSettings();
        const { setPlayerItems } = useSettingsStoreActions();

        return (
            <DraggableItems
                description="setting.playerItemConfiguration"
                itemLabels={PLAYER_ITEMS}
                items={playerItems as SortableItem<PlayerItem>[]}
                nonReorderableItemIds={[PlayerItem.TITLE, PlayerItem.ARTIST, PlayerItem.ALBUM]}
                setItems={setPlayerItems}
                showDescription={showDescription}
                title="setting.playerItemConfiguration"
            />
        );
    },
);
