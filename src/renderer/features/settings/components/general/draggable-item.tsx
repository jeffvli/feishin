import { Group } from '@mantine/core';
import { useDragControls, Reorder, DragControls } from 'framer-motion';
import { MdDragIndicator } from 'react-icons/md';
import { Checkbox } from '/@/renderer/components';

const DragHandle = ({ dragControls }: { dragControls: DragControls }) => {
    return (
        <MdDragIndicator
            color="white"
            style={{ cursor: 'grab' }}
            onPointerDown={(event) => dragControls.start(event)}
        />
    );
};

interface SidebarItem {
    disabled: boolean;
    id: string;
}

export interface DraggableItemProps {
    handleChangeDisabled: (id: string, e: boolean) => void;
    item: SidebarItem;
    value: string;
}

export const DraggableItem = ({ item, value, handleChangeDisabled }: DraggableItemProps) => {
    const dragControls = useDragControls();

    return (
        <Reorder.Item
            as="div"
            dragControls={dragControls}
            dragListener={false}
            value={item}
        >
            <Group
                noWrap
                h="3rem"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,.1)' }}
            >
                <Checkbox
                    checked={!item.disabled}
                    onChange={(e) => handleChangeDisabled(item.id, e.target.checked)}
                />
                <DragHandle dragControls={dragControls} />
                {value}
            </Group>
        </Reorder.Item>
    );
};
