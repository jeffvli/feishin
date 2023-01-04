import { Group, Stack } from '@mantine/core';
import { Select } from '/@/renderer/components/select';
import { FilterGroupType } from '/@/renderer/types';
import { AnimatePresence, motion } from 'framer-motion';
import { RiAddLine, RiMore2Line } from 'react-icons/ri';
import { Button } from '/@/renderer/components/button';
import { DropdownMenu } from '/@/renderer/components/dropdown-menu';
import { QueryBuilderOption } from '/@/renderer/components/query-builder/query-builder-option';

export type AdvancedFilterGroup = {
  children: AdvancedFilterGroup[];
  rules: AdvancedFilterRule[];
  type: FilterGroupType;
  uniqueId: string;
};

export type AdvancedFilterRule = {
  field?: string | null;
  operator?: string | null;
  uniqueId: string;
  value?: string | number | Date | undefined | null | any;
};

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

// const queryJson = [
//   {
//     any: [{ is: { loved: true } }, { gt: { rating: 3 } }],
//   },
//   { inTheRange: { year: [1981, 1990] } },
// ];

// const parseQuery = (query: Record<string, any>[]) => {
//   // for (const ruleset in query) {
//   //   // console.log('key', key);
//   //   // console.log('query[key]', query[key]);
//   //   // console.log('Object.keys(query[key])', Object.keys(query[key]));
//   //   // console.log('Object.values(query[key])', Object.values(query[key]));
//   //   // console.log('Object.entries(query[key])', Object.entries(query[key]));

//   //   const keys = Object.keys(query[ruleset]);
//   // }

//   const res = flatMapDeep(query, flatten);
//   console.log('res', res);

//   return res;
// };

// const OperatorSelect = ({ value, onChange }: any) => {
//   const handleChange = (e: any) => {
//     onChange(e);
//   };

//   return (
//     <Select
//       data={operators}
//       label="Operator"
//       value={value}
//       onChange={handleChange}
//     />
//   );
// };

type AddArgs = {
  groupIndex: number[];
  groupValue: string;
  level: number;
};

type DeleteArgs = {
  groupIndex: number[];
  groupValue: string;
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
  const groupValue = Object.keys(data)[0];
  const rules = data[groupValue].filter((rule: any) => !rule.any && !rule.all);
  const group = data[groupValue].filter((rule: any) => rule.any || rule.all);

  const handleAddRule = () => {
    onAddRule({ groupIndex, groupValue, level });
  };

  const handleAddRuleGroup = () => {
    onAddRuleGroup({ groupIndex, groupValue, level });
  };

  const handleDeleteRuleGroup = () => {
    onDeleteRuleGroup({ groupIndex, groupValue, level, uniqueId });
  };

  const handleChangeType = (value: string | null) => {
    onChangeType({ groupIndex, level, value });
  };

  console.log('rules :>> ', rules);

  return (
    <Stack ml={`${level * 10}px`}>
      <Group>
        <Select
          data={FILTER_GROUP_OPTIONS_DATA}
          maxWidth={175}
          size="xs"
          value={groupValue}
          width="20%"
          onChange={handleChangeType}
        />
        <Button
          px={5}
          size="xs"
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
              size="xs"
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
        {rules.map((rule: AdvancedFilterRule, i: number) => (
          <motion.div
            key={`rule-${level}-${Object.keys(rule)[0]}`}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -25 }}
            initial={{ opacity: 0, x: -25 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <QueryBuilderOption
              data={rule}
              filters={filters}
              groupIndex={groupIndex || []}
              groupValue={groupValue}
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
      {group && (
        <AnimatePresence
          key="advanced-filter-group"
          initial={false}
        >
          {group.map((group: AdvancedFilterGroup, index: number) => (
            <motion.div
              key={`group-${level}-${index}`}
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
