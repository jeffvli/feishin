import { Group, Stack } from '@mantine/core';
import { Select } from '/@/renderer/components/select';
import { AnimatePresence, motion } from 'framer-motion';
import { RiAddLine, RiMore2Line } from 'react-icons/ri';
import { Button } from '/@/renderer/components/button';
import { DropdownMenu } from '/@/renderer/components/dropdown-menu';
import { QueryBuilderOption } from '/@/renderer/components/query-builder/query-builder-option';
import { QueryBuilderGroup, QueryBuilderRule } from '/@/renderer/types';

const FILTER_GROUP_OPTIONS_DATA = [
  {
    label: 'Match all',
    value: 'all',
  },
  {
    label: 'Match any',
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
  filters: { label: string; value: string }[];
  groupIndex: number[];
  level: number;
  onAddRule: (args: AddArgs) => void;
  onAddRuleGroup: (args: AddArgs) => void;
  onChangeField: (args: any) => void;
  onChangeOperator: (args: any) => void;
  onChangeType: (args: any) => void;
  onChangeValue: (args: any) => void;
  onDeleteRule: (args: DeleteArgs) => void;
  onDeleteRuleGroup: (args: DeleteArgs) => void;
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
  onChangeOperator,
  onChangeValue,
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
    <Stack ml={`${level * 10}px`}>
      <Group>
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
        <DropdownMenu>
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
            <DropdownMenu.Item onClick={handleAddRuleGroup}>Add rule group</DropdownMenu.Item>
            {level > 0 && (
              <DropdownMenu.Item onClick={handleDeleteRuleGroup}>
                Remove rule group
              </DropdownMenu.Item>
            )}
          </DropdownMenu.Dropdown>
        </DropdownMenu>
      </Group>
      <AnimatePresence
        key="advanced-filter-option"
        initial={false}
      >
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
              // groupValue={groupValue}
              level={level}
              noRemove={data?.rules?.length === 1}
              onChangeField={onChangeField}
              onChangeOperator={onChangeOperator}
              onChangeValue={onChangeValue}
              onDeleteRule={onDeleteRule}
            />
          </motion.div>
        ))}
      </AnimatePresence>
      {data?.group && (
        <AnimatePresence
          key="advanced-filter-group"
          initial={false}
        >
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
                uniqueId={group.uniqueId}
                onAddRule={onAddRule}
                onAddRuleGroup={onAddRuleGroup}
                onChangeField={onChangeField}
                onChangeOperator={onChangeOperator}
                onChangeType={onChangeType}
                onChangeValue={onChangeValue}
                onDeleteRule={onDeleteRule}
                onDeleteRuleGroup={onDeleteRuleGroup}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </Stack>
  );
};
