import { forwardRef, Ref, useImperativeHandle, useMemo, useState } from 'react';
import { Stack, Group } from '@mantine/core';
import dayjs from 'dayjs';
import { AnimatePresence, motion } from 'framer-motion';
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
import { useGenreList } from '@/renderer/features/genres';
import {
  AdvancedFilterGroup,
  AdvancedFilterRule,
  FilterGroupType,
} from '@/renderer/types';

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
  { label: 'is', value: '=' },
  { label: 'is not', value: '!=' },
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
    default: '~',
    label: 'Artist Name',
    value: 'artists.name',
  },
  {
    default: '=',
    label: 'Artist Rating',
    value: 'artists.ratings.value',
  },
  {
    default: '=',
    label: 'Artist Genre',
    value: 'artists.genres.id',
  },
  {
    default: '~',
    label: 'Album Artist Name',
    value: 'albumArtists.name',
  },
  {
    default: '=',
    label: 'Album Artist Rating',
    value: 'albumArtists.ratings.value',
  },
  {
    default: '=',
    label: 'Album Artist Genre',
    value: 'albumArtists.genres.id',
  },
  {
    default: '~',
    label: 'Album Name',
    value: 'albums.name',
  },
  {
    default: '=',
    label: 'Album Rating',
    value: 'albums.ratings.value',
  },
  {
    default: '=',
    label: 'Album Genre',
    value: 'albums.genres.id',
  },
  {
    default: '=',
    label: 'Album Year',
    value: 'albums.releaseYear',
  },
  {
    default: '<',
    label: 'Album Release Date',
    value: 'albums.releaseDate',
  },
  {
    default: '=',
    disabled: true,
    label: 'Album Play Count',
    value: 'albums.playCount',
  },
  {
    default: '<',
    label: 'Album Date Added',
    value: 'albums.dateAdded',
  },
  {
    default: '~',
    label: 'Track Name',
    value: 'songs.name',
  },
  {
    default: '=',
    label: 'Track Rating',
    value: 'songs.ratings.value',
  },
  {
    default: '=',
    label: 'Track Genre',
    value: 'songs.genres.id',
  },
  {
    default: '=',
    disabled: true,
    label: 'Track Play Count',
    value: 'songs.playCount',
  },
];

