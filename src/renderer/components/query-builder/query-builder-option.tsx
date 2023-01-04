import { Group } from '@mantine/core';
import dayjs from 'dayjs';
import { RiSubtractLine } from 'react-icons/ri';
import { Button } from '/@/renderer/components/button';
import { TextInput } from '/@/renderer/components/input';
import { Select } from '/@/renderer/components/select';
import { QueryBuilderRule } from '/@/renderer/types';

const operators = [
  { label: 'is', value: 'is' },
  { label: 'is not', value: 'isNot' },
  { label: 'is greater than', value: 'gt' },
  { label: 'is less than', value: 'lt' },
  { label: 'contains', value: 'contains' },
  { label: 'does not contain', value: 'notContains' },
  { label: 'starts with', value: 'startsWith' },
  { label: 'ends with', value: 'endsWith' },
  { label: 'is in the range', value: 'inTheRange' },
  { label: 'before', value: 'before' },
  { label: 'after', value: 'after' },
  { label: 'is in the last', value: 'inTheLast' },
  { label: 'is not in the last', value: 'notInTheLast' },
];

type DeleteArgs = {
  groupIndex: number[];
  level: number;
  uniqueId: string;
};

interface QueryOptionProps {
  data: QueryBuilderRule;
  filters: { label: string; value: string }[];
  groupIndex: number[];
  // groupValue: string;
  level: number;
  noRemove: boolean;
  onChangeField: (args: any) => void;
  onChangeOperator: (args: any) => void;
  onChangeValue: (args: any) => void;
  onDeleteRule: (args: DeleteArgs) => void;
}

