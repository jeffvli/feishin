import { motion, Variants } from 'motion/react';
import { ComponentPropsWithoutRef, forwardRef, ReactNode, Ref } from 'react';

import styles from './context-menu.module.css';

import { Group } from '/@/shared/components/group/group';

interface ContextMenuProps {
    children: ReactNode;
    maxWidth?: number;
    minWidth?: number;
    xPos: number;
    yPos: number;
}

export const ContextMenuButton = forwardRef(
    (
        {
            children,
            leftIcon,
            rightIcon,
            ...props
        }: ComponentPropsWithoutRef<'button'> & {
            leftIcon?: ReactNode;
            rightIcon?: ReactNode;
        },
        ref: any,
    ) => {
        return (
            <button
                {...props}
                className={styles.contextMenuButton}
                disabled={props.disabled}
                key={props.key}
                onClick={props.onClick}
                ref={ref}
            >
                <Group
                    justify="space-between"
                    w="100%"
                >
                    <Group
                        className={styles.left}
                        gap="md"
                    >
                        {leftIcon}
                        {children}
                    </Group>
                    {rightIcon}
                </Group>
            </button>
        );
    },
);

const variants: Variants = {
    closed: {
        opacity: 0,
        transition: {
            duration: 0.1,
        },
    },
    open: {
        opacity: 1,
        transition: {
            duration: 0.1,
        },
    },
};

export const ContextMenu = forwardRef(
    ({ children, maxWidth, minWidth, xPos, yPos }: ContextMenuProps, ref: Ref<HTMLDivElement>) => {
        return (
            <motion.div
                animate="open"
                className={styles.container}
                initial="closed"
                ref={ref}
                style={{
                    left: xPos,
                    maxWidth,
                    minWidth,
                    top: yPos,
                }}
                variants={variants}
            >
                {children}
            </motion.div>
        );
    },
);