const OPTIONS_MAP = {
  'albumArtists.genres.id': {
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
  'albums.genres.id': {
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
  'albums.releaseYear': {
    type: 'number',
  },
  'artists.genres.id': {
    type: 'id',
  },
  'artists.name': {
    type: 'string',
  },
  'artists.ratings.value': {
    type: 'number',
  },
  'songs.genres.id': {
    type: 'id',
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

export const formatAdvancedFiltersGroups = (groups: AdvancedFilterGroup[]) => {
  const filterGroups: any[] = [];

  for (const group of groups) {
    const rules = group.rules
      .filter((rule) => rule.field && rule.operator && rule.value)
      .map((rule) => ({ ...rule, uniqueId: undefined }));

    const updatedGroup = { ...group, rules, uniqueId: undefined };

    if (group.group.length > 0) {
      const nestedRuleGroup = formatAdvancedFiltersGroups(group.group);
      nestedRuleGroup.forEach((group) => groups.push(group));
    }

    if (updatedGroup.rules.length > 0) {
      filterGroups.push(updatedGroup);
    }
  }

  return filterGroups;
};

// Prevent query key from constantly changing due to empty rules or groups
export const encodeAdvancedFiltersQuery = (filter: AdvancedFilterGroup) => {
  const updatedFilter = {
    ...filter,
    group: formatAdvancedFiltersGroups(filter.group),
    rules: filter.rules
      .filter((rule) => rule.field && rule.operator && rule.value)
      .map((rule) => ({ ...rule, uniqueId: undefined })),
  };

  return encodeURI(JSON.stringify(updatedFilter));
};

interface FilterOptionProps {
  data: AdvancedFilterRule;
  groupIndex: number[];
  level: number;
  noRemove: boolean;
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
  noRemove,
  onChangeField,
  onChangeOperator,
  onChangeValue,
}: FilterOptionProps) => {
  const { field, operator, uniqueId, value } = data;
  const { data: genres } = useGenreList();

  const genresData = useMemo(() => {
    if (!genres?.data) return null;

    const album = [];
    const song = [];
    const albumArtist = [];
    const artist = [];

    for (const genre of genres.data) {
      if (genre.albumCount > 0) {
        album.push({
          label: `${genre.name} (${genre.albumCount})`,
          value: genre.id,
        });
      }

      if (genre.songCount > 0) {
        song.push({
          label: `${genre.name} (${genre.songCount})`,
          value: genre.id,
        });
      }

      if (genre.albumArtistCount > 0) {
        albumArtist.push({
          label: `${genre.name} (${genre.albumArtistCount})`,
          value: genre.id,
        });
      }

      if (genre.artistCount > 0) {
        artist.push({
          label: `${genre.name} (${genre.artistCount})`,
          value: genre.id,
        });
      }
    }

    return { album, albumArtist, artist, song };
  }, [genres]);

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

    const isDate = e instanceof Date;

    if (isDate) {
      return onChangeValue({
        groupIndex,
        level,
        uniqueId,
        value: dayjs(e).format('YYYY-MM-DD'),
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
        searchable
        data={DATE_FILTER_OPTIONS_DATA}
        maxWidth={175}
        size="xs"
        value={operator}
        width="20%"
        onChange={handleChangeOperator}
      />
    ),
    id: (
      <Select
        searchable
        data={ID_FILTER_OPTIONS_DATA}
        maxWidth={175}
        size="xs"
        value={operator}
        width="20%"
        onChange={handleChangeOperator}
      />
    ),
    number: (
      <Select
        searchable
        data={NUMBER_FILTER_OPTIONS_DATA}
        maxWidth={175}
        size="xs"
        value={operator}
        width="20%"
        onChange={handleChangeOperator}
      />
    ),
    string: (
      <Select
        searchable
        data={STRING_FILTER_OPTIONS_DATA}
        maxWidth={175}
        size="xs"
        value={operator}
        width="20%"
        onChange={handleChangeOperator}
      />
    ),
  };

  const filterInputValueMap = {
    'albumArtists.genres.id': (
      <Select
        searchable
        data={genresData?.albumArtist || []}
        maxWidth={175}
        size="xs"
        value={value}
        width="20%"
        onChange={handleChangeValue}
      />
    ),
    'albumArtists.name': (
      <TextInput
        maxWidth={175}
        size="xs"
        value={value}
        width="20%"
        onChange={handleChangeValue}
      />
    ),
    'albumArtists.ratings.value': (
      <NumberInput
        max={5}
        maxWidth={175}
        min={0}
        size="xs"
        value={value}
        width="20%"
        onChange={handleChangeValue}
      />
    ),
    'albums.dateAdded': (
      <DatePicker
        initialLevel="year"
        maxDate={dayjs(new Date()).year(3000).toDate()}
        maxWidth={175}
        minDate={dayjs(new Date()).year(1950).toDate()}
        size="xs"
        value={value}
        width="20%"
        onChange={handleChangeValue}
      />
    ),
    'albums.genres.id': (
      <Select
        searchable
        data={genresData?.album || []}
        maxWidth={175}
        size="xs"
        value={value}
        width="20%"
        onChange={handleChangeValue}
      />
    ),
    'albums.name': (
      <TextInput
        maxWidth={175}
        size="xs"
        value={value}
        width="20%"
        onChange={handleChangeValue}
      />
    ),
    'albums.playCount': (
      <NumberInput
        maxWidth={175}
        min={0}
        size="xs"
        value={value}
        width="20%"
        onChange={(e) => handleChangeValue(e)}
      />
    ),
    'albums.ratings.value': (
      <NumberInput
        max={5}
        maxWidth={175}
        min={0}
        size="xs"
        value={value}
        width="20%"
        onChange={handleChangeValue}
      />
    ),
    'albums.releaseDate': (
      <DatePicker
        initialLevel="year"
        maxDate={dayjs(new Date()).year(3000).toDate()}
        maxWidth={175}
        minDate={dayjs(new Date()).year(1950).toDate()}
        size="xs"
        value={value}
        width="20%"
        onChange={handleChangeValue}
      />
    ),
    'albums.releaseYear': (
      <NumberInput
        maxWidth={175}
        min={0}
        size="xs"
        value={value}
        width="20%"
        onChange={handleChangeValue}
      />
    ),
    'artists.genres.id': (
      <Select
        searchable
        data={genresData?.artist || []}
        maxWidth={175}
        size="xs"
        value={value}
        width="20%"
        onChange={handleChangeValue}
      />
    ),
    'artists.name': (
      <TextInput
        maxWidth={175}
        size="xs"
        value={value}
        width="20%"
        onChange={handleChangeValue}
      />
    ),
    'artists.ratings.value': (
      <NumberInput
        max={5}
        maxWidth={175}
        min={0}
        size="xs"
        value={value}
        width="20%"
        onChange={handleChangeValue}
      />
    ),
    'songs.genres.id': (
      <Select
        searchable
        data={genresData?.song || []}
        maxWidth={175}
        size="xs"
        value={value}
        width="20%"
        onChange={handleChangeValue}
      />
    ),
    'songs.name': (
      <TextInput
        maxWidth={175}
        size="xs"
        width="20%"
        onChange={handleChangeValue}
      />
    ),
    'songs.playCount': (
      <NumberInput
        maxWidth={175}
        min={0}
        size="xs"
        value={value}
        width="20%"
        onChange={handleChangeValue}
      />
    ),
    'songs.ratings.value': (
      <NumberInput
        max={5}
        maxWidth={175}
        min={0}
        size="xs"
        value={value}
        width="20%"
        onChange={handleChangeValue}
      />
    ),
  };

  const ml = (level + 1) * 10 - level * 5;

  return (
    <Group ml={ml}>
      <Select
        searchable
        data={FILTER_OPTIONS_DATA}
        maxWidth={175}
        size="xs"
        value={field}
        width="20%"
        onChange={handleChangeField}
      />
      {field ? (
        filterOperatorMap[
          OPTIONS_MAP[field as keyof typeof OPTIONS_MAP]
            .type as keyof typeof filterOperatorMap
        ]
      ) : (
        <TextInput disabled maxWidth={175} size="xs" width="20%" />
      )}
      {field ? (
        filterInputValueMap[field as keyof typeof filterInputValueMap]
      ) : (
        <TextInput disabled maxWidth={175} size="xs" width="20%" />
      )}
      <Button
        disabled={noRemove}
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
          searchable
          data={FILTER_GROUP_OPTIONS_DATA}
          maxWidth={175}
          size="xs"
          value={data.type}
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
      <AnimatePresence key="advanced-filter-option" initial={false}>
        {data.rules.map((rule: AdvancedFilterRule) => (
          <motion.div
            key={rule.uniqueId}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -25 }}
            initial={{ opacity: 0, x: -25 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <FilterOption
              data={rule}
              groupIndex={groupIndex || []}
              level={level}
              noRemove={data.rules.length === 1}
              onChangeField={onChangeField}
              onChangeOperator={onChangeOperator}
              onChangeValue={onChangeValue}
              onDeleteRule={onDeleteRule}
            />
          </motion.div>
        ))}
      </AnimatePresence>
      {data.group && (
        <AnimatePresence key="advanced-filter-group" initial={false}>
          {data.group.map((group: AdvancedFilterGroup, index: number) => (
            <motion.div
              key={group.uniqueId}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -25 }}
              initial={{ opacity: 0, x: -25 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              <FilterGroup
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
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </Stack>
  );
};

const DEFAULT_ADVANCED_FILTERS = {
  group: [],
  rules: [
    {
      field: '',
      operator: '',
      uniqueId: nanoid(),
      value: '',
    },
  ],
  type: FilterGroupType.AND,
  uniqueId: nanoid(),
};

interface AdvancedFiltersProps {
  defaultFilters?: AdvancedFilterGroup;
  onChange: (filters: AdvancedFilterGroup) => void;
}

export interface AdvancedFiltersRef {
  reset: () => void;
}

export const AdvancedFilters = forwardRef(
  (
    { defaultFilters, onChange }: AdvancedFiltersProps,
    ref: Ref<AdvancedFiltersRef>
  ) => {
    const [filters, setFilters] = useState<AdvancedFilterGroup>(
      defaultFilters || DEFAULT_ADVANCED_FILTERS
    );

    useImperativeHandle(ref, () => ({
      reset() {
        setFilters(DEFAULT_ADVANCED_FILTERS);
      },
    }));

    const setFilterHandler = (newFilters: AdvancedFilterGroup) => {
      setFilters(newFilters);
      onChange(newFilters);
    };

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
              field: '',
              operator: '',
              uniqueId: nanoid(),
              value: '',
            },
          ],
          type: FilterGroupType.AND,
          uniqueId: nanoid(),
        },
      ]);

      setFilterHandler(updatedFilters);
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

      setFilterHandler(updatedFilters);
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

      setFilterHandler(updatedFilters);
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

      setFilterHandler(updatedFilters);
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
          const defaultOperator = FILTER_OPTIONS_DATA.find(
            (option) => option.value === value
          )?.default;

          return {
            ...rule,
            field: value,
            operator: defaultOperator || '',
            value: '',
          };
        })
      );

      setFilterHandler(updatedFilters);
    };

    const handleChangeType = (args: any) => {
      const { level, groupIndex, value } = args;

      const filtersCopy = { ...filters };

      if (level === 0) {
        return setFilterHandler({ ...filtersCopy, type: value });
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

      return setFilterHandler(updatedFilters);
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

      setFilterHandler(updatedFilters);
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

      setFilterHandler(updatedFilters);
    };

    return (
      <>
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
      </>
    );
  }
);

AdvancedFilters.defaultProps = {
  defaultFilters: undefined,
};
