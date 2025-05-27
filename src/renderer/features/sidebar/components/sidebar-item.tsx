import type { ReactNode } from 'react';

import clsx from 'clsx';
import { Link } from 'react-router-dom';

import styles from './sidebar-item.module.css';

import { Flex, FlexProps } from '/@/shared/components/flex/flex';
import { createPolymorphicComponent } from '/@/shared/utils/create-polymorphic-component';

interface ListItemProps extends FlexProps {
    children: ReactNode;
    disabled?: boolean;
    to?: string;
}

const ItemLink = createPolymorphicComponent<'a', ListItemProps>(Flex);

export const SidebarItem = ({ children, to, ...props }: ListItemProps) => {
    if (to) {
        return (
            <ItemLink
                className={clsx({
                    [styles.disabled]: props.disabled,
                    [styles.link]: true,
                })}
                component={Link}
                to={to}
                {...props}
            >
                {children}
            </ItemLink>
        );
    }
    return (
        <Flex
            className={styles.item}
            tabIndex={0}
            {...props}
        >
            {children}
        </Flex>
    );
};

SidebarItem.Link = ItemLink;
