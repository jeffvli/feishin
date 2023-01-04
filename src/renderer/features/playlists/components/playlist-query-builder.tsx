import { useState, useImperativeHandle, forwardRef } from 'react';
import { Flex, Group, ScrollArea } from '@mantine/core';
import clone from 'lodash/clone';
import get from 'lodash/get';
import setWith from 'lodash/setWith';
import { nanoid } from 'nanoid';
import { NDSongQueryFields } from '/@/renderer/api/navidrome.types';
import { Button, DropdownMenu, NumberInput, QueryBuilder } from '/@/renderer/components';
import {
  convertNDQueryToQueryGroup,
  convertQueryGroupToNDQuery,
} from '/@/renderer/features/playlists/utils';
import { QueryBuilderGroup, QueryBuilderRule } from '/@/renderer/types';
import { RiMore2Fill } from 'react-icons/ri';

type AddArgs = {
  groupIndex: number[];
  level: number;
};

type DeleteArgs = {
  groupIndex: number[];
  level: number;
  uniqueId: string;
};

interface PlaylistQueryBuilderProps {
  onSave: (parsedFilter: any) => void;
  onSaveAs: (parsedFilter: any) => void;
  query: any;
}

export const PlaylistQueryBuilder = forwardRef(
  ({ query, onSave, onSaveAs }: PlaylistQueryBuilderProps, ref) => {
    const [filters, setFilters] = useState<any>(
      convertNDQueryToQueryGroup(query) || {
        all: [],
      },
    );

    useImperativeHandle(ref, () => ({
      reset() {
        setFilters({
          all: [],
        });
      },
    }));

    const setFilterHandler = (newFilters: QueryBuilderGroup) => {
      setFilters(newFilters);
      // onSave(newFilters);
    };

    const handleSave = () => {
      onSave(convertQueryGroupToNDQuery(filters));
    };

    const handleSaveAs = () => {
      onSaveAs(convertQueryGroupToNDQuery(filters));
    };

    const handleAddRuleGroup = (args: AddArgs) => {
      const { level, groupIndex } = args;
      const filtersCopy = clone(filters);

      const getPath = (level: number) => {
        if (level === 0) return 'group';

        const str = [];
        for (const index of groupIndex) {
          str.push(`group[${index}]`);
        }

        return `${str.join('.')}.group`;
      };

      const path = getPath(level);
      const updatedFilters = setWith(
        filtersCopy,
        path,
        [
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
            type: 'any',
            uniqueId: nanoid(),
          },
        ],
        clone,
      );

      setFilterHandler(updatedFilters);
    };

    const handleDeleteRuleGroup = (args: DeleteArgs) => {
      const { uniqueId, level, groupIndex } = args;
      const filtersCopy = clone(filters);

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

      const updatedFilters = setWith(
        filtersCopy,
        path,
        [
          ...get(filtersCopy, path).filter(
            (group: QueryBuilderGroup) => group.uniqueId !== uniqueId,
          ),
        ],
        clone,
      );

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
      const filtersCopy = clone(filters);

      const path = getRulePath(level, groupIndex);
      const updatedFilters = setWith(
        filtersCopy,
        path,
        [
          ...get(filtersCopy, path),
          {
            field: 'title',
            operator: 'contains',
            uniqueId: nanoid(),
            value: null,
          },
        ],
        clone,
      );

      setFilterHandler(updatedFilters);
    };

    const handleDeleteRule = (args: DeleteArgs) => {
      const { uniqueId, level, groupIndex } = args;
      const filtersCopy = clone(filters);

      const path = getRulePath(level, groupIndex);
      const updatedFilters = setWith(
        filtersCopy,
        path,
        get(filtersCopy, path).filter((rule: QueryBuilderRule) => rule.uniqueId !== uniqueId),
        clone,
      );

      setFilterHandler(updatedFilters);
    };

    const handleChangeField = (args: any) => {
      const { uniqueId, level, groupIndex, value } = args;
      const filtersCopy = clone(filters);

      const path = getRulePath(level, groupIndex);
      const updatedFilters = setWith(
        filtersCopy,
        path,
        get(filtersCopy, path).map((rule: QueryBuilderGroup) => {
          if (rule.uniqueId !== uniqueId) return rule;
          // const defaultOperator = FILTER_OPTIONS_DATA.find(
          //   (option) => option.value === value,
          // )?.default;

          return {
            ...rule,
            field: value,
            operator: '',
            value: '',
          };
        }),
        clone,
      );

      setFilterHandler(updatedFilters);
    };

    const handleChangeType = (args: any) => {
      const { level, groupIndex, value } = args;

      const filtersCopy = clone(filters);

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
      const updatedFilters = setWith(
        filtersCopy,
        path,
        {
          ...get(filtersCopy, path),
          type: value,
        },
        clone,
      );

      return setFilterHandler(updatedFilters);
    };

    const handleChangeOperator = (args: any) => {
      const { uniqueId, level, groupIndex, value } = args;
      const filtersCopy = clone(filters);

      const path = getRulePath(level, groupIndex);
      const updatedFilters = setWith(
        filtersCopy,
        path,
        get(filtersCopy, path).map((rule: QueryBuilderRule) => {
          if (rule.uniqueId !== uniqueId) return rule;
          return {
            ...rule,
            operator: value,
          };
        }),
        clone,
      );

      setFilterHandler(updatedFilters);
    };

    const handleChangeValue = (args: any) => {
      const { uniqueId, level, groupIndex, value } = args;
      const filtersCopy = clone(filters);

      const path = getRulePath(level, groupIndex);
      console.log('path', path);
      const updatedFilters = setWith(
        filtersCopy,
        path,
        get(filtersCopy, path).map((rule: QueryBuilderRule) => {
          if (rule.uniqueId !== uniqueId) return rule;
          return {
            ...rule,
            value,
          };
        }),
        clone,
      );

      setFilterHandler(updatedFilters);
    };

    return (
      <Flex
        direction="column"
        h="100%"
        justify="space-between"
      >
        <ScrollArea h="100%">
          <QueryBuilder
            data={filters}
            filters={NDSongQueryFields}
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
        </ScrollArea>
        <Group
          align="flex-end"
          p="1rem 1rem 0"
          position="apart"
        >
          <NumberInput
            label="Limit to"
            width={75}
          />
          <Group>
            <Button
              variant="filled"
              onClick={handleSave}
            >
              Save
            </Button>
            <DropdownMenu position="bottom-end">
              <DropdownMenu.Target>
                <Button
                  p="0.5em"
                  variant="default"
                >
                  <RiMore2Fill size={15} />
                </Button>
              </DropdownMenu.Target>
              <DropdownMenu.Dropdown>
                <DropdownMenu.Item onClick={handleSaveAs}>Save as</DropdownMenu.Item>
              </DropdownMenu.Dropdown>
            </DropdownMenu>
          </Group>
        </Group>
      </Flex>
    );
  },
);
