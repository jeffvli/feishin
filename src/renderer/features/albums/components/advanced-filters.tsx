import { Box, Stack, Group } from '@mantine/core';
import dayjs from 'dayjs';
import get from 'lodash/get';
import set from 'lodash/set';
import { nanoid } from 'nanoid/non-secure';
import { RiAddLine, RiMore2Line, RiSubtractLine } from 'react-icons/ri';
import {
  Button,
  DatePicker,
  DropdownMenu,
  NumberInput,
  Select,
  TextInput,
} from '@/renderer/components';

export enum FilterGroupType {
  AND = 'AND',
  OR = 'OR',
}

export type AdvancedFilterRule = {
  field: string | null;
  operator: string | null;
  uniqueId: string;
  value: string | number | Date | undefined | null | any;
};

export type AdvancedFilterGroup = {
  group: AdvancedFilterGroup[];
  rules: AdvancedFilterRule[];
  type: FilterGroupType;
  uniqueId: string;
};

const DATE_FILTER_OPTIONS_DATA = [
  { label: 'is before', value: '<' },
  { label: 'is after', value: '>' },
  { label: 'is before or equal to', value: '<=' },
  { label: 'is after or equal to', value: '>=' },
];

const STRING_FILTER_OPTIONS_DATA = [
  { label: 'contains', value: '~' },
  { label: 'does not contain', value: '!~' },
  { label: 'is', value: '=' },
  { label: 'is not', value: '!=' },
  { label: 'starts with', value: '^' },
  { label: 'ends with', value: '$' },
];

const NUMBER_FILTER_OPTIONS_DATA = [
  { label: 'is', value: '=' },
  { label: 'is not', value: '!=' },
  { label: 'is greater than', value: '>' },
  { label: 'is less than', value: '<' },
  { label: 'is greater than or equal to', value: '>=' },
  { label: 'is less than or equal to', value: '<=' },
];

const ID_FILTER_OPTIONS_DATA = [
  { label: 'is', value: 'equals' },
  { label: 'is not', value: 'not' },
];

const FILTER_GROUP_OPTIONS_DATA = [
  {
    label: 'Match all',
    value: FilterGroupType.AND,
  },
  {
    label: 'Match any',
    value: FilterGroupType.OR,
  },
];

const FILTER_OPTIONS_DATA = [
  {
    label: 'Artist Name',
    value: 'artists.name',
  },
  {
    label: 'Artist Rating',
    value: 'artists.ratings.value',
  },
  {
    label: 'Artist Genre',
    value: 'artists.genre',
  },
  {
    label: 'Album Artist Name',
    value: 'albumArtists.name',
  },
  {
    label: 'Album Artist Rating',
    value: 'albumArtists.ratings.value',
  },
  {
    label: 'Album Artist Genre',
    value: 'albumArtists.genre',
  },
  {
    label: 'Album Name',
    value: 'albums.name',
  },
  {
    label: 'Album Genre',
    value: 'albums.genre',
  },
  {
    label: 'Album Rating',
    value: 'albums.ratings.value',
  },
  {
    label: 'Album Year',
    value: 'albums.year',
  },
  {
    label: 'Album Release Date',
    value: 'albums.releaseDate',
  },
  {
    label: 'Album Plays',
    value: 'albums.playCount',
  },
  {
    label: 'Album Date Added',
    value: 'albums.dateAdded',
  },
  {
    label: 'Track Name',
    value: 'songs.name',
  },
  {
    label: 'Track Plays',
    value: 'songs.playCount',
  },
  {
    label: 'Track Rating',
    value: 'songs.ratings.value',
  },
];

const OPTIONS_MAP = {
  'albumArtists.genre': {
    type: 'id',
  },
  'albumArtists.name': {
    type: 'string',
  },
  'albumArtists.ratings.value': {
    type: 'number',
  },
  'albums.dateAdded': {
    type: 'date',
  },
  'albums.favorite': {
    type: 'boolean',
  },
  'albums.genre': {
    type: 'id',
  },
  'albums.name': {
    type: 'string',
  },
  'albums.playCount': {
    type: 'number',
  },
  'albums.ratings.value': {
    type: 'number',
  },
  'albums.releaseDate': {
    type: 'date',
  },
  'albums.year': {
    type: 'number',
  },
  'artists.genre': {
    type: 'id',
  },
  'artists.name': {
    type: 'string',
  },
  'artists.ratings.value': {
    type: 'number',
  },
  'songs.name': {
    type: 'string',
  },
  'songs.playCount': {
    type: 'number',
  },
  'songs.ratings.value': {
    type: 'number',
  },
};

