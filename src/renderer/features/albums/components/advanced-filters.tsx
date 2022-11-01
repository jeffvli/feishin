import { useState } from 'react';
import { Box, Stack, Group } from '@mantine/core';
import _ from 'lodash';
import { nanoid } from 'nanoid/non-secure';
import { RiAddLine, RiMore2Line, RiSubtractLine } from 'react-icons/ri';
import {
  Button,
  DropdownMenu,
  NumberInput,
  Select,
  TextInput,
} from '@/renderer/components';

enum FilterGroupType {
  AND = 'and',
  OR = 'or',
}

type AdvancedFilterRule = {
  field: string;
  operator: string;
  uniqueId: string;
  value: string;
};

type AdvancedFilterGroup = {
  group: AdvancedFilterGroup[];
  rules: AdvancedFilterRule[];
  type: FilterGroupType;
  uniqueId: string;
};

const DATE_FILTER_OPTIONS_DATA = [
  { label: 'is before', value: '<' },
  { label: 'is after', value: '>' },
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
];

const FILTER_GROUP_OPTIONS_DATA = [
  {
    label: 'Match ALL',
    value: FilterGroupType.AND,
  },
  {
    label: 'Match ANY',
    value: FilterGroupType.OR,
  },
];

const FILTER_OPTIONS_DATA = [
  {
    label: 'Artist Title',
    value: 'artist.title',
  },
  {
    label: 'Artist Rating',
    value: 'artist.rating',
  },
  {
    label: 'Artist Genre',
    value: 'artist.genre',
  },
  {
    label: 'Album Title',
    value: 'album.title',
  },
  {
    label: 'Album Genre',
    value: 'album.genre',
  },
  {
    label: 'Album Rating',
    value: 'album.rating',
  },
  {
    label: 'Album Year',
    value: 'album.year',
  },
  {
    label: 'Album Release Date',
    value: 'album.releaseDate',
  },
  {
    label: 'Album Plays',
    value: 'album.playCount',
  },
  {
    label: 'Album Date Added',
    value: 'album.dateAdded',
  },
  {
    label: 'Track Title',
    value: 'track.title',
  },
  {
    label: 'Track Plays',
    value: 'track.plays',
  },
  {
    label: 'Track Rating',
    value: 'track.rating',
  },
];

const OPTIONS_MAP = {
  'album.dateAdded': {
    type: 'date',
  },
  'album.favorite': {
    type: 'boolean',
  },
  'album.genre': {
    type: 'string',
  },
  'album.playCount': {
    type: 'number',
  },
  'album.rating': {
    type: 'number',
  },
  'album.releaseDate': {
    type: 'date',
  },
  'album.title': {
    type: 'string',
  },
  'album.year': {
    type: 'number',
  },
  'artist.genre': {
    type: 'string',
  },
  'artist.rating': {
    type: 'number',
  },
  'artist.title': {
    type: 'string',
  },
  'track.plays': {
    type: 'number',
  },
  'track.rating': {
    type: 'number',
  },
  'track.title': {
    type: 'string',
  },
};