export const QueryBuilderOption = ({
  data,
  filters,
  level,
  onDeleteRule,
  groupIndex,
  noRemove,
  onChangeField,
  onChangeOperator,
  onChangeValue,
}: QueryOptionProps) => {
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
    console.log('e', e);

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

  // const filterOperatorMap = {
  //   date: (
  //     <Select
  //       searchable
  //       data={DATE_FILTER_OPTIONS_DATA}
  //       maxWidth={175}
  //       size="xs"
  //       value={operator}
  //       width="20%"
  //       onChange={handleChangeOperator}
  //     />
  //   ),
  //   id: (
  //     <Select
  //       searchable
  //       data={ID_FILTER_OPTIONS_DATA}
  //       maxWidth={175}
  //       size="xs"
  //       value={operator}
  //       width="20%"
  //       onChange={handleChangeOperator}
  //     />
  //   ),
  //   number: (
  //     <Select
  //       searchable
  //       data={NUMBER_FILTER_OPTIONS_DATA}
  //       maxWidth={175}
  //       size="xs"
  //       value={operator}
  //       width="20%"
  //       onChange={handleChangeOperator}
  //     />
  //   ),
  //   string: (
  //     <Select
  //       searchable
  //       data={STRING_FILTER_OPTIONS_DATA}
  //       maxWidth={175}
  //       size="xs"
  //       value={operator}
  //       width="20%"
  //       onChange={handleChangeOperator}
  //     />
  //   ),
  // };

  // const filterInputValueMap = {
  //   'albumArtists.genres.id': (
  //     <Select
  //       searchable
  //       data={genresData?.albumArtist || []}
  //       maxWidth={175}
  //       size="xs"
  //       value={value}
  //       width="20%"
  //       onChange={handleChangeValue}
  //     />
  //   ),
  //   'albumArtists.name': (
  //     <TextInput
  //       maxWidth={175}
  //       size="xs"
  //       value={value}
  //       width="20%"
  //       onChange={handleChangeValue}
  //     />
  //   ),
  //   'albumArtists.ratings.value': (
  //     <NumberInput
  //       max={5}
  //       maxWidth={175}
  //       min={0}
  //       size="xs"
  //       value={value}
  //       width="20%"
  //       onChange={handleChangeValue}
  //     />
  //   ),
  //   'albums.dateAdded': (
  //     <DatePicker
  //       initialLevel="year"
  //       maxDate={dayjs(new Date()).year(3000).toDate()}
  //       maxWidth={175}
  //       minDate={dayjs(new Date()).year(1950).toDate()}
  //       size="xs"
  //       value={value}
  //       width="20%"
  //       onChange={handleChangeValue}
  //     />
  //   ),
  //   'albums.genres.id': (
  //     <Select
  //       searchable
  //       data={genresData?.album || []}
  //       maxWidth={175}
  //       size="xs"
  //       value={value}
  //       width="20%"
  //       onChange={handleChangeValue}
  //     />
  //   ),
  //   'albums.name': (
  //     <TextInput
  //       maxWidth={175}
  //       size="xs"
  //       value={value}
  //       width="20%"
  //       onChange={handleChangeValue}
  //     />
  //   ),
  //   'albums.playCount': (
  //     <NumberInput
  //       maxWidth={175}
  //       min={0}
  //       size="xs"
  //       value={value}
  //       width="20%"
  //       onChange={(e) => handleChangeValue(e)}
  //     />
  //   ),
  //   'albums.ratings.value': (
  //     <NumberInput
  //       max={5}
  //       maxWidth={175}
  //       min={0}
  //       size="xs"
  //       value={value}
  //       width="20%"
  //       onChange={handleChangeValue}
  //     />
  //   ),
  //   'albums.releaseDate': (
  //     <DatePicker
  //       initialLevel="year"
  //       maxDate={dayjs(new Date()).year(3000).toDate()}
  //       maxWidth={175}
  //       minDate={dayjs(new Date()).year(1950).toDate()}
  //       size="xs"
  //       value={value}
  //       width="20%"
  //       onChange={handleChangeValue}
  //     />
  //   ),
  //   'albums.releaseYear': (
  //     <NumberInput
  //       maxWidth={175}
  //       min={0}
  //       size="xs"
  //       value={value}
  //       width="20%"
  //       onChange={handleChangeValue}
  //     />
  //   ),
  //   'artists.genres.id': (
  //     <Select
  //       searchable
  //       data={genresData?.artist || []}
  //       maxWidth={175}
  //       size="xs"
  //       value={value}
  //       width="20%"
  //       onChange={handleChangeValue}
  //     />
  //   ),
  //   'artists.name': (
  //     <TextInput
  //       maxWidth={175}
  //       size="xs"
  //       value={value}
  //       width="20%"
  //       onChange={handleChangeValue}
  //     />
  //   ),
  //   'artists.ratings.value': (
  //     <NumberInput
  //       max={5}
  //       maxWidth={175}
  //       min={0}
  //       size="xs"
  //       value={value}
  //       width="20%"
  //       onChange={handleChangeValue}
  //     />
  //   ),
  //   'songs.genres.id': (
  //     <Select
  //       searchable
  //       data={genresData?.song || []}
  //       maxWidth={175}
  //       size="xs"
  //       value={value}
  //       width="20%"
  //       onChange={handleChangeValue}
  //     />
  //   ),
  //   'songs.name': (
  //     <TextInput
  //       maxWidth={175}
  //       size="xs"
  //       width="20%"
  //       onChange={handleChangeValue}
  //     />
  //   ),
  //   'songs.playCount': (
  //     <NumberInput
  //       maxWidth={175}
  //       min={0}
  //       size="xs"
  //       value={value}
  //       width="20%"
  //       onChange={handleChangeValue}
  //     />
  //   ),
  //   'songs.ratings.value': (
  //     <NumberInput
  //       max={5}
  //       maxWidth={175}
  //       min={0}
  //       size="xs"
  //       value={value}
  //       width="20%"
  //       onChange={handleChangeValue}
  //     />
  //   ),
  // };

  const ml = (level + 1) * 10;

  return (
    <Group ml={ml}>
      <Select
        searchable
        data={filters}
        maxWidth={175}
        size="sm"
        value={field}
        width="20%"
        onChange={handleChangeField}
      />
      <Select
        searchable
        data={operators}
        disabled={!field}
        maxWidth={175}
        size="sm"
        value={operator}
        width="20%"
        onChange={handleChangeOperator}
      />
      {field ? (
        <TextInput
          defaultValue={value}
          maxWidth={175}
          size="sm"
          width="20%"
          onChange={handleChangeValue}
        />
      ) : (
        <TextInput
          disabled
          defaultValue={value}
          maxWidth={175}
          size="sm"
          width="20%"
          onChange={handleChangeValue}
        />
      )}
      {/* // filterOperatorMap[ // OPTIONS_MAP[field as keyof typeof OPTIONS_MAP].type as keyof typeof
      filterOperatorMap // ] */}
      <Button
        disabled={noRemove}
        px={5}
        size="sm"
        tooltip={{ label: 'Remove rule' }}
        variant="default"
        onClick={handleDeleteRule}
      >
        <RiSubtractLine size={20} />
      </Button>
    </Group>
  );
};
