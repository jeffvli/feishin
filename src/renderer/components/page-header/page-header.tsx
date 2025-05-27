import clsx from 'clsx';
import { AnimatePresence, motion, Variants } from 'motion/react';
import { CSSProperties, ReactNode, useRef } from 'react';

import styles from './page-header.module.css';

import { useShouldPadTitlebar } from '/@/renderer/hooks';
import { useWindowSettings } from '/@/renderer/store/settings.store';
import { useAppTheme } from '/@/renderer/themes/use-app-theme';
import { Flex, FlexProps } from '/@/shared/components/flex/flex';
import { Platform } from '/@/shared/types/types';

export interface PageHeaderProps
    extends Omit<FlexProps, 'onAnimationStart' | 'onDrag' | 'onDragEnd' | 'onDragStart'> {
    animated?: boolean;
    backgroundColor?: string;
    children?: ReactNode;
    height?: string;
    isHidden?: boolean;
    position?: string;
}

const variants: Variants = {
    animate: {
        opacity: 1,
        transition: {
            duration: 0.3,
            ease: 'easeIn',
        },
    },
    exit: { opacity: 0 },
    initial: { opacity: 0 },
};

export const PageHeader = ({
    animated,
    backgroundColor = 'var(--theme-colors-background)',
    children,
    height,
    isHidden,
    position,
    ...props
}: PageHeaderProps) => {
    const ref = useRef(null);
    const padRight = useShouldPadTitlebar();
    const { windowBarStyle } = useWindowSettings();
    const { mode } = useAppTheme();

    return (
        <>
            <Flex
                className={styles.container}
                ref={ref}
                style={{ height, position: position as CSSProperties['position'] }}
                {...props}
            >
                <div
                    className={clsx(styles.header, {
                        [styles.hidden]: isHidden,
                        [styles.isDraggable]: windowBarStyle === Platform.WEB,
                        [styles.padRight]: padRight,
                    })}
                >
                    <AnimatePresence initial={animated ?? false}>
                        <motion.div
                            animate="animate"
                            className={styles.titleWrapper}
                            exit="exit"
                            initial="initial"
                            variants={variants}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>
                {backgroundColor && (
                    <>
                        <div
                            className={styles.backgroundImage}
                            style={{
                                background: backgroundColor,
                            }}
                        />
                        <div
                            className={clsx(styles.backgroundImageOverlay, {
                                [styles.dark]: mode === 'dark',
                                [styles.light]: mode === 'light',
                            })}
                        />
                    </>
                )}
            </Flex>
        </>
    );
};
