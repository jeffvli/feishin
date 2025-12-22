import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import styles from './play-button-group.module.css';

import i18n from '/@/i18n/i18n';
import { PlayButton } from '/@/renderer/features/shared/components/play-button';
import { AppIconSelection } from '/@/shared/components/icon/icon';
import { Portal } from '/@/shared/components/portal/portal';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { Tooltip } from '/@/shared/components/tooltip/tooltip';
import { useClickOutside } from '/@/shared/hooks/use-click-outside';
import { Play } from '/@/shared/types/types';

const playButtons: {
    icon: AppIconSelection;
    label: React.ReactNode | string;
    secondary: boolean;
    type: Play;
}[] = [
    {
        icon: 'mediaPlayNext',
        label: (
            <Stack gap="xs" justify="center">
                <Text fw={500} ta="center">
                    {i18n.t('player.addNext', { postProcess: 'sentenceCase' })}
                </Text>
                <Text fw={500} isMuted size="xs" ta="center">
                    {i18n.t('player.holdToShuffle', { postProcess: 'sentenceCase' })}
                </Text>
            </Stack>
        ),

        secondary: true,
        type: Play.NEXT,
    },
    {
        icon: 'mediaPlay',
        label: (
            <Stack gap="xs" justify="center">
                <Text fw={500} ta="center">
                    {i18n.t('player.play', { postProcess: 'sentenceCase' })}
                </Text>
                <Text fw={500} isMuted size="xs" ta="center">
                    {i18n.t('player.holdToShuffle', { postProcess: 'sentenceCase' })}
                </Text>
            </Stack>
        ),
        secondary: false,
        type: Play.NOW,
    },
    {
        icon: 'mediaPlayLast',
        label: (
            <Stack gap="xs" justify="center">
                <Text fw={500} ta="center">
                    {i18n.t('player.addLast', { postProcess: 'sentenceCase' })}
                </Text>
                <Text fw={500} isMuted size="xs" ta="center">
                    {i18n.t('player.holdToShuffle', { postProcess: 'sentenceCase' })}
                </Text>
            </Stack>
        ),
        secondary: true,
        type: Play.LAST,
    },
];

export const LONG_PRESS_PLAY_BEHAVIOR = {
    [Play.LAST]: Play.LAST_SHUFFLE,
    [Play.NEXT]: Play.NEXT_SHUFFLE,
    [Play.NOW]: Play.SHUFFLE,
};

const PLAY_BEHAVIOR_TO_LABEL = {
    [Play.LAST]: i18n.t('player.addLast', { postProcess: 'sentenceCase' }),
    [Play.NEXT]: i18n.t('player.addNext', { postProcess: 'sentenceCase' }),
    [Play.NOW]: i18n.t('player.play', { postProcess: 'sentenceCase' }),
};

const TooltipLabel = ({ label }: { label: React.ReactNode | string; type: Play }) => {
    return (
        <Stack gap="xs" justify="center">
            <Text fw={500} ta="center">
                {label}
            </Text>
            <Text fw={500} isMuted size="xs" ta="center">
                {i18n.t('player.holdToShuffle', { postProcess: 'sentenceCase' })}
            </Text>
        </Stack>
    );
};

export const PlayTooltip = ({
    children,
    disabled,
    type,
}: {
    children: React.ReactNode;
    disabled?: boolean;
    type: Play;
}) => {
    return (
        <Tooltip
            disabled={disabled}
            label={<TooltipLabel label={PLAY_BEHAVIOR_TO_LABEL[type]} type={type} />}
        >
            {children}
        </Tooltip>
    );
};

interface PlayButtonGroupPopoverProps extends PlayButtonGroupProps {
    onClose?: () => void;
    position?: 'bottom' | 'left' | 'right' | 'top';
    triggerRef?: React.RefObject<HTMLElement | null>;
}

interface PlayButtonGroupProps {
    loading?: boolean | Play;
    onPlay: (type: Play) => void;
}

type PopoverPosition = 'bottom' | 'left' | 'right' | 'top';

export const PlayButtonGroup = ({ loading, onPlay }: PlayButtonGroupProps) => {
    return (
        <div className={styles.playButtonGroup}>
            <Tooltip.Group>
                {playButtons.map((button) => (
                    <Tooltip key={button.type} label={button.label}>
                        <PlayButton
                            fill={button.type === Play.NOW}
                            icon={button.icon}
                            isSecondary={button.secondary}
                            loading={loading === button.type}
                            onClick={() => onPlay(button.type)}
                            onLongPress={() => onPlay(LONG_PRESS_PLAY_BEHAVIOR[button.type])}
                        />
                    </Tooltip>
                ))}
            </Tooltip.Group>
        </div>
    );
};

const containerVariants = {
    exit: {
        opacity: 0,
    },
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            delayChildren: 0.1,
            staggerChildren: 0.1,
        },
    },
};

