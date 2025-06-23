import { DragControls, Reorder, useDragControls } from 'motion/react';

import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Checkbox } from '/@/shared/components/checkbox/checkbox';
import { Group } from '/@/shared/components/group/group';
import { Text } from '/@/shared/components/text/text';

const DragHandle = ({ dragControls }: { dragControls: DragControls }) => {
    return (
        <ActionIcon
            icon="dragVertical"
            iconProps={{
                size: 'md',
            }}
            onPointerDown={(event) => dragControls.start(event)}
            size="xs"
            style={{ cursor: 'grab' }}
            variant="transparent"
        />
    );
};

export interface DraggableItemProps {
    handleChangeDisabled: (id: string, e: boolean) => void;
    item: SidebarItem;
    value: string;
}

interface SidebarItem {
    disabled: boolean;
    id: string;
}

export const DraggableItem = ({ handleChangeDisabled, item, value }: DraggableItemProps) => {
    const dragControls = useDragControls();

    return (
        <Reorder.Item
            as="div"
            dragControls={dragControls}
            dragListener={false}
            value={item}
        >
            <Group
                py="md"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,.1)' }}
                wrap="nowrap"
            >
                <Checkbox
                    checked={!item.disabled}
                    onChange={(e) => handleChangeDisabled(item.id, e.target.checked)}
                    size="xs"
                />
                <DragHandle dragControls={dragControls} />
                <Text>{value}</Text>
            </Group>
        </Reorder.Item>
    );
};
