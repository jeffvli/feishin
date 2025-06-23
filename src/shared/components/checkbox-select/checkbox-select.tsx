import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';

import {
    attachClosestEdge,
    extractClosestEdge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import {
    draggable,
    dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { disableNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';

import styles from './checkbox-select.module.css';

import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Checkbox } from '/@/shared/components/checkbox/checkbox';
import { dndUtils, DragData, DragOperation, DragTarget } from '/@/shared/types/drag-and-drop';

interface CheckboxSelectProps {
    data: { label: string; value: string }[];
    enableDrag?: boolean;
    onChange: (value: string[]) => void;
    value: string[];
}

export const CheckboxSelect = ({ data, enableDrag, onChange, value }: CheckboxSelectProps) => {
    const handleChange = (values: string[]) => {
        onChange(values);
    };

    return (
        <div className={styles.container}>
            {data.map((option) => (
                <CheckboxSelectItem
                    enableDrag={enableDrag}
                    key={option.value}
                    onChange={handleChange}
                    option={option}
                    values={value}
                />
            ))}
        </div>
    );
};

interface CheckboxSelectItemProps {
    enableDrag?: boolean;
    onChange: (values: string[]) => void;
    option: { label: string; value: string };
    values: string[];
}

function CheckboxSelectItem({ enableDrag, onChange, option, values }: CheckboxSelectItemProps) {
    const ref = useRef<HTMLInputElement | null>(null);
    const dragHandleRef = useRef<HTMLButtonElement | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isDraggedOver, setIsDraggedOver] = useState<Edge | null>(null);

    useEffect(() => {
        if (!ref.current || !dragHandleRef.current || !enableDrag) {
            return;
        }

        return combine(
            draggable({
                element: dragHandleRef.current,
                getInitialData: () => {
                    const data = dndUtils.generateDragData({
                        id: [option.value],
                        operation: [DragOperation.REORDER],
                        type: DragTarget.GENERIC,
                    });
                    return data;
                },
                onDragStart: () => {
                    setIsDragging(true);
                },
                onDrop: () => {
                    setIsDragging(false);
                },
                onGenerateDragPreview: (data) => {
                    disableNativeDragPreview({ nativeSetDragImage: data.nativeSetDragImage });
                },
            }),
            dropTargetForElements({
                canDrop: (args) => {
                    const data = args.source.data as unknown as DragData;
                    const isSelf = (args.source.data.id as string[])[0] === option.value;
                    return dndUtils.isDropTarget(data.type, [DragTarget.GENERIC]) && !isSelf;
                },
                element: ref.current,
                getData: ({ element, input }) => {
                    const data = dndUtils.generateDragData({
                        id: [option.value],
                        operation: [DragOperation.REORDER],
                        type: DragTarget.GENERIC,
                    });

                    return attachClosestEdge(data, {
                        allowedEdges: ['top', 'bottom'],
                        element,
                        input,
                    });
                },
                onDrag: (args) => {
                    const closestEdgeOfTarget: Edge | null = extractClosestEdge(args.self.data);
                    setIsDraggedOver(closestEdgeOfTarget);
                },
                onDragLeave: () => {
                    setIsDraggedOver(null);
                },
                onDrop: (args) => {
                    const closestEdgeOfTarget: Edge | null = extractClosestEdge(args.self.data);

                    const from = args.source.data.id as string[];
                    const to = args.self.data.id as string[];

                    const newOrder = dndUtils.reorderById({
                        edge: closestEdgeOfTarget,
                        idFrom: from[0],
                        idTo: to[0],
                        list: values,
                    });

                    onChange(newOrder);
                    setIsDraggedOver(null);
                },
            }),
        );
    }, [values, enableDrag, onChange, option.value]);

    return (
        <div
            className={clsx(styles.item, {
                [styles.draggedOverBottom]: isDraggedOver === 'bottom',
                [styles.draggedOverTop]: isDraggedOver === 'top',
                [styles.dragging]: isDragging,
            })}
            ref={ref}
        >
            {enableDrag && (
                <ActionIcon
                    className={styles.dragHandle}
                    icon="dragVertical"
                    ref={dragHandleRef}
                    size="xs"
                    variant="default"
                />
            )}
            <Checkbox
                checked={values.includes(option.value)}
                label={option.label}
                onChange={(e) => {
                    onChange(
                        e.target.checked
                            ? [...values, option.value]
                            : values.filter((v) => v !== option.value),
                    );
                }}
                variant="filled"
            />
        </div>
    );
}
