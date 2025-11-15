import type { Dispatch, SetStateAction } from 'react';

import * as RadixContextMenu from '@radix-ui/react-context-menu';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'motion/react';
import { createContext, Fragment, type ReactNode, useContext, useMemo, useState } from 'react';

import styles from './context-menu.module.css';

import { animationVariants } from '/@/shared/components/animations/animation-variants';
import { AppIcon, Icon } from '/@/shared/components/icon/icon';
import { ScrollArea } from '/@/shared/components/scroll-area/scroll-area';

interface ContextMenuContext {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
}

export const ContextMenuContext = createContext<ContextMenuContext | null>(null);

interface ContentProps {
    children: ReactNode;
    onCloseAutoFocus?: (event: FocusEvent) => void;
    onEscapeKeyDown?: (event: KeyboardEvent) => void;
    onFocusOutside?: (event: FocusEvent) => void;
    onPointerDownOutside?: (event: PointerEvent) => void;
    stickyContent?: ReactNode;
}

interface ContextMenuProps {
    children: ReactNode;
}

interface DividerProps {}

interface ItemProps {
    children: ReactNode;
    className?: string;
    disabled?: boolean;
    isSelected?: boolean;
    leftIcon?: keyof typeof AppIcon;
    onSelect?: (event: Event) => void;
    rightIcon?: keyof typeof AppIcon;
}

interface LabelProps extends React.ComponentPropsWithoutRef<'div'> {
    children: ReactNode;
}

interface SubmenuContext {
    disabled?: boolean;
    isCloseDisabled?: boolean;
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
}

interface TargetProps {
    children: ReactNode;
}

export function ContextMenu(props: ContextMenuProps) {
    const { children } = props;

    const [open, setOpen] = useState(false);
    const context = useMemo(() => ({ open, setOpen }), [open]);

    return (
        <RadixContextMenu.Root onOpenChange={setOpen}>
            <ContextMenuContext.Provider value={context}>{children}</ContextMenuContext.Provider>
        </RadixContextMenu.Root>
    );
}

function Content(props: ContentProps) {
    const { children, stickyContent } = props;
    const { open } = useContext(ContextMenuContext) as ContextMenuContext;

    return (
        <AnimatePresence>
            {open && (
                <RadixContextMenu.Portal forceMount>
                    <RadixContextMenu.Content asChild className={styles.content}>
                        <motion.div
                            animate="show"
                            className={styles.content}
                            exit="hidden"
                            initial="hidden"
                        >
                            {stickyContent}
                            <ScrollArea className={styles.maxHeight}>{children}</ScrollArea>
                        </motion.div>
                    </RadixContextMenu.Content>
                </RadixContextMenu.Portal>
            )}
        </AnimatePresence>
    );
}

function Divider(props: DividerProps) {
    return <RadixContextMenu.Separator {...props} className={styles.divider} />;
}

function Item(props: ItemProps) {
    const { children, className, disabled, isSelected, leftIcon, onSelect, rightIcon } = props;

    return (
        <RadixContextMenu.Item
            className={clsx(styles.item, className, {
                [styles.disabled]: disabled,
                [styles.selected]: isSelected,
                [styles['has-left-icon']]: !!leftIcon,
                [styles['has-right-icon']]: !!rightIcon,
            })}
            disabled={disabled}
            onSelect={onSelect}
        >
            {leftIcon && <Icon className={styles.leftIcon} icon={leftIcon} />}
            {children}
            {rightIcon && <Icon className={styles.rightIcon} icon={rightIcon} />}
        </RadixContextMenu.Item>
    );
}

function Label(props: LabelProps) {
    const { children, className, ...htmlProps } = props;

    return (
        <RadixContextMenu.Label className={clsx(styles.label, className)} {...htmlProps}>
            {children}
        </RadixContextMenu.Label>
    );
}

function Target(props: TargetProps) {
    const { children } = props;

    return (
        <RadixContextMenu.Trigger asChild className={styles.target}>
            {children}
        </RadixContextMenu.Trigger>
    );
}

const SubmenuContext = createContext<null | SubmenuContext>(null);

interface SubmenuContentProps {
    children: ReactNode;
    stickyContent?: ReactNode;
}

interface SubmenuProps {
    children: ReactNode;
    disabled?: boolean;
    isCloseDisabled?: boolean;
    open?: boolean;
}

interface SubmenuTargetProps {
    children: ReactNode;
}

function Submenu(props: SubmenuProps) {
    const { children, disabled, isCloseDisabled, open: isManuallyOpen } = props;
    const [open, setOpen] = useState(isManuallyOpen ?? false);
    const context = useMemo(
        () => ({ disabled, isCloseDisabled, open, setOpen }),
        [disabled, isCloseDisabled, open],
    );

    return (
        <RadixContextMenu.Sub open={open}>
            <SubmenuContext.Provider value={context}>{children}</SubmenuContext.Provider>
        </RadixContextMenu.Sub>
    );
}

function SubmenuContent(props: SubmenuContentProps) {
    const { children, stickyContent } = props;
    const { isCloseDisabled, open, setOpen } = useContext(SubmenuContext) as SubmenuContext;

    return (
        <Fragment>
            {open && (
                <RadixContextMenu.Portal forceMount>
                    <RadixContextMenu.SubContent
                        className={styles.content}
                        onMouseEnter={() => setOpen(true)}
                        onMouseLeave={() => {
                            if (!isCloseDisabled) {
                                setOpen(false);
                            }
                        }}
                    >
                        <motion.div
                            animate="show"
                            className={styles.innerContent}
                            initial="hidden"
                            variants={animationVariants.fadeIn}
                        >
                            {stickyContent}
                            <ScrollArea className={styles.maxHeight}>{children}</ScrollArea>
                        </motion.div>
                    </RadixContextMenu.SubContent>
                </RadixContextMenu.Portal>
            )}
        </Fragment>
    );
}

function SubmenuTarget(props: SubmenuTargetProps) {
    const { children } = props;
    const { disabled, setOpen } = useContext(SubmenuContext) as SubmenuContext;

    return (
        <RadixContextMenu.SubTrigger
            className={clsx({ [styles.disabled]: disabled })}
            disabled={disabled}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
        >
            {children}
        </RadixContextMenu.SubTrigger>
    );
}

ContextMenu.Target = Target;
ContextMenu.Content = Content;
ContextMenu.Item = Item;
ContextMenu.Label = Label;
ContextMenu.Group = RadixContextMenu.Group;
ContextMenu.Submenu = Submenu;
ContextMenu.SubmenuTarget = SubmenuTarget;
ContextMenu.SubmenuContent = SubmenuContent;
ContextMenu.Divider = Divider;
ContextMenu.Arrow = RadixContextMenu.Arrow;
