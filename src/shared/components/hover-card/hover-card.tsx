import {
    HoverCard as MantineHoverCard,
    HoverCardProps as MantineHoverCardProps,
} from '@mantine/core';

import styles from './hover-card.module.css';

interface HoverCardProps extends MantineHoverCardProps {}

export const HoverCard = ({ children, classNames, ...props }: HoverCardProps) => {
    return (
        <MantineHoverCard
            classNames={{
                dropdown: styles.dropdown,
                ...classNames,
            }}
            {...props}
        >
            {children}
        </MantineHoverCard>
    );
};

HoverCard.Target = MantineHoverCard.Target;
HoverCard.Dropdown = MantineHoverCard.Dropdown;
