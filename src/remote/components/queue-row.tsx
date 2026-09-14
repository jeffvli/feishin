import clsx from 'clsx';
import formatDuration from 'format-duration';
import { animate, motion, PanInfo, useDragControls, useMotionValue } from 'motion/react';
import { useLayoutEffect } from 'react';
import { RowComponentProps } from 'react-window-v2';

import styles from './queue-row.module.css';

import { ListRow } from '/@/remote/components/list-row';
import { Thumbnail } from '/@/remote/components/thumbnail';
import { useLongPress } from '/@/remote/hooks/use-long-press';
import { QueueDragReorder } from '/@/remote/hooks/use-queue-drag-reorder';
import { Icon } from '/@/shared/components/icon/icon';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { RemoteQueueItem } from '/@/shared/types/remote-types';

const SWIPE_DELETE_THRESHOLD = -80;

export interface QueueRowSharedProps {
    currentUniqueId: null | string;
    dragReorder: QueueDragReorder;
    items: RemoteQueueItem[];
    onJump: (uniqueId: string) => void;
    onLongPress: (item: RemoteQueueItem) => void;
    onRemove: (uniqueId: string) => void;
    onReorderDragStart: () => void;
}

export const QueueRow = ({
    ariaAttributes,
    currentUniqueId,
    dragReorder,
    index,
    items,
    onJump,
    onLongPress,
    onRemove,
    onReorderDragStart,
    style,
}: RowComponentProps<QueueRowSharedProps>) => {
    const item = items[index];

    const dragControls = useDragControls();
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const longPress = useLongPress({
        onClick: () => onJump(item.uniqueId),
        onLongPress: () => onLongPress(item),
    });

    // react-window recycles the row *component instance* per index slot, not
    // per item — after a swipe-delete the item one row down shifts up into
    // this same slot, but `x`/`y` are motion values owned by this instance,
    // not the item, so without this they'd keep whatever offset the just-
    // deleted row was left at (mid-swipe, off past the delete threshold).
    // `.jump()`, not `.set()` — a released drag keeps animating on its own
    // momentum/velocity by default, and `.set()` doesn't cancel that, so the
    // in-flight inertia animation was winning the race and re-dragging the
    // recycled row back out after the reset. `.jump()` explicitly stops any
    // active animation and zeroes velocity, not just the value.
    // `useLayoutEffect` (not `useEffect`) so the reset lands before paint —
    // otherwise the recycled row would flash at the stale offset for a frame.
    useLayoutEffect(() => {
        x.jump(0);
        y.jump(0);
    }, [item.uniqueId, x, y]);

    const isCurrent = item.uniqueId === currentUniqueId;
    const isDragging = dragReorder.draggingId === item.uniqueId;
    const dropTarget = isDragging ? null : dragReorder.dropTarget;
    const showTopIndicator = dropTarget?.index === index && dropTarget.edge === 'top';
    const showBottomIndicator = dropTarget?.index === index && dropTarget.edge === 'bottom';

    const handleSwipeEnd = (_event: PointerEvent, info: PanInfo) => {
        if (info.offset.x < SWIPE_DELETE_THRESHOLD) {
            // Kill the release momentum immediately rather than waiting on
            // the `item.uniqueId` effect below — that only fires once this
            // slot's props actually change, and until then the drag's own
            // inertia animation is still free to keep carrying `x` further.
            x.jump(0);
            onRemove(item.uniqueId);
        } else {
            animate(x, 0, { damping: 40, stiffness: 500, type: 'spring' });
        }
    };

    const handleReorderDragEnd = () => {
        animate(y, 0, { damping: 40, stiffness: 500, type: 'spring' });
        dragReorder.endDrag(item.uniqueId);
    };

    return (
        <div {...ariaAttributes} style={style}>
            {showTopIndicator && (
                <div className={clsx(styles['drop-indicator'], styles['drop-indicator-top'])} />
            )}
            <motion.div
                className={clsx(styles.wrapper, { [styles.dragging]: isDragging })}
                drag="y"
                dragControls={dragControls}
                dragListener={false}
                onDrag={(_, info) => dragReorder.updateDrag(info)}
                onDragEnd={handleReorderDragEnd}
                style={{ y }}
            >
                <div className={styles['delete-background']}>
                    <Icon icon="delete" />
                </div>
                <motion.div
                    className={styles.foreground}
                    drag="x"
                    dragConstraints={{ left: -140, right: 0 }}
                    dragElastic={{ left: 0.2, right: 0 }}
                    onDragEnd={handleSwipeEnd}
                    style={{ x }}
                >
                    <ListRow isCurrent={isCurrent} {...longPress}>
                        <div className={styles.index}>
                            {isCurrent ? (
                                <Icon color="primary" icon="mediaPlay" size="sm" />
                            ) : (
                                <Text isMuted isNoSelect size="sm">
                                    {index + 1}
                                </Text>
                            )}
                        </div>
                        <Thumbnail
                            fallbackIcon={<Icon icon="emptySongImage" size={18} />}
                            src={item.imageUrl}
                        />
                        <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                            <Text
                                fw={isCurrent ? 700 : 500}
                                isNoSelect
                                style={{
                                    color: isCurrent ? 'var(--theme-colors-primary)' : undefined,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {item.name}
                            </Text>
                            <Text
                                isMuted
                                isNoSelect
                                size="sm"
                                style={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {item.artistName}
                                {item.album ? ` · ${item.album}` : ''}
                            </Text>
                        </Stack>
                        <Text className={styles.duration} isMuted isNoSelect size="sm">
                            {formatDuration(item.duration)}
                        </Text>
                        <div
                            className={styles['drag-handle']}
                            // Capture phase, not bubble: motion's own drag="x"
                            // listener on the foreground wrapper is attached
                            // natively and fires during the browser's normal
                            // bubble-up before a same-phase React handler here
                            // would even run, so stopping propagation from a
                            // regular onPointerDown is too late — it still reads
                            // any diagonal movement during the reorder drag as a
                            // horizontal swipe, revealing the delete background
                            // behind a purely vertical gesture. Capture runs
                            // first, before that listener ever sees the event.
                            onPointerDownCapture={(e) => {
                                e.stopPropagation();
                                onReorderDragStart();
                                dragReorder.startDrag(item.uniqueId, index);
                                dragControls.start(e);
                            }}
                        >
                            <Icon icon="dragVertical" />
                        </div>
                    </ListRow>
                </motion.div>
            </motion.div>
            {showBottomIndicator && (
                <div className={clsx(styles['drop-indicator'], styles['drop-indicator-bottom'])} />
            )}
        </div>
    );
};
