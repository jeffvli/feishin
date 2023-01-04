import { useState, useImperativeHandle, forwardRef } from 'react';
import { uniqueId } from 'lodash';
import clone from 'lodash/clone';
import setWith from 'lodash/setWith';
import get from 'lodash/get';
import sortBy from 'lodash/sortBy';
import { nanoid } from 'nanoid';
import { NDSongQueryFields } from '/@/renderer/api/navidrome.types';
import { AdvancedFilterGroup, AdvancedFilterRule, QueryBuilder } from '/@/renderer/components';
import { FilterGroupType } from '/@/renderer/types';

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

const sortQuery = (query: any) => {
  let b;

  if (query.all) {
    b = sortBy(query.all, (item) => {
      const key = Object.keys(item)[0];
      return key === 'all' || key === 'any' ? 0 : 1;
    });
  } else {
    b = sortBy(query.any, (item) => {
      const key = Object.keys(item)[0];
      return key === 'all' || key === 'any' ? 0 : 1;
    });
  }

  return { all: b };
};

const addUniqueId = (query: any) => {
  const queryCopy = clone(query);
  const addId = (item: any) => {
    const key = Object.keys(item)[0];
    if (key === 'all' || key === 'any') {
      item[key].forEach(addId);
    } else {
      item[key].uniqueId = nanoid();
    }
  };

  addId(queryCopy);
  return queryCopy;
};

export const PlaylistQueryBuilder = forwardRef(({ query, onChange }: any, ref) => {
  const [filters, setFilters] = useState<any>(
    sortQuery(addUniqueId(query)) || {
      all: [],
    },
  );

  console.log('filters :>> ', JSON.stringify(filters));

  useImperativeHandle(ref, () => ({
    reset() {
      setFilters({
        all: [],
      });
    },
  }));

  const setFilterHandler = (newFilters: AdvancedFilterGroup) => {
    setFilters(newFilters);
    onChange(newFilters);
  };

  const handleAddRuleGroup = (args: AddArgs) => {
    const { level, groupIndex, groupValue } = args;
    const filtersCopy = clone(filters);

    const getPath = (level: number) => {
      const rootKey = Object.keys(filters)[0];
      if (level === 0) return rootKey;

      const str = [rootKey];
      for (const index of groupIndex) {
        str.push(`[${index}].${groupValue}`);
      }

      return `${str.join('.')}`;
    };

    const path = getPath(level);
    console.log('path', filtersCopy, path);
    const updatedFilters = setWith(
      filtersCopy,
      path,
      sortQuery([...get(filtersCopy, path), { any: [{ contains: { title: '' } }] }]),
      clone,
    );

    setFilterHandler(updatedFilters);
  };

  const handleDeleteRuleGroup = (args: DeleteArgs) => {
    const { uniqueId, level, groupIndex, groupValue } = args;
    const filtersCopy = clone(filters);

    const getPath = (level: number) => {
      const rootKey = Object.keys(filters)[0];
      if (level === 0) return rootKey;

      const str = [];
      for (let i = 0; i < groupIndex.length; i += 1) {
        if (groupIndex.length === 1) {
          str.push(rootKey);
          break;
        }

        if (i === 0) {
          str.push(`${rootKey}[${groupIndex[i]}]`);
        } else if (i !== groupIndex.length - 1) {
          str.push(`${groupValue}[${groupIndex[i]}]`);
        } else {
          str.push(`${groupValue}`);
        }
      }

      return `${str.join('.')}`;
    };

    const path = getPath(level);

    const dataAtPath = get(filtersCopy, path);
    const lv = groupIndex[level - 1];
    const removed = [...dataAtPath.slice(0, lv), ...dataAtPath.slice(lv + 1)];
    const updatedFilters = setWith(filtersCopy, path, sortQuery(removed), clone);

    setFilterHandler(updatedFilters);
  };

  const getRulePath = (level: number, groupIndex: number[], groupValue: string) => {
    if (level === 0) return Object.keys(filters)[0];

    const str = [];
    for (const index of groupIndex) {
      str.push(`${Object.keys(filters)[0]}[${index}].${groupValue}`);
    }

    return `${str.join('.')}`;
  };

  // const getRulePath = (
  //   level: number,
  //   groupIndex: number[],
  //   groupValue: string,
  //   uniqueId?: string,
  // ) => {
  //   const rootKey = Object.keys(filters)[0];
  //   if (level === 0) return rootKey;

  //   const str = [];
  //   for (const index of groupIndex) {
  //     if (uniqueId) {
  //       str.push(`${rootKey}[${index}].${groupValue}.${uniqueId}`);
  //     } else {
  //       str.push(`${rootKey}[${index}].${groupValue}`);
  //     }
  //   }

  //   return `${str.join('.')}`;
  // };

  const handleAddRule = (args: AddArgs) => {
    const { level, groupValue, groupIndex } = args;
    const filtersCopy = clone(filters);

    const path = getRulePath(level, groupIndex, groupValue);

    const updatedFilters = setWith(
      filtersCopy,
      path,
      [...get(filtersCopy, path), { contains: { title: '', uniqueId: nanoid() } }],
      clone,
    );

    setFilterHandler(updatedFilters);
  };

  const handleDeleteRule = (args: DeleteArgs) => {
    const { uniqueId, level, groupIndex, groupValue } = args;
    const filtersCopy = clone(filters);

    const path = getRulePath(level, groupIndex, groupValue);

    const dataAtPath = get(filtersCopy, path);
    const lv = groupIndex[level - 1];
    const removed = [...dataAtPath.slice(0, lv), ...dataAtPath.slice(lv + 1)];

    console.log('removed :>> ', removed);

    const updatedFilters = setWith(filtersCopy, path, removed, clone);

    setFilterHandler(updatedFilters);
  };

  const handleChangeField = (args: any) => {
    const { uniqueId, level, groupIndex, value } = args;
    const filtersCopy = clone(filters);

    const path = getRulePath(level, groupIndex);

    console.log('path', path);

    const updatedFilters = setWith(
      filtersCopy,
      path,
      get(filtersCopy, path).map((rule: AdvancedFilterRule) => {
        if (rule.uniqueId !== uniqueId) return rule;
        // const defaultOperator = FILTER_OPTIONS_DATA.find(
        //   (option) => option.value === value,
        // )?.default;

        return {
          ...rule,
          field: value,
          // operator: defaultOperator || '',
          operator: '',
          value: '',
        };
      }),
      clone,
    );

    console.log('updatedFilters', updatedFilters);

    // setFilterHandler(updatedFilters);
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
      get(filtersCopy, path).map((rule: AdvancedFilterRule) => {
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
    const updatedFilters = setWith(
      filtersCopy,
      path,
      get(filtersCopy, path).map((rule: AdvancedFilterRule) => {
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
    <>
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
    </>
  );
});
