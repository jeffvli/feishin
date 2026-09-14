import { PanInfo } from 'motion/react';
import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { ListImperativeAPI } from 'react-window-v2';

const AUTO_SCROLL_EDGE_PX = 40;
const AUTO_SCROLL_SPEED_PX = 10;

export type QueueDragReorder = ReturnType<typeof useQueueDragReorder>;

export interface QueueDropTarget {
    edge: 'bottom' | 'top';
    index: number;
}

interface UseQueueDragReorderOptions {
    itemCount: number;
    listRef: RefObject<ListImperativeAPI | null>;
    onDrop: (uniqueId: string, target: QueueDropTarget) => void;
    rowHeight: number;
}

// Drag-to-reorder for a virtualized (react-window-v2) list. Motion's
// `Reorder.Group`/`Reorder.Item` can't be used here — they measure every
// mounted sibling to FLIP-animate the reorder, which requires all rows to be
// in the DOM at once, defeating the point of virtualizing a large queue.
// This reimplements just the position math by hand, driven by Motion's
// lower-level `drag`/`useDragControls` primitives — the same mechanism the
// row's swipe-to-delete gesture already uses successfully on touch, so no
// new dependency and no unverified touch-support risk.
export function useQueueDragReorder({
    itemCount,
    listRef,
    onDrop,
    rowHeight,
}: UseQueueDragReorderOptions) {
    const [draggingId, setDraggingId] = useState<null | string>(null);
    const [dropTarget, setDropTargetState] = useState<null | QueueDropTarget>(null);

    // `onDragEnd` needs the *latest* drop target the moment the gesture ends,
    // but its own callback identity is created once per Motion drag — a ref
    // mirrors the state so `endDrag` never reads a stale closed-over value.
    const dropTargetRef = useRef<null | QueueDropTarget>(null);
    const autoScrollFrameRef = useRef<null | number>(null);
    const autoScrollDirectionRef = useRef<-1 | 0 | 1>(0);

    const setDropTarget = useCallback((target: null | QueueDropTarget) => {
        dropTargetRef.current = target;
        setDropTargetState(target);
    }, []);

    const stopAutoScroll = useCallback(() => {
        autoScrollDirectionRef.current = 0;
        if (autoScrollFrameRef.current !== null) {
            cancelAnimationFrame(autoScrollFrameRef.current);
            autoScrollFrameRef.current = null;
        }
    }, []);

    // Dragging past the visible viewport edge doesn't auto-scroll today
    // either (pointer capture on the dragged element blocks the underlying
    // native touch-scroll) — this is new capability, not a regression, but
    // it's what makes reordering across a queue larger than one screenful
    // usable at all once only ~10 rows are ever mounted at a time.
    //
    // `tick` is a plain closure defined inline rather than its own
    // `useCallback` — a self-recursive `useCallback` (referencing its own
    // memoized identity from within its body via `requestAnimationFrame`)
    // isn't something the reactive-deps analysis can express safely, and it
    // doesn't need referential stability of its own anyway since nothing
    // outside `updateAutoScroll` ever reads it.
    const updateAutoScroll = useCallback(
        (pointerY: number, rect: DOMRect) => {
            let direction: -1 | 0 | 1 = 0;
            if (pointerY - rect.top < AUTO_SCROLL_EDGE_PX) direction = -1;
            else if (rect.bottom - pointerY < AUTO_SCROLL_EDGE_PX) direction = 1;

            autoScrollDirectionRef.current = direction;
            if (direction === 0 || autoScrollFrameRef.current !== null) return;

            const tick = () => {
                const element = listRef.current?.element;
                if (!element || autoScrollDirectionRef.current === 0) {
                    autoScrollFrameRef.current = null;
                    return;
                }

                element.scrollBy({ top: autoScrollDirectionRef.current * AUTO_SCROLL_SPEED_PX });
                autoScrollFrameRef.current = requestAnimationFrame(tick);
            };
            autoScrollFrameRef.current = requestAnimationFrame(tick);
        },
        [listRef],
    );

    const startDrag = useCallback(
        (uniqueId: string, index: number) => {
            setDraggingId(uniqueId);
            setDropTarget({ edge: 'top', index });
        },
        [setDropTarget],
    );

    const updateDrag = useCallback(
        (info: PanInfo) => {
            const element = listRef.current?.element;
            if (!element) return;

            const rect = element.getBoundingClientRect();
            updateAutoScroll(info.point.y, rect);

            const offsetFromListTop = info.point.y - rect.top + element.scrollTop;
            const rawIndex = offsetFromListTop / rowHeight;
            const index = Math.min(Math.max(Math.floor(rawIndex), 0), itemCount - 1);
            const withinRow = rawIndex - Math.floor(rawIndex);
            const edge: QueueDropTarget['edge'] = withinRow > 0.5 ? 'bottom' : 'top';

            setDropTarget({ edge, index });
        },
        [itemCount, listRef, rowHeight, setDropTarget, updateAutoScroll],
    );

    const endDrag = useCallback(
        (uniqueId: string) => {
            stopAutoScroll();
            setDraggingId(null);

            const target = dropTargetRef.current;
            setDropTarget(null);
            if (target) {
                onDrop(uniqueId, target);
            }
        },
        [onDrop, setDropTarget, stopAutoScroll],
    );

    const cancelDrag = useCallback(() => {
        stopAutoScroll();
        setDraggingId(null);
        setDropTarget(null);
    }, [setDropTarget, stopAutoScroll]);

    // Navigating away mid-drag (or any other unmount) would otherwise leave
    // the auto-scroll rAF loop running forever against a detached list.
    useEffect(() => stopAutoScroll, [stopAutoScroll]);

    return { cancelDrag, draggingId, dropTarget, endDrag, startDrag, updateDrag };
}