const FilterOption = ({ level, onDeleteRule, uniqueId, groupIndex }: any) => {
  const [selectedOption, setSelectedOption] = useState<
    string | null | typeof OPTIONS_MAP
  >(FILTER_OPTIONS_DATA[0].value);

  const handleDeleteRule = () => {
    onDeleteRule({ groupIndex, level, uniqueId });
  };

  const filterMap = {
    date: <Select data={DATE_FILTER_OPTIONS_DATA} size="xs" width={150} />,
    number: <Select data={NUMBER_FILTER_OPTIONS_DATA} size="xs" width={150} />,
    string: <Select data={STRING_FILTER_OPTIONS_DATA} size="xs" width={150} />,
  };

  const filterInputMap = {
    'album.dateAdded': <TextInput size="xs" width={150} />,
    'album.genre': <Select searchable data={['hello']} size="xs" width={150} />,
    'album.playCount': <NumberInput size="xs" width={150} />,
    'album.rating': <NumberInput size="xs" width={150} />,
    'album.releaseDate': <TextInput size="xs" width={150} />,
    'album.title': <TextInput size="xs" width={150} />,
    'album.year': <NumberInput size="xs" width={150} />,
    'artist.genre': <Select searchable data={[]} size="xs" width={150} />,
    'artist.rating': <NumberInput size="xs" width={150} />,
    'artist.title': <TextInput size="xs" width={150} />,
    'track.plays': <NumberInput size="xs" width={150} />,
    'track.rating': <NumberInput size="xs" width={150} />,
    'track.title': <TextInput size="xs" width={150} />,
  };

  return (
    <Group ml={level === 0 ? '10px' : `${level * 10}px`}>
      <Select
        data={FILTER_OPTIONS_DATA}
        size="xs"
        onChange={setSelectedOption}
      />
      {selectedOption &&
        filterMap[
          OPTIONS_MAP[selectedOption as keyof typeof OPTIONS_MAP]
            .type as keyof typeof filterMap
        ]}
      {selectedOption &&
        filterInputMap[selectedOption as keyof typeof filterInputMap]}
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

  return (
    <Stack ml={`${level * 10}px`}>
      <Group>
        <Select
          data={FILTER_GROUP_OPTIONS_DATA}
          defaultValue={FILTER_GROUP_OPTIONS_DATA[0].value}
          size="xs"
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
        <>
          <FilterOption
            key={rule.uniqueId}
            groupIndex={groupIndex || []}
            level={level}
            uniqueId={rule.uniqueId}
            onAddRule={handleAddRule}
            onDeleteRule={onDeleteRule}
          />
        </>
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
              onDeleteRule={onDeleteRule}
              onDeleteRuleGroup={onDeleteRuleGroup}
            />
          ))}
        </>
      )}
    </Stack>
  );
};

export const AdvancedFilters = () => {
  const [filters, setFilters] = useState<AdvancedFilterGroup>({
    group: [],
    rules: [],
    type: FilterGroupType.AND,
    uniqueId: nanoid(),
  });

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
    const updatedFilters = _.set(filtersCopy, path, [
      ..._.get(filtersCopy, path),
      {
        group: [],
        rules: [],
        type: 'push',
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

    const updatedFilters = _.set(filtersCopy, path, [
      ..._.get(filtersCopy, path).filter(
        (group: AdvancedFilterGroup) => group.uniqueId !== uniqueId
      ),
    ]);

    setFilters(updatedFilters);
  };

  const handleAddRule = (args: AddArgs) => {
    const { level, groupIndex } = args;
    const filtersCopy = { ...filters };

    const getPath = (level: number) => {
      if (level === 0) return 'rules';

      const str = [];
      for (const index of groupIndex) {
        str.push(`group[${index}]`);
      }

      return `${str.join('.')}.rules`;
    };

    const path = getPath(level);
    const updatedFilters = _.set(filtersCopy, path, [
      ..._.get(filtersCopy, path),
      { filter: 'newrule', uniqueId: nanoid() },
    ]);

    setFilters(updatedFilters);
  };

  const handleDeleteRule = (args: DeleteArgs) => {
    const { uniqueId, level, groupIndex } = args;
    const filtersCopy = { ...filters };

    const getPath = (level: number) => {
      if (level === 0) return 'rules';

      const str = [];
      for (const index of groupIndex) {
        str.push(`group[${index}]`);
      }

      return `${str.join('.')}.rules`;
    };

    const path = getPath(level);
    const updatedFilters = _.set(
      filtersCopy,
      path,
      _.get(filtersCopy, path).filter(
        (rule: AdvancedFilterRule) => rule.uniqueId !== uniqueId
      )
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
        onDeleteRule={handleDeleteRule}
        onDeleteRuleGroup={handleDeleteRuleGroup}
      />
    </Box>
  );
};
