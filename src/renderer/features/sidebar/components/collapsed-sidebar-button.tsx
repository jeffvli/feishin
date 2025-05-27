import { forwardRef } from 'react';

import styles from './collapsed-sidebar-button.module.css';

import { ActionIcon, ActionIconProps } from '/@/shared/components/action-icon/action-icon';

interface CollapsedSidebarButtonProps extends ActionIconProps {}

export const CollapsedSidebarButton = forwardRef<HTMLButtonElement, CollapsedSidebarButtonProps>(
    ({ children, ...props }: CollapsedSidebarButtonProps, ref) => {
        return (
            <ActionIcon
                className={styles.button}
                ref={ref}
                variant="subtle"
                {...props}
            >
                {children}
            </ActionIcon>
        );
    },
);
