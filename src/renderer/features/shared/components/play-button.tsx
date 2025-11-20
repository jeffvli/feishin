import clsx from 'clsx';
import { t } from 'i18next';

import styles from './play-button.module.css';

import { ActionIcon, ActionIconProps } from '/@/shared/components/action-icon/action-icon';
import { Button, ButtonProps } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';

export interface PlayButtonProps extends ActionIconProps {
    size?: number | string;
}

export const PlayButton = ({ className, variant = 'filled', ...props }: PlayButtonProps) => {
    return (
        <ActionIcon
            className={clsx(styles.button, className, {
                [styles.unthemed]: variant !== 'filled',
            })}
            icon="mediaPlay"
            iconProps={{
                size: 'xl',
            }}
            variant={variant}
            {...props}
        />
    );
};

interface WidePlayButtonProps extends ButtonProps {}

export const WidePlayButton = ({
    className,
    variant = 'default',
    ...props
}: WidePlayButtonProps) => {
    return (
        <Button
            className={clsx(styles.wideButton, className, {
                [styles.unthemed]: variant !== 'filled',
            })}
            classNames={{
                label: styles.wideButtonLabel,
                root: styles.wideButton,
            }}
            variant="subtle"
            {...props}
        >
            {props.children || (
                <Group gap="sm" wrap="nowrap">
                    <Icon fill="default" icon="mediaPlay" size="lg" />
                    {t('player.play', { postProcess: 'sentenceCase' })}
                </Group>
            )}
        </Button>
    );
};

export const WideShuffleButton = ({ ...props }: WidePlayButtonProps) => {
    return (
        <WidePlayButton {...props}>
            <Group gap="sm" wrap="nowrap">
                <Icon fill="default" icon="mediaShuffle" size="lg" />
                {t('action.shuffle', { postProcess: 'sentenceCase' })}
            </Group>
        </WidePlayButton>
    );
};
