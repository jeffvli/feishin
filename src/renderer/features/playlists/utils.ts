import { nanoid } from 'nanoid/non-secure';
import { NDSongQueryFields } from '/@/renderer/api/navidrome.types';
import { QueryBuilderGroup } from '/@/renderer/types';

export const parseQueryBuilderChildren = (groups: QueryBuilderGroup[], data: any[]) => {
  if (groups.length === 0) {
    return data;
  }

  const filterGroups: any[] = [];

  for (const group of groups) {
    const rootType = group.type;
    const query: any = {
      [rootType]: [],
    };

    for (const rule of group.rules) {
      if (rule.field && rule.operator) {
        const [table, field] = rule.field.split('.');
        const operator = rule.operator;
        const value = field !== 'releaseDate' ? rule.value : new Date(rule.value);

        switch (table) {
          default:
            query[rootType].push({
              [operator]: {
                [table]: value,
              },
            });
            break;
        }
      }
    }

    if (group.group.length > 0) {
      const b = parseQueryBuilderChildren(group.group, data);
      b.forEach((c) => query[rootType].push(c));
    }

    data.push(query);
    filterGroups.push(query);
  }

  return filterGroups;
};

// Convert QueryBuilderGroup to default query
export const convertQueryGroupToNDQuery = (filter: QueryBuilderGroup) => {
  const rootQueryType = filter.type;
  const rootQuery = {
    [rootQueryType]: [] as any[],
  };

  for (const rule of filter.rules) {
    if (rule.field && rule.operator) {
      const [field] = rule.field.split('.');
      const operator = rule.operator;
      let value = rule.value;

      const booleanFields = NDSongQueryFields.filter(
        (queryField) => queryField.type === 'boolean',
      ).map((field) => field.value);

      // Convert string values to boolean
      if (booleanFields.includes(field)) {
        value = value === 'true';
      }

      switch (field) {
        default:
          rootQuery[rootQueryType].push({
            [operator]: {
              [field]: value,
            },
          });
          break;
      }
    }
  }

  const groups = parseQueryBuilderChildren(filter.group, []);
  for (const group of groups) {
    rootQuery[rootQueryType].push(group);
  }

  return rootQuery;
};

// Convert default query to QueryBuilderGroup
export const convertNDQueryToQueryGroup = (query: Record<string, any>) => {
  const rootType = Object.keys(query)[0];
  const rootGroup: QueryBuilderGroup = {
    group: [],
    rules: [],
    type: rootType as 'any' | 'all',
    uniqueId: nanoid(),
  };

  for (const rule of query[rootType]) {
    if (rule.any || rule.all) {
      const group = convertNDQueryToQueryGroup(rule);
      rootGroup.group.push(group);
    } else {
      const operator = Object.keys(rule)[0];
      const field = Object.keys(rule[operator])[0];
      let value = rule[operator][field];

      const booleanFields = NDSongQueryFields.filter(
        (queryField) => queryField.type === 'boolean',
      ).map((field) => field.value);

      // Convert boolean values to string
      if (booleanFields.includes(field)) {
        value = value.toString();
      }

      rootGroup.rules.push({
        field,
        operator,
        uniqueId: nanoid(),
        value,
      });
    }
  }

  return rootGroup;
};