const getItemVariants = (position: PopoverPosition) => {
    const baseTransition = {
        damping: 24,
        stiffness: 300,
        type: 'spring' as const,
    };

    switch (position) {
        case 'bottom':
            return {
                exit: {
                    opacity: 0,
                    scale: 0.8,
                    transition: {
                        duration: 0.2,
                    },
                    y: -10,
                },
                hidden: { opacity: 0, scale: 0.8, y: -10 },
                visible: {
                    opacity: 1,
                    scale: 1,
                    transition: baseTransition,
                    y: 0,
                },
            };
        case 'left':
            return {
                exit: {
                    opacity: 0,
                    scale: 0.8,
                    transition: {
                        duration: 0.2,
                    },
                    x: 10,
                },
                hidden: { opacity: 0, scale: 0.8, x: 10 },
                visible: {
                    opacity: 1,
                    scale: 1,
                    transition: baseTransition,
                    x: 0,
                },
            };
        case 'right':
            return {
                exit: {
                    opacity: 0,
                    scale: 0.8,
                    transition: {
                        duration: 0.2,
                    },
                    x: -10,
                },
                hidden: { opacity: 0, scale: 0.8, x: -10 },
                visible: {
                    opacity: 1,
                    scale: 1,
                    transition: baseTransition,
                    x: 0,
                },
            };
        case 'top':
            return {
                exit: {
                    opacity: 0,
                    scale: 0.8,
                    transition: {
                        duration: 0.2,
                    },
                    y: 10,
                },
                hidden: { opacity: 0, scale: 0.8, y: 10 },
                visible: {
                    opacity: 1,
                    scale: 1,
                    transition: baseTransition,
                    y: 0,
                },
            };
    }
};

const getPositionStyles = (
    position: PopoverPosition,
    triggerRect: DOMRect | null,
): React.CSSProperties => {
    if (!triggerRect) {
        return { display: 'none' };
    }

    const gap = 8;

    switch (position) {
        case 'bottom':
            return {
                height: '64px',
                left: triggerRect.left + triggerRect.width / 2,
                position: 'fixed' as const,
                top: triggerRect.bottom + gap,
                transform: 'translateX(-50%)',
                zIndex: 1000,
            };
        case 'left':
            return {
                height: '64px',
                left: triggerRect.left - gap,
                position: 'fixed' as const,
                top: triggerRect.top + triggerRect.height / 2,
                transform: 'translate(-100%, -50%)',
                zIndex: 1000,
            };
        case 'right':
            return {
                height: '64px',
                left: triggerRect.right + gap,
                position: 'fixed' as const,
                top: triggerRect.top + triggerRect.height / 2,
                transform: 'translateY(-50%)',
                zIndex: 1000,
            };
        case 'top':
            return {
                height: '64px',
                left: triggerRect.left + triggerRect.width / 2,
                position: 'fixed' as const,
                top: triggerRect.top - gap,
                transform: 'translate(-50%, -100%)',
                zIndex: 1000,
            };
    }
};

const getArchOffset = (index: number, position: PopoverPosition): { x?: number; y?: number } => {
    const archCurve = 16;
    const isVertical = position === 'left' || position === 'right';
    const isMiddle = index === 1;

    if (isMiddle) {
        return {};
    }

    if (isVertical) {
        // For left/right positions, offset horizontally toward the parent
        if (position === 'right') {
            return { x: -archCurve };
        } else {
            return { x: archCurve };
        }
    } else {
        // For top/bottom positions, offset vertically toward the parent
        if (position === 'bottom') {
            return { y: -archCurve };
        } else {
            return { y: archCurve };
        }
    }
};

export const PlayButtonGroupPopover = ({
    loading,
    onClose,
    onPlay,
    position = 'bottom',
    triggerRef,
}: PlayButtonGroupPopoverProps) => {
    const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
    const itemVariants = getItemVariants(position);
    const isVertical = position === 'left' || position === 'right';
    const popoverRef = useRef<HTMLDivElement>(null);

    useClickOutside(
        () => {
            onClose?.();
        },
        ['click', 'touchstart'],
        [popoverRef, triggerRef].map((ref) => ref?.current).filter(Boolean) as HTMLElement[],
    );

    useEffect(() => {
        if (!triggerRef?.current) return;

        const updatePosition = () => {
            if (triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect();
                setTriggerRect(rect);
            }
        };

        requestAnimationFrame(updatePosition);

        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);

        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [triggerRef]);

    const positionStyles = getPositionStyles(position, triggerRect);

    const content = (
        <motion.div
            animate="visible"
            className={`${styles.playButtonGroup} ${isVertical ? styles.playButtonGroupVertical : ''}`}
            exit="exit"
            initial="hidden"
            ref={popoverRef}
            style={positionStyles}
            variants={containerVariants}
        >
            <Tooltip.Group>
                {playButtons.map((button, index) => {
                    const archOffset = getArchOffset(index, position);
                    const combinedVariants = {
                        ...itemVariants,
                        exit: {
                            ...itemVariants.exit,
                            x: (itemVariants.exit.x ?? 0) + (archOffset.x ?? 0),
                            y: (itemVariants.exit.y ?? 0) + (archOffset.y ?? 0),
                        },
                        hidden: {
                            ...itemVariants.hidden,
                            x: (itemVariants.hidden.x ?? 0) + (archOffset.x ?? 0),
                            y: (itemVariants.hidden.y ?? 0) + (archOffset.y ?? 0),
                        },
                        visible: {
                            ...itemVariants.visible,
                            x: (itemVariants.visible.x ?? 0) + (archOffset.x ?? 0),
                            y: (itemVariants.visible.y ?? 0) + (archOffset.y ?? 0),
                        },
                    };

                    return (
                        <motion.div key={button.type} variants={combinedVariants}>
                            <Tooltip label={button.label}>
                                <PlayButton
                                    fill={button.type === Play.NOW}
                                    icon={button.icon}
                                    isSecondary={button.secondary}
                                    loading={loading === button.type}
                                    onClick={() => onPlay(button.type)}
                                    onLongPress={() =>
                                        onPlay(LONG_PRESS_PLAY_BEHAVIOR[button.type])
                                    }
                                />
                            </Tooltip>
                        </motion.div>
                    );
                })}
            </Tooltip.Group>
        </motion.div>
    );

    return <Portal>{content}</Portal>;
};
