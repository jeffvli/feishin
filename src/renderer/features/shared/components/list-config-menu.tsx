import { openContextModal } from '@mantine/modals';
import { ReactNode } from 'react';

import styles from './list-config-menu.module.css';

import i18n from '/@/i18n/i18n';
import { SettingsButton } from '/@/renderer/features/shared/components/settings-button';
import { ActionIconProps } from '/@/shared/components/action-icon/action-icon';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Stack } from '/@/shared/components/stack/stack';
import { Switch } from '/@/shared/components/switch/switch';
import { Table } from '/@/shared/components/table/table';
import { Text } from '/@/shared/components/text/text';
import { ItemListKey, ListDisplayType } from '/@/shared/types/types';

export const SONG_DISPLAY_TYPES: ListConfigMenuDisplayTypeConfig[] = [
    { hidden: true, value: ListDisplayType.DETAIL },
];

export const DISPLAY_TYPES = [
    {
        label: (
            <Group align="center" gap="sm" justify="center" p="sm" wrap="nowrap">
                <Icon icon="layoutTable" size="lg" />
                {i18n.t('table.config.view.table') as string}
            </Group>
        ),
        value: ListDisplayType.TABLE,
    },
    {
        label: (
            <Group align="center" gap="sm" justify="center" p="sm" wrap="nowrap">
                <Icon icon="layoutGrid" size="lg" />
                {i18n.t('table.config.view.grid') as string}
            </Group>
        ),
        value: ListDisplayType.GRID,
    },
    {
        label: (
            <Group align="center" gap="sm" justify="center" p="sm" wrap="nowrap">
                <Icon icon="layoutDetail" size="lg" />
                {i18n.t('table.config.view.detail') as string}
            </Group>
        ),
        value: ListDisplayType.DETAIL,
    },
    // {
    //     disabled: true,
    //     label: (
    //         <Stack align="center" p="sm">
    //             <Icon icon="layoutList" size="lg" />
    //             {i18n.t('table.config.view.list') as string}
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

export interface ListConfigMenuDetailConfig {
    optionsConfig?: ListConfigMenuOptionsConfig['detail'];
    tableColumnsData: { label: string; value: string }[];
    tableKey: 'detail';
}

export interface ListConfigMenuDisplayTypeConfig {
    disabled?: boolean;
    hidden?: boolean;
    value: ListDisplayType;
}

export interface ListConfigMenuFormProps {
    detailConfig?: ListConfigMenuDetailConfig;
    displayTypes?: ListConfigMenuDisplayTypeConfig[];
    listKey: ItemListKey;
    optionsConfig?: ListConfigMenuOptionsConfig;
    tableColumnsData: { label: string; value: string }[];
}

export interface ListConfigMenuOptionConfig {
    disabled?: boolean;
    hidden?: boolean;
}

export interface ListConfigMenuOptionsConfig {
    detail?: {
        [key: string]: ListConfigMenuOptionConfig;
    };
    grid?: {
        [key: string]: ListConfigMenuOptionConfig;
    };
    table?: {
        [key: string]: ListConfigMenuOptionConfig;
    };
}

export interface ListConfigMenuProps extends ListConfigMenuFormProps {
    buttonProps?: ActionIconProps;
}

export const ListConfigMenu = ({ buttonProps, ...formProps }: ListConfigMenuProps) => {
    return (
        <SettingsButton
            {...buttonProps}
            onClick={() => {
                openContextModal({
                    innerProps: formProps,
                    modal: 'listConfigSettings',
                    size: 'xl',
                    withCloseButton: false,
                });
            }}
        />
    );
};

export const ListConfigTable = ({
    options,
}: {
    options: {
        component: ReactNode;
        description?: ReactNode | string;
        id: string;
        isDivider?: boolean;
        isHidden?: boolean;
        label?: ReactNode | string;
    }[];
}) => {
    return (
        <Table
            className={styles.table}
            classNames={{
                td: styles.td,
                th: styles.th,
            }}
            onClick={(e) => e.stopPropagation()}
            variant="vertical"
            withColumnBorders={false}
            withRowBorders={false}
            withTableBorder={false}
        >
            <Table.Tbody>
                {options.map((option) => {
                    if (option.isHidden) {
                        return null;
                    }

                    if (option.isDivider) {
                        return (
                            <Table.Tr key={option.id}>
                                <Table.Td className={styles.dividerCell} colSpan={2}>
                                    <Divider />
                                </Table.Td>
                            </Table.Tr>
                        );
                    }

                    return (
                        <Table.Tr key={option.id}>
                            {(option.label !== undefined || option.description !== undefined) && (
                                <Table.Th>
                                    {option.description !== undefined ? (
                                        <Stack gap="xs">
                                            <Text isNoSelect size="sm">
                                                {option.label}
                                            </Text>
                                            <Text isMuted isNoSelect size="xs">
                                                {option.description}
                                            </Text>
                                        </Stack>
                                    ) : (
                                        option.label
                                    )}
                                </Table.Th>
                            )}
                            <Table.Td>
                                <div className={styles.control}>{option.component}</div>
                            </Table.Td>
                        </Table.Tr>
                    );
                })}
            </Table.Tbody>
        </Table>
    );
};