interface FilterOptionProps {
  data: AdvancedFilterRule;
  groupIndex: number[];
  level: number;
  onChangeField: (args: any) => void;
  onChangeOperator: (args: any) => void;
  onChangeValue: (args: any) => void;
  onDeleteRule: (args: DeleteArgs) => void;
}

const FilterOption = ({
  data,
  level,
  onDeleteRule,
  groupIndex,
  onChangeField,
  onChangeOperator,
  onChangeValue,
}: FilterOptionProps) => {
  const { field, operator, uniqueId, value } = data;

  const handleDeleteRule = () => {
    onDeleteRule({ groupIndex, level, uniqueId });
  };

  const handleChangeField = (e: any) => {
    onChangeField({ groupIndex, level, uniqueId, value: e });
  };

  const handleChangeOperator = (e: any) => {
    onChangeOperator({ groupIndex, level, uniqueId, value: e });
  };

  const handleChangeValue = (e: any) => {
    const isDirectValue =
      typeof e === 'string' ||
      typeof e === 'number' ||
      typeof e === 'undefined' ||
      typeof e === null;

    if (isDirectValue) {
      return onChangeValue({
        groupIndex,
        level,
        uniqueId,
        value: e,
      });
    }

    return onChangeValue({
      groupIndex,
      level,
      uniqueId,
      value: e.currentTarget.value,
    });
  };

  const filterOperatorMap = {
    date: (
      <Select
        data={DATE_FILTER_OPTIONS_DATA}
        size="xs"
        value={operator}
        width={150}
        onChange={handleChangeOperator}
      />
    ),
    id: (
      <Select
        data={ID_FILTER_OPTIONS_DATA}
        size="xs"
        value={operator}
        width={150}
        onChange={handleChangeOperator}
      />
    ),
    number: (
      <Select
        data={NUMBER_FILTER_OPTIONS_DATA}
        size="xs"
        value={operator}
        width={150}
        onChange={handleChangeOperator}
      />
    ),
    string: (
      <Select
        data={STRING_FILTER_OPTIONS_DATA}
        size="xs"
        value={operator}
        width={150}
        onChange={handleChangeOperator}
      />
    ),
  };

  const filterInputValueMap = {
    'albumArtists.genre': (
      <Select
        searchable
        data={[]}
        size="xs"
        value={value}
        width={150}
        onChange={handleChangeValue}
      />
    ),
    'albumArtists.name': (
      <TextInput
        size="xs"
        value={value}
        width={150}
        onChange={handleChangeValue}
      />
    ),
    'albumArtists.ratings.value': (
      <NumberInput
        max={5}
        min={0}
        size="xs"
        value={value}
        width={150}
        onChange={handleChangeValue}
      />
    ),
    'albums.dateAdded': (
      <DatePicker
        initialLevel="year"
        maxDate={dayjs(new Date()).year(3000).toDate()}
        minDate={dayjs(new Date()).year(1950).toDate()}
        size="xs"
        value={value}
        width={150}
        onChange={handleChangeValue}
      />
    ),
    'albums.genre': (
      <Select
        searchable
        data={[]}
        size="xs"
        value={value}
        width={150}
        onChange={handleChangeValue}
      />
    ),
    'albums.name': (
      <TextInput
        size="xs"
        value={value}
        width={150}
        onChange={handleChangeValue}
      />
    ),
    'albums.playCount': (
      <NumberInput
        min={0}
        size="xs"
        value={value}
        width={150}
        onChange={(e) => handleChangeValue(e)}
      />
    ),
    'albums.ratings.value': (
      <NumberInput
        max={5}
        min={0}
        size="xs"
        value={value}
        width={150}
        onChange={handleChangeValue}
      />
    ),
    'albums.releaseDate': (
      <DatePicker
        initialLevel="year"
        maxDate={dayjs(new Date()).year(3000).toDate()}
        minDate={dayjs(new Date()).year(1950).toDate()}
        size="xs"
        value={value}
        width={150}
        onChange={handleChangeValue}
      />
    ),
    'albums.year': (
      <NumberInput
        min={0}
        size="xs"
        value={value}
        width={150}
        onChange={handleChangeValue}
      />
    ),
    'artists.genre': (
      <Select
        searchable
        data={[]}
        size="xs"
        value={value}
        width={150}
        onChange={handleChangeValue}
      />
    ),
    'artists.name': (
      <TextInput
        size="xs"
        value={value}
        width={150}
        onChange={handleChangeValue}
      />
    ),
    'artists.ratings.value': (
      <NumberInput
        max={5}
        min={0}
        size="xs"
        value={value}
        width={150}
        onChange={handleChangeValue}
      />
    ),
    'songs.name': (
      <TextInput size="xs" width={150} onChange={handleChangeValue} />
    ),
    'songs.playCount': (
      <NumberInput
        min={0}
        size="xs"
        value={value}
        width={150}
        onChange={handleChangeValue}
      />
    ),
    'songs.ratings.value': (
      <NumberInput
        max={5}
        min={0}
        size="xs"
        value={value}
        width={150}
        onChange={handleChangeValue}
      />
    ),
  };

  return (
    <Group ml={`${(level + 1) * 10}px`}>
      <Select
        data={FILTER_OPTIONS_DATA}
        size="xs"
        value={field}
        onChange={handleChangeField}
      />
      {field ? (
        filterOperatorMap[
          OPTIONS_MAP[field as keyof typeof OPTIONS_MAP]
            .type as keyof typeof filterOperatorMap
        ]
      ) : (
        <TextInput disabled size="xs" width={150} />
      )}
      {field ? (
        filterInputValueMap[field as keyof typeof filterInputValueMap]
      ) : (
        <TextInput disabled size="xs" width={150} />
      )}
      <Button
        px={5}
        size="xs"
        tooltip={{ label: 'Remove rule' }}
        variant="default"
        onClick={handleDeleteRule}
      >
        <RiSubtractLine size={20} />
      </Button>
    </Group>
  );
};

