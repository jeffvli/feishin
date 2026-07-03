import { useCallback } from 'react';

import { ItemDetailListCellProps } from './types';

import { playSongFromItemListControl } from '/@/renderer/components/item-list/helpers/play-row-from-list';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { useIsCurrentSong } from '/@/renderer/features/player/hooks/use-is-current-song';
import { usePlayerStatus } from '/@/renderer/store';
import { Song } from '/@/shared/types/domain-types';
import { Play, PlayerStatus } from '/@/shared/types/types';

export const useDetailRowPlayControl = ({
    internalState,
    rowIndex = 0,
    song,
}: Pick<ItemDetailListCellProps, 'internalState' | 'rowIndex' | 'song'>) => {
    const status = usePlayerStatus();
    const player = usePlayer();
    const { isActive } = useIsCurrentSong(song);
    const isPlaying = isActive && status === PlayerStatus.PLAYING;

    const showPlayControls = !!song?.id;

    const handlePlay = useCallback(
        (playType: Play) => {
            if (!song) {
                return;
            }

            playSongFromItemListControl({
                index: rowIndex,
                internalState,
                item: song as Song,
                meta: { playType, singleSongOnly: true },
                player,
            });
        },
        [internalState, player, rowIndex, song],
    );

    return {
        handlePlay,
        isActive,
        isPlaying,
        showPlayControls,
    };
};
