import clsx from 'clsx';

import styles from './combined-title-cell-controls.module.css';

import { usePlayQueueAdd } from '/@/renderer/features/player';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { LibraryItem } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

export const ListCoverControls = ({
    className,
    context,
    itemData,
    itemType,
    uniqueId,
}: {
    className?: string;
    context: Record<string, any>;
    itemData: any;
    itemType: LibraryItem;
    uniqueId?: string;
}) => {
    const playButtonBehavior = usePlayButtonBehavior();
    const handlePlayQueueAdd = usePlayQueueAdd();
    const isQueue = Boolean(context?.isQueue);

    const handlePlay = async (e: React.MouseEvent<HTMLButtonElement>, playType?: Play) => {
        e.preventDefault();
        e.stopPropagation();

        handlePlayQueueAdd?.({
            byItemType: {
                id: [itemData.id],
                type: itemType,
            },
            playType: playType || playButtonBehavior,
        });
    };

    const handlePlayFromQueue = () => {
        context.handleDoubleClick({
            data: {
                uniqueId,
            },
        });
    };

    return (
        <div className={clsx(styles.listControlsContainer, className)}>
            <ActionIcon
                classNames={{ root: styles.playButton }}
                icon="mediaPlay"
                onClick={isQueue ? handlePlayFromQueue : handlePlay}
            />
        </div>
    );
};
