import { animate, motion, PanInfo, useDragControls, useMotionValue } from 'motion/react';
import { ComponentPropsWithoutRef, ReactNode, useEffect } from 'react';

import styles from './action-sheet.module.css';

import { Drawer } from '/@/shared/components/drawer/drawer';
import { AppIcon, Icon } from '/@/shared/components/icon/icon';
import { ScrollArea } from '/@/shared/components/scroll-area/scroll-area';
import { Spinner } from '/@/shared/components/spinner/spinner';

interface ActionSheetProps {
    children: ReactNode;
    onClose: () => void;
    opened: boolean;
}

const DISMISS_OFFSET_THRESHOLD = 80;
const DISMISS_VELOCITY_THRESHOLD = 500;

export const ActionSheet = ({ children, onClose, opened }: ActionSheetProps) => {
    const dragControls = useDragControls();
    const y = useMotionValue(0);

    // Drawer.content is `height: auto`-sized (see action-sheet.module.css),
    // so it doesn't remount between opens — reset any leftover drag offset
    // from a previous close-by-cancel before the sheet becomes visible again.
    useEffect(() => {
        if (opened) y.set(0);
    }, [opened, y]);

    const handleDragEnd = (_event: PointerEvent, info: PanInfo) => {
        if (
            info.offset.y > DISMISS_OFFSET_THRESHOLD ||
            info.velocity.y > DISMISS_VELOCITY_THRESHOLD
        ) {
            onClose();
        } else {
            animate(y, 0, { damping: 40, stiffness: 500, type: 'spring' });
        }
    };

    return (
        <Drawer
            classNames={{ body: styles.body, content: styles.content }}
            onClose={onClose}
            opened={opened}
            position="bottom"
            withCloseButton={false}
        >
            <motion.div
                className={styles.sheet}
                drag="y"
                dragConstraints={{ bottom: 300, top: 0 }}
                dragControls={dragControls}
                dragElastic={{ bottom: 0.5, top: 0 }}
                dragListener={false}
                onDragEnd={handleDragEnd}
                style={{ y }}
            >
                <div className={styles.handle} onPointerDown={(e) => dragControls.start(e)}>
                    <div className={styles['handle-bar']} />
                </div>
                <ScrollArea className={styles.maxHeight}>{children}</ScrollArea>
            </motion.div>
        </Drawer>
    );
};

interface ActionSheetHeaderProps {
    onBack: () => void;
    title: ReactNode;
}

const Header = ({ onBack, title }: ActionSheetHeaderProps) => {
    return (
        <div className={styles.header}>
            <button aria-label="Back" className={styles.backButton} onClick={onBack} type="button">
                <Icon icon="arrowLeftS" />
            </button>
            <div className={styles['header-title']}>{title}</div>
            <div className={styles['header-spacer']} />
        </div>
    );
};

interface ActionSheetItemProps extends Omit<ComponentPropsWithoutRef<'button'>, 'type'> {
    leftIcon?: keyof typeof AppIcon;
    // Swaps leftIcon for a spinner and forces the item disabled — the
    // in-flight state for an acked send (see use-acked-action.ts), so the
    // user sees which item they tapped rather than just "everything's
    // greyed out".
    loading?: boolean;
    rightIcon?: keyof typeof AppIcon;
}

const Item = ({
    children,
    disabled,
    leftIcon,
    loading,
    rightIcon,
    ...props
}: ActionSheetItemProps) => {
    return (
        <button className={styles.item} disabled={disabled || loading} type="button" {...props}>
            {loading ? <Spinner size={18} /> : leftIcon && <Icon icon={leftIcon} />}
            <span className={styles['item-label']}>{children}</span>
            {rightIcon && <Icon className={styles['item-right-icon']} icon={rightIcon} />}
        </button>
    );
};

const Divider = () => <div className={styles.divider} />;

ActionSheet.Divider = Divider;
ActionSheet.Header = Header;
ActionSheet.Item = Item;