type AddArgs = {
  groupIndex: number[];
  level: number;
};

type DeleteArgs = {
  groupIndex: number[];
  level: number;
  uniqueId: string;
};

interface FilterGroupProps {
  data: AdvancedFilterGroup;
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

const FilterGroup = ({
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
}: FilterGroupProps) => {
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
          size="xs"
          value={data.type}
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
            <Button p={0} size="xs" variant="subtle">
              <RiMore2Line size={20} />
            </Button>
          </DropdownMenu.Target>
          <DropdownMenu.Dropdown>
            <DropdownMenu.Item onClick={handleAddRuleGroup}>
              Add rule group
            </DropdownMenu.Item>
            {level > 0 && (
              <DropdownMenu.Item onClick={handleDeleteRuleGroup}>
                Remove rule group
              </DropdownMenu.Item>
            )}
          </DropdownMenu.Dropdown>
        </DropdownMenu>
      </Group>
      {data.rules.map((rule: AdvancedFilterRule) => (
        <FilterOption
          key={rule.uniqueId}
          data={rule}
          groupIndex={groupIndex || []}
          level={level}
          onChangeField={onChangeField}
          onChangeOperator={onChangeOperator}
          onChangeValue={onChangeValue}
          onDeleteRule={onDeleteRule}
        />
      ))}
      {data.group && (
        <>
          {data.group.map((group: AdvancedFilterGroup, index: number) => (
            <FilterGroup
              key={group.uniqueId}
              data={group}
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
          ))}
        </>
      )}
    </Stack>
  );
};

