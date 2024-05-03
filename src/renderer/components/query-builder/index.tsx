import { Group, Stack } from '@mantine/core';
import { Select } from '/@/renderer/components/select';
import { AnimatePresence, motion } from 'framer-motion';
import { RiAddFill, RiAddLine, RiDeleteBinFill, RiMore2Line, RiRestartLine } from 'react-icons/ri';
import { Button } from '/@/renderer/components/button';
import { DropdownMenu } from '/@/renderer/components/dropdown-menu';
import { QueryBuilderOption } from '/@/renderer/components/query-builder/query-builder-option';
import { QueryBuilderGroup, QueryBuilderRule } from '/@/renderer/types';
import i18n from '/@/i18n/i18n';

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
    level,
    onAddRule,
    onDeleteRuleGroup,
    onDeleteRule,
    onAddRuleGroup,
    onChangeType,
    onChangeField,
    operators,
    onChangeOperator,
    onChangeValue,
    onClearFilters,
    onResetFilters,
    playlists,
    groupIndex,
    uniqueId,
    filters,
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

    const handleChangeType = (value: string | null) => {
        onChangeType({ groupIndex, level, value });
    };

    return (
        <Stack
            ml={`${level * 10}px`}
            spacing="sm"
        >
            <Group spacing="sm">
                <Select
                    data={FILTER_GROUP_OPTIONS_DATA}
                    maxWidth={175}
                    size="sm"
                    value={data.type}
                    width="20%"
                    onChange={handleChangeType}
                />
                <Button
                    px={5}
                    size="sm"
                    tooltip={{ label: 'Add rule' }}
                    variant="default"
                    onClick={handleAddRule}
                >
                    <RiAddLine size={20} />
                </Button>
                <DropdownMenu position="bottom-start">
                    <DropdownMenu.Target>
                        <Button
                            p={0}
                            size="sm"
                            variant="subtle"
                        >
                            <RiMore2Line size={20} />
                        </Button>
                    </DropdownMenu.Target>
                    <DropdownMenu.Dropdown>
                        <DropdownMenu.Item
                            icon={<RiAddFill />}
                            onClick={handleAddRuleGroup}
                        >
                            Add rule group
                        </DropdownMenu.Item>

                        {level > 0 && (
                            <DropdownMenu.Item
                                icon={<RiDeleteBinFill />}
                                onClick={handleDeleteRuleGroup}
                            >
                                Remove rule group
                            </DropdownMenu.Item>
                        )}
                        {level === 0 && (
                            <>
                                <DropdownMenu.Divider />
                                <DropdownMenu.Item
                                    $danger
                                    icon={<RiRestartLine color="var(--danger-color)" />}
                                    onClick={onResetFilters}
                                >
                                    Reset to default
                                </DropdownMenu.Item>
                                <DropdownMenu.Item
                                    $danger
                                    icon={<RiDeleteBinFill color="var(--danger-color)" />}
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
                        key={rule.uniqueId}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -25 }}
                        initial={{ opacity: 0, x: -25 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                    >
                        <QueryBuilderOption
                            data={rule}
                            filters={filters}
                            groupIndex={groupIndex || []}
                            level={level}
                            noRemove={data?.rules?.length === 1}
                            operators={operators}
                            selectData={playlists}
                            onChangeField={onChangeField}
                            onChangeOperator={onChangeOperator}
                            onChangeValue={onChangeValue}
                            onDeleteRule={onDeleteRule}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
            {data?.group && (
                <AnimatePresence initial={false}>
                    {data.group?.map((group: QueryBuilderGroup, index: number) => (
                        <motion.div
                            key={group.uniqueId}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -25 }}
                            initial={{ opacity: 0, x: -25 }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                        >
                            <QueryBuilder
                                data={group}
                                filters={filters}
                                groupIndex={[...(groupIndex || []), index]}
                                level={level + 1}
                                operators={operators}
                                playlists={playlists}
                                uniqueId={group.uniqueId}
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
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            )}
        </Stack>
    );
};
