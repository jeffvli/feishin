import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { useEffect } from 'react';

import { DragData } from '/@/shared/types/drag-and-drop';

interface UseDragMonitorProps {
    canMonitor?: (source: DragData) => boolean;
    isEnabled?: boolean;
    onDragStart?: (source: DragData) => void;
    onDrop?: () => void;
}

export const useDragMonitor = ({
    canMonitor,
    isEnabled = true,
    onDragStart,
    onDrop,
}: UseDragMonitorProps) => {
    useEffect(() => {
        if (!isEnabled) return;

        return monitorForElements({
            onDragStart: ({ source }) => {
                const data = source.data as unknown as DragData;
                if (canMonitor && !canMonitor(data)) return;
                onDragStart?.(data);
            },
            onDrop: () => {
                onDrop?.();
            },
        });
    }, [canMonitor, isEnabled, onDragStart, onDrop]);
};