export const AdvancedFilters = ({ filters, setFilters }: any) => {
  const handleAddRuleGroup = (args: AddArgs) => {
    const { level, groupIndex } = args;
    const filtersCopy = { ...filters };

    const getPath = (level: number) => {
      if (level === 0) return 'group';

      const str = [];
      for (const index of groupIndex) {
        str.push(`group[${index}]`);
      }

      return `${str.join('.')}.group`;
    };

    const path = getPath(level);
    const updatedFilters = set(filtersCopy, path, [
      ...get(filtersCopy, path),
      {
        group: [],
        rules: [
          {
            field: undefined,
            operator: undefined,
            uniqueId: nanoid(),
            value: undefined,
          },
        ],
        type: FilterGroupType.AND,
        uniqueId: nanoid(),
      },
    ]);

    setFilters(updatedFilters);
  };

  const handleDeleteRuleGroup = (args: DeleteArgs) => {
    const { uniqueId, level, groupIndex } = args;
    const filtersCopy = { ...filters };

    const getPath = (level: number) => {
      if (level === 0) return 'group';

      const str = [];
      for (let i = 0; i < groupIndex.length; i += 1) {
        if (i !== groupIndex.length - 1) {
          str.push(`group[${groupIndex[i]}]`);
        } else {
          str.push(`group`);
        }
      }

      return `${str.join('.')}`;
    };

    const path = getPath(level);

    const updatedFilters = set(filtersCopy, path, [
      ...get(filtersCopy, path).filter(
        (group: AdvancedFilterGroup) => group.uniqueId !== uniqueId
      ),
    ]);

    setFilters(updatedFilters);
  };

  const getRulePath = (level: number, groupIndex: number[]) => {
    if (level === 0) return 'rules';

    const str = [];
    for (const index of groupIndex) {
      str.push(`group[${index}]`);
    }

    return `${str.join('.')}.rules`;
  };

  const handleAddRule = (args: AddArgs) => {
    const { level, groupIndex } = args;
    const filtersCopy = { ...filters };

    const path = getRulePath(level, groupIndex);
    const updatedFilters = set(filtersCopy, path, [
      ...get(filtersCopy, path),
      {
        field: null,
        operator: null,
        uniqueId: nanoid(),
        value: null,
      },
    ]);

    setFilters(updatedFilters);
  };

  const handleDeleteRule = (args: DeleteArgs) => {
    const { uniqueId, level, groupIndex } = args;
    const filtersCopy = { ...filters };

    const path = getRulePath(level, groupIndex);
    const updatedFilters = set(
      filtersCopy,
      path,
      get(filtersCopy, path).filter(
        (rule: AdvancedFilterRule) => rule.uniqueId !== uniqueId
      )
    );

    setFilters(updatedFilters);
  };

  const handleChangeField = (args: any) => {
    const { uniqueId, level, groupIndex, value } = args;
    const filtersCopy = { ...filters };

    const path = getRulePath(level, groupIndex);
    const updatedFilters = set(
      filtersCopy,
      path,
      get(filtersCopy, path).map((rule: AdvancedFilterRule) => {
        if (rule.uniqueId !== uniqueId) return rule;
        return {
          ...rule,
          field: value,
          operator: null,
          value: null,
        };
      })
    );

    setFilters(updatedFilters);
  };

  const handleChangeType = (args: any) => {
    const { level, groupIndex, value } = args;

    const filtersCopy = { ...filters };

    if (level === 0) {
      return setFilters({ ...filtersCopy, type: value });
    }

    const getTypePath = () => {
      const str = [];
      for (let i = 0; i < groupIndex.length; i += 1) {
        str.push(`group[${groupIndex[i]}]`);
      }

      return `${str.join('.')}`;
    };

    const path = getTypePath();
    const updatedFilters = set(filtersCopy, path, {
      ...get(filtersCopy, path),
      type: value,
    });

    return setFilters(updatedFilters);
  };

  const handleChangeOperator = (args: any) => {
    const { uniqueId, level, groupIndex, value } = args;
    const filtersCopy = { ...filters };

    const path = getRulePath(level, groupIndex);
    const updatedFilters = set(
      filtersCopy,
      path,
      get(filtersCopy, path).map((rule: AdvancedFilterRule) => {
        if (rule.uniqueId !== uniqueId) return rule;
        return {
          ...rule,
          operator: value,
        };
      })
    );

    setFilters(updatedFilters);
  };

  const handleChangeValue = (args: any) => {
    const { uniqueId, level, groupIndex, value } = args;
    const filtersCopy = { ...filters };

    const path = getRulePath(level, groupIndex);
    const updatedFilters = set(
      filtersCopy,
      path,
      get(filtersCopy, path).map((rule: AdvancedFilterRule) => {
        if (rule.uniqueId !== uniqueId) return rule;
        return {
          ...rule,
          value,
        };
      })
    );

    setFilters(updatedFilters);
  };

  return (
    <Box m={10}>
      <FilterGroup
        data={filters}
        groupIndex={[]}
        level={0}
        uniqueId={filters.uniqueId}
        onAddRule={handleAddRule}
        onAddRuleGroup={handleAddRuleGroup}
        onChangeField={handleChangeField}
        onChangeOperator={handleChangeOperator}
        onChangeType={handleChangeType}
        onChangeValue={handleChangeValue}
        onDeleteRule={handleDeleteRule}
        onDeleteRuleGroup={handleDeleteRuleGroup}
      />
    </Box>
  );
};
