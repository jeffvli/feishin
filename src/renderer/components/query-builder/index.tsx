import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { QueryBuilderOption } from '/@/renderer/components/query-builder/query-builder-option';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Box } from '/@/shared/components/box/box';
import { DropdownMenu } from '/@/shared/components/dropdown-menu/dropdown-menu';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Select } from '/@/shared/components/select/select';
import { Stack } from '/@/shared/components/stack/stack';
import { QueryBuilderGroup, QueryBuilderRule } from '/@/shared/types/types';

export type FilterGroup = { group: string; items: FilterItem[] };

export type FilterItem = { label: string; type: string; value: string };

export type Filters = FilterGroup[] | FilterItem[];
type AddArgs = {
    groupIndex: number[];
    level: number;
};
type DeleteArgs = {
    groupIndex: number[];
    level: number;
    uniqueId: string;
};

interface QueryBuilderProps {
    data: Record<string, any>;
    filters: Filters;
    groupIndex: number[];
    level: number;
    onAddRule: (args: AddArgs) => void;
    onAddRuleGroup: (args: AddArgs) => void;
    onChangeField: (args: any) => void;
    onChangeOperator: (args: any) => void;
    onChangeType: (args: any) => void;
    onChangeValue: (args: any) => void;
    onClearFilters: () => void;
    onDeleteRule: (args: DeleteArgs) => void;
    onDeleteRuleGroup: (args: DeleteArgs) => void;
    onResetFilters: () => void;
    operators: {
        boolean: { label: string; value: string }[];
        date: { label: string; value: string }[];
        number: { label: string; value: string }[];
        playlist: { label: string; value: string }[];
        string: { label: string; value: string }[];
    };
    playlists?: { label: string; value: string }[];
    saveActions?: React.ReactNode;
    uniqueId: string;
}

export const QueryBuilder = ({
    data,
    filters,
    groupIndex,
    level,
    onAddRule,
    onAddRuleGroup,
    onChangeField,
    onChangeOperator,
    onChangeType,
    onChangeValue,
    onClearFilters,
    onDeleteRule,
    onDeleteRuleGroup,
    onResetFilters,
    operators,
    playlists,
    saveActions,
    uniqueId,
}: QueryBuilderProps) => {
    const { t } = useTranslation();

    const FILTER_GROUP_OPTIONS_DATA = [
        {
            label: t('form.queryEditor.input', {
                context: 'optionMatchAll',
                postProcess: 'sentenceCase',
            }),
            value: 'all',
        },
        {
            label: t('form.queryEditor.input', {
                context: 'optionMatchAny',
                postProcess: 'sentenceCase',
            }),
            value: 'any',
        },
    ];

    const handleAddRule = () => {
        onAddRule({ groupIndex, level });
    };

    const handleAddRuleGroup = () => {
        onAddRuleGroup({ groupIndex, level });
    };

    const handleDeleteRuleGroup = () => {
        onDeleteRuleGroup({ groupIndex, level, uniqueId });
    };

    const handleChangeType = (value: null | string) => {
        onChangeType({ groupIndex, level, value });
    };

    const boxStyle = useMemo(
        () => ({
            border: '1px solid var(--theme-colors-border)',
            borderRadius: 'var(--theme-radius-md)',
            marginLeft: level > 0 ? '20px' : '0px',
        }),
        [level],
    );

    return (
        <Box p="md" style={boxStyle}>
            <Stack gap="sm">
                <Group gap="sm" justify="space-between" wrap="nowrap">
                    <Group gap="sm" wrap="nowrap">
                        <Select
                            data={FILTER_GROUP_OPTIONS_DATA}
                            maxWidth={170}
                            onChange={handleChangeType}
                            size="sm"
                            value={data.type}
                        />
                        <ActionIcon icon="add" onClick={handleAddRule} size="sm" variant="subtle" />
                        <DropdownMenu position="bottom-start">
                            <DropdownMenu.Target>
                                <ActionIcon
                                    icon="ellipsisVertical"
                                    size="sm"
                                    style={{
                                        padding: 0,
                                    }}
                                    variant="subtle"
                                />
                            </DropdownMenu.Target>
                            <DropdownMenu.Dropdown>
                                <DropdownMenu.Item
                                    leftSection={<Icon icon="add" />}
                                    onClick={handleAddRuleGroup}
                                >
                                    {t('form.queryEditor.addRuleGroup', {
                                        postProcess: 'sentenceCase',
                                    })}
                                </DropdownMenu.Item>

                                {level > 0 && (
                                    <DropdownMenu.Item
                                        leftSection={<Icon icon="delete" />}
                                        onClick={handleDeleteRuleGroup}
                                    >
                                        {t('form.queryEditor.removeRuleGroup', {
                                            postProcess: 'sentenceCase',
                                        })}
                                    </DropdownMenu.Item>
                                )}
                                {level === 0 && (
                                    <>
                                        <DropdownMenu.Divider />
                                        <DropdownMenu.Item
                                            isDanger
                                            leftSection={<Icon color="error" icon="refresh" />}
                                            onClick={onResetFilters}
                                        >
                                            {t('form.queryEditor.resetToDefault', {
                                                postProcess: 'sentenceCase',
                                            })}
                                        </DropdownMenu.Item>
                                        <DropdownMenu.Item
                                            isDanger
                                            leftSection={<Icon color="error" icon="delete" />}
                                            onClick={onClearFilters}
                                        >
                                            {t('form.queryEditor.clearFilters', {
                                                postProcess: 'sentenceCase',
                                            })}
                                        </DropdownMenu.Item>
                                    </>
                                )}
                            </DropdownMenu.Dropdown>
                        </DropdownMenu>
                    </Group>
                    {level === 0 && saveActions}
                </Group>
                {data?.rules?.map((rule: QueryBuilderRule) => (
                    <div key={rule.uniqueId}>
                        <QueryBuilderOption
                            data={rule}
                            filters={filters}
                            groupIndex={groupIndex || []}
                            level={level}
                            noRemove={data?.rules?.length === 1}
                            onChangeField={onChangeField}
                            onChangeOperator={onChangeOperator}
                            onChangeValue={onChangeValue}
                            onDeleteRule={onDeleteRule}
                            operators={operators}
                            selectData={playlists}
                        />
                    </div>
                ))}
                {data?.group && (
                    <>
                        {data.group?.map((group: QueryBuilderGroup, index: number) => (
                            <div key={group.uniqueId}>
                                <QueryBuilder
                                    data={group}
                                    filters={filters}
                                    groupIndex={[...(groupIndex || []), index]}
                                    level={level + 1}
                                    onAddRule={onAddRule}
                                    onAddRuleGroup={onAddRuleGroup}
                                    onChangeField={onChangeField}
                                    onChangeOperator={onChangeOperator}
                                    onChangeType={onChangeType}
                                    onChangeValue={onChangeValue}
                                    onClearFilters={onClearFilters}
                                    onDeleteRule={onDeleteRule}
                                    onDeleteRuleGroup={onDeleteRuleGroup}
                                    onResetFilters={onResetFilters}
                                    operators={operators}
                                    playlists={playlists}
                                    uniqueId={group.uniqueId}
                                />
                            </div>
                        ))}
                    </>
                )}
            </Stack>
        </Box>
    );
};
