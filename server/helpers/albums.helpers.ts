import { AuthUser } from '@/middleware';
import { SortOrder } from '@/types/types';
import { songHelpers } from '@helpers/songs.helpers';

export enum AlbumSort {
  DATE_ADDED = 'added',
  DATE_ADDED_REMOTE = 'addedRemote',
  DATE_RELEASED = 'released',
  DATE_RELEASED_YEAR = 'year',
  FAVORITE = 'favorite',
  NAME = 'name',
  RANDOM = 'random',
  RATING = 'rating',
}

const include = (user: AuthUser, options: { songs?: boolean }) => {
  // Prisma.AlbumInclude
  const props = {
    _count: {
      select: {
        favorites: true,
        songs: true,
      },
    },
    albumArtists: true,
    artists: true,
    favorites: { where: { userId: user?.id } },
    genres: true,
    images: true,
    ratings: {
      where: {
        userId: user?.id,
      },
    },
    server: true,
    serverFolders: { where: { enabled: true } },
    songs: options?.songs && songHelpers.findMany(user),
  };

  return props;
};

const sort = (sortBy: AlbumSort, orderBy: SortOrder) => {
  let order;

  switch (sortBy) {
    case AlbumSort.NAME:
      order = { name: orderBy };
      break;

    case AlbumSort.DATE_ADDED:
      order = { createdAt: orderBy };
      break;

    case AlbumSort.DATE_ADDED_REMOTE:
      order = { remoteCreatedAt: orderBy };
      break;

    case AlbumSort.DATE_RELEASED:
      order = { releaseDate: orderBy };
      break;

    case AlbumSort.DATE_RELEASED_YEAR:
      order = { releaseYear: orderBy };
      break;

    case AlbumSort.RATING:
      order = { rating: orderBy };
      break;

    case AlbumSort.FAVORITE:
      order = { favorite: orderBy };
      break;

    default:
      order = { title: orderBy };
      break;
  }

  return order;
};

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

const operatorMap = {
  '!=': 'not',
  '!~': 'contains',
  $: 'endsWith',
  '<': 'lt',
  '<=': 'lte',
  '=': 'equals',
  '>': 'gt',
  '>=': 'gte',
  '^': 'startsWith',
  '~': 'contains',
};

const insensitiveFields = ['name'];

const advancedFilterGroup = (
  groups: AdvancedFilterGroup[],
  user: AuthUser,
  data: any[]
) => {
  if (groups.length === 0) {
    return data;
  }

  const filterGroups: any[] = [];

  for (const group of groups) {
    const rootType = group.type.toUpperCase();
    const query: any = {
      [rootType]: [],
    };

    for (const rule of group.rules) {
      if (rule.field && rule.operator) {
        const [table, field, relationField] = rule.field.split('.');
        const condition = rule.operator === '!~' ? 'none' : 'some';
        const op = operatorMap[rule.operator as keyof typeof operatorMap];

        switch (table) {
          case 'albums':
            if (field === 'ratings') {
              query[rootType].push({
                [field]: {
                  [condition]: {
                    [relationField]: {
                      [op]: rule.value,
                    },
                    userId: user.id,
                  },
                },
              });
              break;
            }

            query[rootType].push({
              [field]: {
                mode: insensitiveFields.includes(field)
                  ? 'insensitive'
                  : undefined,
                [op]: rule.value,
              },
            });
            break;

          default:
            if (field === 'ratings') {
              query[rootType].push({
                [table]: {
                  some: {
                    [field]: {
                      some: {
                        [relationField]: {
                          [op]: rule.value,
                        },
                        userId: user.id,
                      },
                    },
                  },
                },
              });
              break;
            }

            query[rootType].push({
              [table]: {
                [condition]: {
                  [field]: {
                    mode: 'insensitive',
                    [op]: rule.value,
                  },
                },
              },
            });
            break;
        }
      }
    }

    if (group.group.length > 0) {
      const b = advancedFilterGroup(group.group, user, data);
      b.forEach((c) => query[rootType].push(c));
    }

    data.push(query);
    filterGroups.push(query);
  }

  return filterGroups;
};

const advancedFilter = (filter: AdvancedFilterGroup, user: AuthUser) => {
  const rootQueryType = filter.type.toUpperCase();
  const rootQuery = {
    [rootQueryType]: [] as any[],
  };

  for (const rule of filter.rules) {
    if (rule.field && rule.operator) {
      let [table, field, relationField] = rule.field.split('.');
      const condition = rule.operator === '!~' ? 'none' : 'some';
      const op = operatorMap[rule.operator as keyof typeof operatorMap];

      switch (table) {
        case 'albums':
          if (field === 'ratings') {
            rootQuery[rootQueryType].push({
              [field]: {
                [condition]: {
                  [relationField]: {
                    [op]: rule.value,
                  },
                  userId: user.id,
                },
              },
            });
            break;
          }

          rootQuery[rootQueryType].push({
            [field]: {
              mode: insensitiveFields.includes(field)
                ? 'insensitive'
                : undefined,
              [op]: rule.value,
            },
          });
          break;

        default:
          if (field === 'ratings') {
            rootQuery[rootQueryType].push({
              [table]: {
                some: {
                  [field]: {
                    some: {
                      [relationField]: {
                        [op]: rule.value,
                      },
                      userId: user.id,
                    },
                  },
                },
              },
            });
            break;
          }

          rootQuery[rootQueryType].push({
            [table]: {
              [condition]: {
                [field]: {
                  mode: 'insensitive',
                  [op]: rule.value,
                },
              },
            },
          });
          break;
      }
    }
  }

  const groups = advancedFilterGroup(filter.group, user, []);
  for (const group of groups) {
    rootQuery[rootQueryType].push(group);
  }

  return rootQuery;
};

export const albumHelpers = {
  advancedFilter,
  include,
  sort,
};
