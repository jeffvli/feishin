import { useTranslation } from 'react-i18next';

import i18n from '/@/i18n/i18n';
import { SettingsButton } from '/@/renderer/features/shared/components/settings-button';
import { CheckboxSelect } from '/@/shared/components/checkbox-select/checkbox-select';
import { Icon } from '/@/shared/components/icon/icon';
import { Popover } from '/@/shared/components/popover/popover';
import { ScrollArea } from '/@/shared/components/scroll-area/scroll-area';
import { SegmentedControl } from '/@/shared/components/segmented-control/segmented-control';
import { Slider } from '/@/shared/components/slider/slider';
import { Stack } from '/@/shared/components/stack/stack';
import { Switch } from '/@/shared/components/switch/switch';
import { Table } from '/@/shared/components/table/table';
import { ListDisplayType } from '/@/shared/types/types';

const DISPLAY_TYPES = [
    {
        label: (
            <Stack
                align="center"
                p="sm"
            >
                <Icon
                    icon="layoutTable"
                    size="lg"
                />
                {i18n.t('table.config.view.table', { postProcess: 'sentenceCase' }) as string}
            </Stack>
        ),
        value: ListDisplayType.TABLE,
    },
    {
        label: (
            <Stack
                align="center"
                p="sm"
            >
                <Icon
                    icon="layoutGrid"
                    size="lg"
                />
                {i18n.t('table.config.view.card', { postProcess: 'sentenceCase' }) as string}
            </Stack>
        ),
        value: ListDisplayType.GRID,
    },
    {
        disabled: true,
        label: (
            <Stack
                align="center"
                p="sm"
            >
                <Icon
                    icon="layoutList"
                    size="lg"
                />
                {i18n.t('table.config.view.list', { postProcess: 'sentenceCase' }) as string}
            </Stack>
        ),
        value: ListDisplayType.LIST,
    },
];

interface ListConfigMenuProps {
    autoFitColumns?: boolean;
    disabledViewTypes?: ListDisplayType[];
    displayType: ListDisplayType;
    itemGap?: number;
    itemSize?: number;
    onChangeAutoFitColumns?: (autoFitColumns: boolean) => void;
    onChangeDisplayType?: (displayType: ListDisplayType) => void;
    onChangeItemGap?: (itemGap: number) => void;
    onChangeItemSize?: (itemSize: number) => void;
    onChangeTableColumns?: (tableColumns: string[]) => void;
    tableColumns?: string[];
    tableColumnsData?: { label: string; value: string }[];
}

export const ListConfigMenu = (props: ListConfigMenuProps) => {
    return (
        <Popover
            position="bottom-end"
            width={300}
        >
            <Popover.Target>
                <SettingsButton />
            </Popover.Target>
            <Popover.Dropdown p="md">
                <Stack>
                    <SegmentedControl
                        data={DISPLAY_TYPES.map((type) => ({
                            ...type,
                            disabled: props.disabledViewTypes?.includes(type.value),
                        }))}
                        onChange={(value) => props.onChangeDisplayType?.(value as ListDisplayType)}
                        value={props.displayType}
                        w="100%"
                        withItemsBorders={false}
                    />
                    <Config {...props} />
                </Stack>
            </Popover.Dropdown>
        </Popover>
    );
};

const Config = (props: ListConfigMenuProps) => {
    switch (props.displayType) {
        case ListDisplayType.GRID:
            return <GridConfig {...props} />;

        case ListDisplayType.TABLE:
            return <TableConfig {...props} />;

        default:
            return null;
    }
};

type TableConfigProps = Pick<
    ListConfigMenuProps,
    | 'autoFitColumns'
    | 'itemSize'
    | 'onChangeAutoFitColumns'
    | 'onChangeItemSize'
    | 'onChangeTableColumns'
    | 'tableColumns'
    | 'tableColumnsData'
>;

const TableConfig = ({
    autoFitColumns,
    itemSize,
    onChangeAutoFitColumns,
    onChangeItemSize,
    onChangeTableColumns,
    tableColumns,
    tableColumnsData,
}: TableConfigProps) => {
    const { t } = useTranslation();

    if (
        !tableColumnsData ||
        !onChangeTableColumns ||
        !tableColumns ||
        !onChangeItemSize ||
        autoFitColumns === undefined ||
        !onChangeAutoFitColumns ||
        itemSize === undefined
    ) {
        console.error('TableConfig: Missing required props', {
            itemSize,
            onChangeItemSize,
            onChangeTableColumns,
            tableColumns,
            tableColumnsData,
        });
        return null;
    }

    return (
        <>
            <Table
                variant="vertical"
                withColumnBorders
                withRowBorders
                withTableBorder
            >
                <Table.Tbody>
                    <Table.Tr>
                        <Table.Th>
                            {t('table.config.general.size', {
                                postProcess: 'sentenceCase',
                            })}
                        </Table.Th>
                        <Table.Td>
                            <Slider
                                defaultValue={itemSize}
                                max={100}
                                min={30}
                                onChangeEnd={onChangeItemSize}
                            />
                        </Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                        <Table.Th w="50%">
                            {t('table.config.general.autoFitColumns', {
                                postProcess: 'sentenceCase',
                            })}
                        </Table.Th>
                        <Table.Td style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Switch
                                defaultChecked={autoFitColumns}
                                onChange={(e) => onChangeAutoFitColumns?.(e.target.checked)}
                                size="xs"
                            />
                        </Table.Td>
                    </Table.Tr>
                </Table.Tbody>
            </Table>
            <ScrollArea
                allowDragScroll
                style={{ maxHeight: '200px' }}
            >
                <CheckboxSelect
                    data={tableColumnsData}
                    onChange={onChangeTableColumns}
                    value={tableColumns}
                />
            </ScrollArea>
        </>
    );
};

type GridConfigProps = Pick<
    ListConfigMenuProps,
    'itemGap' | 'itemSize' | 'onChangeItemGap' | 'onChangeItemSize'
>;

const GridConfig = ({ itemSize, onChangeItemGap, onChangeItemSize }: GridConfigProps) => {
    const { t } = useTranslation();

    if (!onChangeItemGap || !onChangeItemSize || !itemSize) {
        return null;
    }

    return (
        <>
            <Table
                variant="vertical"
                withColumnBorders
                withRowBorders
                withTableBorder
            >
                <Table.Tbody>
                    <Table.Tr>
                        <Table.Th w="50%">
                            {t('table.config.general.gap', {
                                postProcess: 'sentenceCase',
                            })}
                        </Table.Th>
                        <Table.Td>
                            <Slider
                                defaultValue={itemSize}
                                max={30}
                                min={0}
                                onChangeEnd={onChangeItemGap}
                            />
                        </Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                        <Table.Th w="50%">
                            {t('table.config.general.size', {
                                postProcess: 'sentenceCase',
                            })}
                        </Table.Th>
                        <Table.Td>
                            <Slider
                                defaultValue={itemSize}
                                max={300}
                                min={135}
                                onChangeEnd={onChangeItemSize}
                            />
                        </Table.Td>
                    </Table.Tr>
                </Table.Tbody>
            </Table>
        </>
    );
};
