import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { List, useListRef } from 'react-window-v2';

import { ClearQueueButton } from '/@/remote/components/buttons/clear-queue-button';
import { FadeIn } from '/@/remote/components/fade-in';
import { TrackActionSheet } from '/@/remote/components/menus/track-action-sheet';
import { QueueRow } from '/@/remote/components/queue-row';
import { QueueDropTarget, useQueueDragReorder } from '/@/remote/hooks/use-queue-drag-reorder';
import { useSend } from '/@/remote/store';
import { useQueueState } from '/@/remote/store/library';
import { Text } from '/@/shared/components/text/text';
import { RemoteQueueItem } from '/@/shared/types/remote-types';

// 56px row (list-row.module.css's min-height) + the 4px gap the rows used to
// get for free from `Reorder.Group`'s flex `gap` — react-window's absolutely
// positioned rows don't get flexbox gap, so it's baked into the row height
// and applied as the row's own top padding instead.
const ROW_HEIGHT = 60;
const OVERSCAN_COUNT = 4;

export const QueuePage = () => {
    const send = useSend();
    const { currentUniqueId, items } = useQueueState();
    const [activeTrack, setActiveTrack] = useState<null | {
        id: string;
        name: string;
        uniqueId: string;
    }>(null);
    const [localOrder, setLocalOrder] = useState<string[]>(() => items.map((i) => i.uniqueId));
    const isDraggingRef = useRef(false);
    const listRef = useListRef(null);

    // The server broadcasts the authoritative order on every queue change —
    // resync unless a drag is in flight, so a push mid-gesture can't yank the
    // item out from under the user's finger.
    useEffect(() => {
        if (isDraggingRef.current) return;
        setLocalOrder(items.map((i) => i.uniqueId));
    }, [items]);

    // A `Map` lookup instead of `items.find(...)` inside `.map(...)` — the
    // latter is O(n) per item, O(n²) overall, and reruns on every queue
    // broadcast. At real-world reported scale (~38k items) that's over a
    // billion comparisons, enough to hang the main thread on its own,
    // independent of whether the rows themselves are virtualized.
    const itemsById = useMemo(() => new Map(items.map((i) => [i.uniqueId, i])), [items]);

    const orderedItems = useMemo(
        () =>
            localOrder
                .map((uniqueId) => itemsById.get(uniqueId))
                .filter((i): i is RemoteQueueItem => !!i),
        [localOrder, itemsById],
    );

    const handleJump = useCallback(
        (uniqueId: string) => send({ event: 'queue-jump', uniqueId }),
        [send],
    );

    const handleLongPress = useCallback((item: RemoteQueueItem) => {
        setActiveTrack({ id: item.id, name: item.name, uniqueId: item.uniqueId });
    }, []);

    const handleRemove = useCallback(
        (uniqueId: string) => {
            setLocalOrder((prev) => prev.filter((id) => id !== uniqueId));
            send({ event: 'remove-from-queue', uniqueId });
        },
        [send],
    );

    const handleDrop = useCallback(
        (movedUniqueId: string, target: QueueDropTarget) => {
            isDraggingRef.current = false;

            setLocalOrder((prev) => {
                const from = prev.indexOf(movedUniqueId);
                if (from === -1) return prev;

                const withoutMoved = prev.filter((id) => id !== movedUniqueId);
                let insertAt = target.index + (target.edge === 'bottom' ? 1 : 0);
                // Removing the dragged item above the target shifts every
                // later index down by one — account for that before inserting.
                if (from < insertAt) insertAt -= 1;
                insertAt = Math.min(Math.max(insertAt, 0), withoutMoved.length);

                const next = [...withoutMoved];
                next.splice(insertAt, 0, movedUniqueId);

                const after = next[insertAt + 1];
                const before = next[insertAt - 1];

                if (after) {
                    send({
                        edge: 'top',
                        event: 'reorder-queue',
                        targetUniqueId: after,
                        uniqueId: movedUniqueId,
                    });
                } else if (before) {
                    send({
                        edge: 'bottom',
                        event: 'reorder-queue',
                        targetUniqueId: before,
                        uniqueId: movedUniqueId,
                    });
                }

                return next;
            });
        },
        [send],
    );

    const dragReorder = useQueueDragReorder({
        itemCount: orderedItems.length,
        listRef,
        onDrop: handleDrop,
        rowHeight: ROW_HEIGHT,
    });

    const rowProps = useMemo(
        () => ({
            currentUniqueId,
            dragReorder,
            items: orderedItems,
            onJump: handleJump,
            onLongPress: handleLongPress,
            onRemove: handleRemove,
            onReorderDragStart: () => {
                isDraggingRef.current = true;
            },
        }),
        [currentUniqueId, dragReorder, handleJump, handleLongPress, handleRemove, orderedItems],
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {items.length === 0 ? (
                <Text isMuted p="md" ta="center">
                    Queue is empty
                </Text>
            ) : (
                <>
                    <div
                        style={{
                            flexShrink: 0,
                            padding: 'var(--theme-spacing-md) var(--theme-spacing-md) 0',
                        }}
                    >
                        <ClearQueueButton />
                    </div>
                    <FadeIn style={{ flex: 1, minHeight: 0, padding: 'var(--theme-spacing-md)' }}>
                        <List
                            listRef={listRef}
                            overscanCount={OVERSCAN_COUNT}
                            rowComponent={QueueRow}
                            rowCount={orderedItems.length}
                            rowHeight={ROW_HEIGHT}
                            rowProps={rowProps}
                        />
                    </FadeIn>
                </>
            )}
            <TrackActionSheet
                onClose={() => setActiveTrack(null)}
                onRemoveFromQueue={
                    activeTrack ? () => handleRemove(activeTrack.uniqueId) : undefined
                }
                track={activeTrack}
            />
        </div>
    );
};
