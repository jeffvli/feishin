import clsx from 'clsx';
import { RiPlayFill } from 'react-icons/ri';

import styles from './play-button.module.css';

import { ActionIcon, ActionIconProps } from '/@/shared/components/action-icon/action-icon';

export interface PlayButtonProps extends ActionIconProps {
    size?: number | string;
}

export const PlayButton = ({ className, size = '1.5rem', ...props }: PlayButtonProps) => {
    return (
        <ActionIcon
            className={clsx(styles.button, className)}
            variant="filled"
            {...props}
        >
            <RiPlayFill size={size} />
        </ActionIcon>
    );
};
