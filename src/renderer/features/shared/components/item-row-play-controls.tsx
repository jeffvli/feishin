import clsx from 'clsx';

import styles from './item-row-play-controls.module.css';

import {
    LONG_PRESS_PLAY_BEHAVIOR,
    PlayTooltip,
} from '/@/renderer/features/shared/components/play-button-group';
import { usePlayButtonClick } from '/@/renderer/features/shared/hooks/use-play-button-click';
import { ActionIcon, ActionIconGroup } from '/@/shared/components/action-icon/action-icon';
import { Play } from '/@/shared/types/types';

interface ItemRowPlayControlsProps {
    className?: string;
    disabled?: boolean;
    onPlay: (playType: Play) => void;
}

export const ItemRowPlayControls = ({ className, disabled, onPlay }: ItemRowPlayControlsProps) => {
    const handlePlayNext = usePlayButtonClick({
        onClick: () => {
            onPlay(Play.NEXT);
        },
        onLongPress: () => {
            onPlay(LONG_PRESS_PLAY_BEHAVIOR[Play.NEXT]);
        },
    });

    const handlePlayNow = usePlayButtonClick({
        onClick: () => {
            onPlay(Play.NOW);
        },
        onLongPress: () => {
            onPlay(LONG_PRESS_PLAY_BEHAVIOR[Play.NOW]);
        },
    });

    const handlePlayLast = usePlayButtonClick({
        onClick: () => {
            onPlay(Play.LAST);
        },
        onLongPress: () => {
            onPlay(LONG_PRESS_PLAY_BEHAVIOR[Play.LAST]);
        },
    });

    return (
        <ActionIconGroup className={clsx(styles.controls, className)}>
            <PlayTooltip disabled={disabled} type={Play.NOW}>
                <ActionIcon
                    icon="mediaPlay"
                    iconProps={{
                        size: 'md',
                    }}
                    size="xs"
                    variant="subtle"
                    {...handlePlayNow.handlers}
                    {...handlePlayNow.props}
                    disabled={disabled}
                />
            </PlayTooltip>
            <PlayTooltip disabled={disabled} type={Play.NEXT}>
                <ActionIcon
                    icon="mediaPlayNext"
                    iconProps={{
                        size: 'md',
                    }}
                    size="xs"
                    variant="subtle"
                    {...handlePlayNext.handlers}
                    {...handlePlayNext.props}
                    disabled={disabled}
                />
            </PlayTooltip>
            <PlayTooltip disabled={disabled} type={Play.LAST}>
                <ActionIcon
                    icon="mediaPlayLast"
                    iconProps={{
                        size: 'md',
                    }}
                    size="xs"
                    variant="subtle"
                    {...handlePlayLast.handlers}
                    {...handlePlayLast.props}
                    disabled={disabled}
                />
            </PlayTooltip>
        </ActionIconGroup>
    );
};
