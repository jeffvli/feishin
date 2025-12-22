import { ReactNode, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import i18n from '/@/i18n/i18n';
import { GridConfig } from '/@/renderer/features/shared/components/grid-config';
import { SettingsButton } from '/@/renderer/features/shared/components/settings-button';
import { TableConfig } from '/@/renderer/features/shared/components/table-config';
import { useSettingsStore, useSettingsStoreActions } from '/@/renderer/store';
import { ActionIconProps } from '/@/shared/components/action-icon/action-icon';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Modal } from '/@/shared/components/modal/modal';
import { SegmentedControl } from '/@/shared/components/segmented-control/segmented-control';
import { Stack } from '/@/shared/components/stack/stack';
import { Switch } from '/@/shared/components/switch/switch';
import { Table } from '/@/shared/components/table/table';
import { useDisclosure } from '/@/shared/hooks/use-disclosure';
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
        <Group justify="flex-end" w="100%">
            <Switch checked={value} onChange={(e) => onChange(e.currentTarget.checked)} />
        </Group>
    );
};

export interface ListConfigMenuDisplayTypeConfig {
    disabled?: boolean;
    hidden?: boolean;
    value: ListDisplayType;
}

export interface ListConfigMenuOptionConfig {
    disabled?: boolean;
    hidden?: boolean;
}

export interface ListConfigMenuOptionsConfig {
    grid?: {
        [key: string]: ListConfigMenuOptionConfig;
    };
    table?: {
        [key: string]: ListConfigMenuOptionConfig;
    };
}

interface ListConfigMenuProps {
    buttonProps?: ActionIconProps;
    displayTypes?: ListConfigMenuDisplayTypeConfig[];
    listKey: ItemListKey;
    optionsConfig?: ListConfigMenuOptionsConfig;
    tableColumnsData: { label: string; value: string }[];
}

export const ListConfigMenu = (props: ListConfigMenuProps) => {
    const { t } = useTranslation();
    const displayType = useSettingsStore(
        (state) => state.lists[props.listKey]?.display,
    ) as ListDisplayType;
    const { setList } = useSettingsStoreActions();
    const [isOpen, handlers] = useDisclosure(false);

    // Filter display types based on config
    const availableDisplayTypes = useMemo(() => {
        if (!props.displayTypes) {
            return DISPLAY_TYPES;
        }

        const filtered = DISPLAY_TYPES.map((type) => {
            const config = props.displayTypes?.find((c) => c.value === type.value);
            if (config?.hidden) {
                return null;
            }
            const result: (typeof DISPLAY_TYPES)[0] & { disabled?: boolean } = {
                ...type,
            };
            if (config?.disabled) {
                result.disabled = true;
            }
            return result;
        }).filter((type): type is NonNullable<typeof type> => type !== null);

        return filtered;
    }, [props.displayTypes]);

    return (
        <>
            <SettingsButton {...props.buttonProps} onClick={handlers.toggle} />
            <Modal
                handlers={handlers}
                opened={isOpen}
                size="xl"
                title={t('common.configure', { postProcess: 'sentenceCase' })}
            >
                <Stack gap="xs">
                    {availableDisplayTypes.length > 1 && (
                        <ListConfigTable
                            options={[
                                {
                                    component: (
                                        <SegmentedControl
                                            data={availableDisplayTypes}
                                            fullWidth
                                            onChange={(value) => {
                                                setList(props.listKey, {
                                                    display: value as ListDisplayType,
                                                });
                                            }}
                                            size="sm"
                                            value={displayType}
                                            withItemsBorders={false}
                                        />
                                    ),
                                    id: 'displayType',
                                    label: t('table.config.general.displayType', {
                                        postProcess: 'sentenceCase',
                                    }),
                                },
                            ]}
                        />
                    )}
                    <Config displayType={displayType} {...props} />
                </Stack>
            </Modal>
        </>
    );
};

const Config = ({
    displayType,
    optionsConfig,
    tableColumnsData,
    ...props
}: ListConfigMenuProps & { displayType: ListDisplayType }) => {
    switch (displayType) {
        case ListDisplayType.GRID:
            return (
                <GridConfig
                    {...props}
                    gridRowsData={tableColumnsData}
                    optionsConfig={optionsConfig?.grid}
                />
            );

        case ListDisplayType.TABLE:
            return (
                <TableConfig
                    {...props}
                    optionsConfig={optionsConfig?.table}
                    tableColumnsData={tableColumnsData}
                />
            );

        default:
            return null;
    }
};

export const ListConfigTable = ({
    options,
}: {
    options: { component: ReactNode; id: string; isDivider?: boolean; label: ReactNode | string }[];
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
                {options.map((option) => {
                    if (option.isDivider) {
                        return (
                            <Table.Tr key={option.id}>
                                <Table.Td colSpan={2} px={0} py="md">
                                    <Divider />
                                </Table.Td>
                            </Table.Tr>
                        );
                    }
                    return (
                        <Table.Tr key={option.id}>
                            <Table.Th w="50%">{option.label}</Table.Th>
                            <Table.Td p={0}>{option.component}</Table.Td>
                        </Table.Tr>
                    );
                })}
            </Table.Tbody>
        </Table>
    );
};
