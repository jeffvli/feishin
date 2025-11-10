import {
    attachClosestEdge,
    type Edge,
    extractClosestEdge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import {
    BaseEventPayload,
    CleanupFn,
    ElementDragType,
} from '@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types';
import {
    draggable,
    dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { disableNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview';
import { useEffect, useRef, useState } from 'react';

import { LibraryItem } from '/@/shared/types/domain-types';
import { dndUtils, DragData, DragOperation, DragTarget } from '/@/shared/types/drag-and-drop';

interface UseDraggableProps {
    drag?: {
        getId: () => string[];
        getItem: () => unknown[];
        itemType?: LibraryItem;
        onDragStart?: () => void;
        onDrop?: () => void;
        onGenerateDragPreview?: (data: BaseEventPayload<ElementDragType>) => void;
        operation: DragOperation[];
        target: DragTarget | string;
    };
    drop?: {
        canDrop: (args: { source: DragData }) => boolean;
        getData: () => DragData;
        onDrag: (args: { edge: Edge | null }) => void;
        onDragLeave: () => void;
        onDrop: (args: { edge: Edge | null; self: DragData; source: DragData }) => void;
    };
    isEnabled: boolean;
}

export const useDragDrop = <TElement extends HTMLElement>({
    drag,
    drop,
    isEnabled,
}: UseDraggableProps) => {
    const ref = useRef<null | TElement>(null);

    const [isDragging, setIsDragging] = useState(false);
    const [isDraggedOver, setIsDraggedOver] = useState<Edge | null>(null);

    useEffect(() => {
        if (!ref.current || !isEnabled) return;

        const functions: CleanupFn[] = [];

        if (drag) {
            functions.push(
                draggable({
                    element: ref.current,
                    getInitialData: () => {
                        const id = drag.getId();
                        const item = drag.getItem();

                        const data = dndUtils.generateDragData({
                            id,
                            item,
                            itemType: drag.itemType,
                            operation: drag.operation,
                            type: drag.target,
                        });
                        return data;
                    },
                    onDragStart: () => {
                        setIsDragging(true);
                        drag.onDragStart?.();
                    },
                    onDrop: () => {
                        setIsDragging(false);
                        drag.onDrop?.();
                    },
                    onGenerateDragPreview: (data) => {
                        if (drag.onGenerateDragPreview) {
                            return drag.onGenerateDragPreview(data);
                        }

                        disableNativeDragPreview({ nativeSetDragImage: data.nativeSetDragImage });
                        // setCustomNativeDragPreview({
                        //     nativeSetDragImage: data.nativeSetDragImage,
                        //     // render: ({ container }) => {
                        //     //     const root = createRoot(container);
                        //     //     root.render(<DragPreview itemCount={1} />);
                        //     // },
                        // });
                    },
                }),
            );
        }

        if (drop) {
            functions.push(
                dropTargetForElements({
                    canDrop: (args) => {
                        return (
                            drop.canDrop?.({ source: args.source.data as unknown as DragData }) ||
                            false
                        );
                    },
                    element: ref.current,
                    getData: (args) => {
                        const dropData = drop.getData();

                        const data = dndUtils.generateDragData(dropData);

                        return attachClosestEdge(data, {
                            allowedEdges: ['top', 'bottom'],
                            element: args.element,
                            input: args.input,
                        });
                    },
                    onDrag: (args) => {
                        const closestEdgeOfTarget: Edge | null = extractClosestEdge(args.self.data);
                        drop.onDrag?.({ edge: closestEdgeOfTarget });
                        setIsDraggedOver(closestEdgeOfTarget);
                    },
                    onDragLeave: () => {
                        setIsDraggedOver(null);
                    },
                    onDrop: (args) => {
                        const closestEdgeOfTarget: Edge | null = extractClosestEdge(args.self.data);
                        drop.onDrop?.({
                            edge: closestEdgeOfTarget,
                            self: args.self.data as unknown as DragData,
                            source: args.source.data as unknown as DragData,
                        });
                        setIsDraggedOver(null);
                    },
                }),
            );
        }

        return combine(...functions);
    }, [drag, drop, isDragging, isDraggedOver, isEnabled]);

    return {
        isDraggedOver,
        isDragging,
        ref,
    };
};
