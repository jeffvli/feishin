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
    Input,
} from '@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types';
import {
    draggable,
    dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { disableNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview';
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
import { values } from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { dndUtils, DragData, DragOperation, DragTarget } from '/@/shared/types/drag-and-drop';

interface UseDraggableProps {
    drag?: {
        getId: () => string[];
        getItem: () => unknown[];
        onDragStart?: () => void;
        onDrop?: () => void;
        onGenerateDragPreview?: (data: BaseEventPayload<ElementDragType>) => void;
        target: DragTarget | string;
    };
    drop?: {
        canDrop: (args: { source: DragData }) => boolean;
        getData: (args: { element: HTMLElement; input: Input }) => DragData;
        onDrag: (args: { self: DragData }) => void;
        onDragLeave: () => void;
        onDrop: (args: { self: DragData }) => void;
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

        // if (drop) {
        //     functions.push(
        //         dropTargetForElements({
        //             canDrop: (args) => {
        //                 const data = args.source.data as unknown as DragData;
        //                 const isSelf = (args.source.data.id as string[])[0] === option.value;
        //                 return dndUtils.isDropTarget(data.type, [DragTarget.GENERIC]) && !isSelf;
        //             },
        //             element: ref.current,
        //             getData: ({ element, input }) => {
        //                 const data = dndUtils.generateDragData({
        //                     id: [option.value],
        //                     operation: [DragOperation.REORDER],
        //                     type: DragTarget.GENERIC,
        //                 });

        //                 return attachClosestEdge(data, {
        //                     allowedEdges: ['top', 'bottom'],
        //                     element,
        //                     input,
        //                 });
        //             },
        //             onDrag: (args) => {
        //                 const closestEdgeOfTarget: Edge | null = extractClosestEdge(args.self.data);
        //                 setIsDraggedOver(closestEdgeOfTarget);
        //             },
        //             onDragLeave: () => {
        //                 setIsDraggedOver(null);
        //             },
        //             onDrop: (args) => {
        //                 const closestEdgeOfTarget: Edge | null = extractClosestEdge(args.self.data);

        //                 const from = args.source.data.id as string[];
        //                 const to = args.self.data.id as string[];

        //                 const newOrder = dndUtils.reorderById({
        //                     edge: closestEdgeOfTarget,
        //                     idFrom: from[0],
        //                     idTo: to[0],
        //                     list: values,
        //                 });

        //                 onChange(newOrder);
        //                 setIsDraggedOver(null);
        //             },
        //         }),
        //     );
        // }

        return combine(...functions);
    }, [drag, drop, isDragging]);

    return {
        isDragging,
        ref,
    };
};
