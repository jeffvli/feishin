import clsx from 'clsx';
import { memo } from 'react';
import { Link, LinkProps } from 'react-router-dom';

import styles from './sidebar-item.module.css';

import { Button, ButtonProps } from '/@/shared/components/button/button';

interface SidebarItemProps extends ButtonProps {
    to: LinkProps['to'];
}

export const SidebarItem = ({ children, to, ...props }: SidebarItemProps) => {
    return (
        <Button
            className={clsx({
                [styles.disabled]: props.disabled,
                [styles.link]: true,
            })}
            component={Link}
            to={to}
            variant="subtle"
            {...props}
        >
            {children}
        </Button>
    );
};

export const MemoizedSidebarItem = memo(SidebarItem);
