import clsx from 'clsx';
import { t } from 'i18next';
import { forwardRef, memo } from 'react';

import styles from './play-button.module.css';

import { PlayTooltip } from '/@/renderer/features/shared/components/play-button-group';
import { usePlayButtonClick } from '/@/renderer/features/shared/hooks/use-play-button-click';
import { ActionIcon, ActionIconProps } from '/@/shared/components/action-icon/action-icon';
import { Button, ButtonProps } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { AppIcon, Icon } from '/@/shared/components/icon/icon';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Play } from '/@/shared/types/types';

export interface DefaultPlayButtonProps extends ActionIconProps {
    size?: number | string;
}

export const DefaultPlayButton = forwardRef<HTMLButtonElement, DefaultPlayButtonProps>(
    ({ className, variant = 'filled', ...props }, ref) => {
        return (
            <ActionIcon
                className={clsx(styles.textButton, className, {
                    [styles.unthemed]: variant !== 'filled',
                })}
                icon="mediaPlay"
                iconProps={{
                    size: 'xl',
                }}
                ref={ref}
                variant={variant}
                {...props}
            />
        );
    },
);

DefaultPlayButton.displayName = 'DefaultPlayButton';

interface TextPlayButtonProps extends ButtonProps {
    onLongPress?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    showTooltip?: boolean;
}

export const PlayTextButton = ({
    className,
    showTooltip = true,
    variant = 'default',
    ...props
}: TextPlayButtonProps) => {
    const button = (
        <Button
            className={clsx(styles.wideTextButton, className, {
                [styles.unthemed]: variant !== 'filled',
            })}
            classNames={{
                label: styles.wideTextButtonLabel,
                root: styles.wideTextButton,
            }}
            variant="subtle"
            {...props}
        >
            {props.children || (
                <Group gap="sm" wrap="nowrap">
                    <Icon icon="mediaPlay" size="lg" />
                    {t('player.play', { postProcess: 'sentenceCase' })}
                </Group>
            )}
        </Button>
    );

    const hasLongPress = Boolean(
        props.onLongPress || (props as any).onMouseDown || (props as any).onTouchStart,
    );

    if (hasLongPress && showTooltip) {
        return <PlayTooltip type={Play.NOW}>{button}</PlayTooltip>;
    }

    return button;
};

export const PlayNextTextButton = ({ ...props }: TextPlayButtonProps) => {
    const button = (
        <PlayTextButton {...props} showTooltip={false}>
            <Group gap="sm" wrap="nowrap">
                <Icon className={styles.noFill} icon="mediaPlayNext" size="lg" />
                {t('player.addNext', { postProcess: 'sentenceCase' })}
            </Group>
        </PlayTextButton>
    );

    const hasLongPress = Boolean(
        props.onLongPress || (props as any).onMouseDown || (props as any).onTouchStart,
    );

    if (hasLongPress) {
        return <PlayTooltip type={Play.NEXT}>{button}</PlayTooltip>;
    }

    return button;
};

export const PlayLastTextButton = ({ ...props }: TextPlayButtonProps) => {
    const button = (
        <PlayTextButton {...props} showTooltip={false}>
            <Group gap="sm" wrap="nowrap">
                <Icon className={styles.noFill} icon="mediaPlayLast" size="lg" />
                {t('player.addLast', { postProcess: 'sentenceCase' })}
            </Group>
        </PlayTextButton>
    );

    const hasLongPress = Boolean(
        props.onLongPress || (props as any).onMouseDown || (props as any).onTouchStart,
    );

    if (hasLongPress) {
        return <PlayTooltip type={Play.LAST}>{button}</PlayTooltip>;
    }

    return button;
};

export const WideShuffleButton = ({ ...props }: TextPlayButtonProps) => {
    return (
        <PlayTextButton {...props}>
            <Group gap="sm" wrap="nowrap">
                <Icon fill="default" icon="mediaShuffle" size="lg" />
                {t('action.shuffle', { postProcess: 'sentenceCase' })}
            </Group>
        </PlayTextButton>
    );
};

interface PlayButtonProps {
    classNames?: string;
    fill?: boolean;
    icon?: keyof typeof AppIcon;
    isSecondary?: boolean;
    loading?: boolean;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    onLongPress?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const PlayButtonBase = forwardRef<HTMLButtonElement, PlayButtonProps>(
    (
        {
            classNames,
            fill,
            icon = 'mediaPlay',
            isSecondary,
            loading,
            onClick,
            onLongPress,
        }: PlayButtonProps,
        ref,
    ) => {
        const clickHandlers = usePlayButtonClick({
            loading,
            onClick,
            onLongPress,
        });

        return (
            <button
                className={clsx(styles.playButton, classNames, {
                    [styles.fill]: fill,
                    [styles.secondary]: isSecondary,
                })}
                ref={ref}
                {...clickHandlers.handlers}
                {...clickHandlers.props}
            >
                {loading ? <Spinner color="black" /> : <Icon icon={icon} size="lg" />}
            </button>
        );
    },
);

export const PlayButton = memo(PlayButtonBase);

PlayButton.displayName = 'PlayButton';
