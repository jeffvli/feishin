import { ReactNode } from 'react';

import i18n from '/@/i18n/i18n';
import { GridConfig } from '/@/renderer/features/shared/components/grid-config';
import { SettingsButton } from '/@/renderer/features/shared/components/settings-button';
import { TableConfig } from '/@/renderer/features/shared/components/table-config';
import { useSettingsStore, useSettingsStoreActions } from '/@/renderer/store';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Popover } from '/@/shared/components/popover/popover';
import { ScrollArea } from '/@/shared/components/scroll-area/scroll-area';
import { SegmentedControl } from '/@/shared/components/segmented-control/segmented-control';
import { Stack } from '/@/shared/components/stack/stack';
import { Table } from '/@/shared/components/table/table';
import { ItemListKey, ListDisplayType } from '/@/shared/types/types';

const DISPLAY_TYPES = [
    {
        label: (
            <Group align="center" justify="center" p="sm">
                <Icon icon="layoutTable" size="lg" />
                {i18n.t('table.config.view.table', { postProcess: 'sentenceCase' }) as string}
            </Group>
        ),
        value: ListDisplayType.TABLE,
    },
    {
        label: (
            <Group align="center" justify="center" p="sm">
                <Icon icon="layoutGrid" size="lg" />
                {i18n.t('table.config.view.grid', { postProcess: 'sentenceCase' }) as string}
            </Group>
        ),
        value: ListDisplayType.GRID,
    },
    // {
    //     disabled: true,
    //     label: (
    //         <Stack align="center" p="sm">
    //             <Icon icon="layoutList" size="lg" />
    //             {i18n.t('table.config.view.list', { postProcess: 'sentenceCase' }) as string}
    //         </Stack>
    //     ),
    //     value: ListDisplayType.LIST,
    // },
];

export const ListConfigBooleanControl = ({
    onChange,
    value,
}: {
    onChange: (value: boolean) => void;
    value: boolean;
}) => {
    return (
        <SegmentedControl
            data={[
                {
                    label: i18n.t('common.enable', {
                        postProcess: 'sentenceCase',
                    }) as string,
                    value: 'true',
                },
                {
                    label: i18n.t('common.disable', {
                        postProcess: 'sentenceCase',
                    }) as string,
                    value: 'false',
                },
            ]}
            onChange={(value) => onChange(value === 'true' ? true : false)}
            size="sm"
            value={value ? 'true' : 'false'}
            w="100%"
        />
    );
};

interface ListConfigMenuProps {
    listKey: ItemListKey;
    tableColumnsData: { label: string; value: string }[];
}

export const ListConfigMenu = (props: ListConfigMenuProps) => {
    const displayType = useSettingsStore((state) => state.lists[props.listKey].display);
    const { setList } = useSettingsStoreActions();

    return (
        <Popover position="bottom-end" trapFocus width={640}>
            <Popover.Target>
                <SettingsButton />
            </Popover.Target>
            <Popover.Dropdown>
                <ScrollArea
                    allowDragScroll
                    scrollX
                    style={{ height: 'auto', maxHeight: '70dvh', padding: '1rem' }}
                >
                    <Stack>
                        <SegmentedControl
                            data={DISPLAY_TYPES.map((type) => ({
                                ...type,
                            }))}
                            fullWidth
                            onChange={(value) => {
                                setList(props.listKey, {
                                    display: value as ListDisplayType,
                                });
                            }}
                            value={displayType}
                            withItemsBorders={false}
                        />
                        <Config displayType={displayType} {...props} />
                    </Stack>
                </ScrollArea>
            </Popover.Dropdown>
        </Popover>
    );
};

const Config = ({
    displayType,
    ...props
}: ListConfigMenuProps & { displayType: ListDisplayType }) => {
    switch (displayType) {
        case ListDisplayType.GRID:
            return <GridConfig {...props} />;

        case ListDisplayType.TABLE:
            return <TableConfig {...props} />;

        default:
            return null;
    }
};

export const ListConfigTable = ({
    options,
}: {
    options: { component: ReactNode; id: string; label: ReactNode | string }[];
}) => {
    return (
        <Table
            style={{ borderRadius: '1rem' }}
            styles={{ th: { backgroundColor: 'initial', padding: 'var(--theme-spacing-md) 0' } }}
            variant="vertical"
            withColumnBorders={false}
            withRowBorders={false}
            withTableBorder={false}
        >
            <Table.Tbody>
                {options.map((option) => (
                    <Table.Tr key={option.id}>
                        <Table.Th w="50%">{option.label}</Table.Th>
                        <Table.Td p={0}>{option.component}</Table.Td>
                    </Table.Tr>
                ))}
            </Table.Tbody>
        </Table>
    );
};
