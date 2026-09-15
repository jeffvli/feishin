import { ReactNode } from 'react';

import { RowPlayControlPopover } from '../../row-play-control-popover';
import styles from './row-play-control-cell.module.css';

import { ItemRowPlayControls } from '/@/renderer/features/shared/components/item-row-play-controls';
import { Play } from '/@/shared/types/types';

export const ItemDetailRowPlayControlCell = ({
    indexContent,
    onPlay,
    showPlayControls,
}: {
    indexContent: ReactNode;
    onPlay: (playType: Play) => void;
    showPlayControls: boolean;
}) => {
    if (!showPlayControls) {
        return <>{indexContent}</>;
    }

    return (
        <div className={styles.cellWrapper}>
            <RowPlayControlPopover
                content={<ItemRowPlayControls onPlay={onPlay} />}
                offset={{ crossAxis: 32, mainAxis: 16 }}
                openDelay={300}
            >
                {indexContent}
            </RowPlayControlPopover>
        </div>
    );
};
