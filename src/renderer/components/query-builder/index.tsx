import { AnimatePresence, motion } from 'motion/react';

import i18n from '/@/i18n/i18n';
import { QueryBuilderOption } from '/@/renderer/components/query-builder/query-builder-option';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { DropdownMenu } from '/@/shared/components/dropdown-menu/dropdown-menu';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Select } from '/@/shared/components/select/select';
import { Stack } from '/@/shared/components/stack/stack';
import { QueryBuilderGroup, QueryBuilderRule } from '/@/shared/types/types';

const FILTER_GROUP_OPTIONS_DATA = [
    {
        label: i18n.t('form.queryEditor.input', {
            context: 'optionMatchAll',
            postProcess: 'sentenceCase',
        }),
        value: 'all',
    },
    {
        label: i18n.t('form.queryEditor.input', {
            context: 'optionMatchAny',
            postProcess: 'sentenceCase',
        }),
        value: 'any',
    },
];

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
    filters: { label: string; type: string; value: string }[];
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
    uniqueId,
}: QueryBuilderProps) => {
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

    return (
        <Stack
            gap="sm"
            ml={`${level * 10}px`}
        >
            <Group gap="sm">
                <Select
                    data={FILTER_GROUP_OPTIONS_DATA}
                    maxWidth={175}
                    onChange={handleChangeType}
                    size="sm"
                    value={data.type}
                    width="20%"
                />
                <ActionIcon
                    icon="add"
                    onClick={handleAddRule}
                    size="sm"
                    variant="subtle"
                />
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
                            Add rule group
                        </DropdownMenu.Item>

                        {level > 0 && (
                            <DropdownMenu.Item
                                leftSection={<Icon icon="delete" />}
                                onClick={handleDeleteRuleGroup}
                            >
                                Remove rule group
                            </DropdownMenu.Item>
                        )}
                        {level === 0 && (
                            <>
                                <DropdownMenu.Divider />
                                <DropdownMenu.Item
                                    isDanger
                                    leftSection={
                                        <Icon
                                            color="error"
                                            icon="refresh"
                                        />
                                    }
                                    onClick={onResetFilters}
                                >
                                    Reset to default
                                </DropdownMenu.Item>
                                <DropdownMenu.Item
                                    isDanger
                                    leftSection={
                                        <Icon
                                            color="error"
                                            icon="delete"
                                        />
                                    }
                                    onClick={onClearFilters}
                                >
                                    Clear filters
                                </DropdownMenu.Item>
                            </>
                        )}
                    </DropdownMenu.Dropdown>
                </DropdownMenu>
            </Group>
            <AnimatePresence initial={false}>
                {data?.rules?.map((rule: QueryBuilderRule) => (
                    <motion.div
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -25 }}
                        initial={{ opacity: 0, x: -25 }}
                        key={rule.uniqueId}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                    >
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
                    </motion.div>
                ))}
            </AnimatePresence>
            {data?.group && (
                <AnimatePresence initial={false}>
                    {data.group?.map((group: QueryBuilderGroup, index: number) => (
                        <motion.div
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -25 }}
                            initial={{ opacity: 0, x: -25 }}
                            key={group.uniqueId}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                        >
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
                        </motion.div>
                    ))}
                </AnimatePresence>
            )}
        </Stack>
    );
};
