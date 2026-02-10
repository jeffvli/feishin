import styles from './row-index-column.module.css';
import { ItemDetailListCellProps } from './types';

import { useIsCurrentSong } from '/@/renderer/features/player/hooks/use-is-current-song';
import { usePlayerStatus } from '/@/renderer/store';
import { Icon } from '/@/shared/components/icon/icon';
import { PlayerStatus } from '/@/shared/types/types';

export const RowIndexColumn = ({ rowIndex, song }: ItemDetailListCellProps) => {
    const status = usePlayerStatus();
    const { isActive } = useIsCurrentSong(song);
    const isPlaying = isActive && status === PlayerStatus.PLAYING;

    if (isActive) {
        return (
            <div className={styles.iconWrapper}>
                <Icon fill="primary" icon={isPlaying ? 'mediaPlay' : 'mediaPause'} />
            </div>
        );
    }

    return <>{String((rowIndex ?? 0) + 1)}</>;
};
