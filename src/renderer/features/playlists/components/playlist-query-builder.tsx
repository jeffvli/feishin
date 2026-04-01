import { useQuery } from '@tanstack/react-query';
import clone from 'lodash/clone';
import get from 'lodash/get';
import setWith from 'lodash/setWith';
import { nanoid } from 'nanoid';
import {
    forwardRef,
    Ref,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useState,
} from 'react';
import { useTranslation } from 'react-i18next';

import { QueryBuilder } from '/@/renderer/components/query-builder';
import { playlistsQueries } from '/@/renderer/features/playlists/api/playlists-api';
import { convertNDQueryToQueryGroup } from '/@/renderer/features/playlists/utils';
import { useCurrentServer } from '/@/renderer/store';
import { useQueryBuilderSettings } from '/@/renderer/store/settings.store';
import {
    NDSongQueryBooleanOperators,
    NDSongQueryDateOperators,
    NDSongQueryFields,
    NDSongQueryNumberOperators,
    NDSongQueryPlaylistOperators,
    NDSongQueryStringOperators,
} from '/@/shared/api/navidrome/navidrome-types';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { ScrollArea } from '/@/shared/components/scroll-area/scroll-area';
import { SegmentedControl } from '/@/shared/components/segmented-control/segmented-control';
import { Select } from '/@/shared/components/select/select';
import { Stack } from '/@/shared/components/stack/stack';
import { useForm } from '/@/shared/hooks/use-form';
import { PlaylistListSort, SongListSort, SortOrder } from '/@/shared/types/domain-types';
import { QueryBuilderGroup, QueryBuilderRule } from '/@/shared/types/types';

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
    limit?: number;
    limitPercent?: number;
    playlistId?: string;
    query: any;
    sortBy: SongListSort | SongListSort[];
    sortOrder: 'asc' | 'desc';
}

type SortEntry = {
    field: string;
    order: 'asc' | 'desc';
};

const DEFAULT_QUERY: QueryBuilderGroup = {
    group: [],
    rules: [
        {
            field: '',
            operator: '',
            uniqueId: nanoid(),
            value: '',
        },
    ],
    type: 'all',
    uniqueId: nanoid(),
};

// Utility functions for path building
const getGroupPath = (level: number, groupIndex: number[]): string => {
    if (level === 0) return 'group';
    return `${groupIndex.map((idx) => `group[${idx}]`).join('.')}.group`;
};

const getTypePath = (groupIndex: number[]): string => {
    return groupIndex.map((idx) => `group[${idx}]`).join('.');
};

const getRulePath = (level: number, groupIndex: number[]): string => {
    if (level === 0) return 'rules';
    return `${groupIndex.map((idx) => `group[${idx}]`).join('.')}.rules`;
};

// Parse sortBy and sortOrder into array of sort entries
const parseSortEntries = (
    sortBy: SongListSort | SongListSort[],
    sortOrder: 'asc' | 'desc',
): SortEntry[] => {
    if (Array.isArray(sortBy) && sortBy.length > 0) {
        const firstSort = sortBy[0];
        // Check if first entry is a string with commas (new syntax as single string)
        if (typeof firstSort === 'string' && firstSort.includes(',')) {
            return firstSort.split(',').map((s) => {
                const trimmed = s.trim();
                const field =
                    trimmed.startsWith('+') || trimmed.startsWith('-') ? trimmed.slice(1) : trimmed;
                const order = trimmed.startsWith('-') ? 'desc' : 'asc';
                return { field, order };
            });
        }
        // Check if first entry has +/- prefix (new syntax as array of prefixed strings)
        if (
            typeof firstSort === 'string' &&
            (firstSort.startsWith('+') || firstSort.startsWith('-'))
        ) {
            return sortBy.map((s) => {
                const field = s.startsWith('+') || s.startsWith('-') ? s.slice(1) : s;
                const order = s.startsWith('-') ? 'desc' : 'asc';
                return { field, order };
            });
        }
        // Old syntax: array of fields with single order
        return sortBy.map((field) => ({ field, order: sortOrder }));
    }
    if (sortBy && typeof sortBy === 'string') {
        // Check if it's new syntax with +/- prefix
        if (sortBy.includes(',') || sortBy.startsWith('+') || sortBy.startsWith('-')) {
            return sortBy.split(',').map((s) => {
                const trimmed = s.trim();
                const field =
                    trimmed.startsWith('+') || trimmed.startsWith('-') ? trimmed.slice(1) : trimmed;
                const order = trimmed.startsWith('-') ? 'desc' : 'asc';
                return { field, order };
            });
        }
        // Single field, use provided sortOrder
        return [{ field: sortBy, order: sortOrder }];
    }
    // Default
    return [{ field: 'dateAdded', order: 'asc' }];
};

// Convert sort entries to new syntax: comma-separated with +/- prefix
const convertSortEntriesToSortString = (entries: SortEntry[]): string => {
    return entries
        .filter((entry) => entry.field)
        .map((entry) => {
            const prefix = entry.order === 'desc' ? '-' : '+';
            return `${prefix}${entry.field}`;
        })
        .join(',');
};

export type PlaylistQueryBuilderRef = {
    getFilters: () => {
        extraFilters: {
            limit?: number;
            limitPercent?: number;
            sortBy?: string[];
            sortOrder?: string;
        };
        filters: QueryBuilderGroup;
    };
};

export const PlaylistQueryBuilder = forwardRef(
    (
        { limit, limitPercent, playlistId, query, sortBy, sortOrder }: PlaylistQueryBuilderProps,
        ref: Ref<PlaylistQueryBuilderRef>,
    ) => {
        const { t } = useTranslation();
        const server = useCurrentServer();
        const queryBuilderSettings = useQueryBuilderSettings();

        // Memoize initial filters to avoid recalculation
        const initialFilters = useMemo(
            () => (query ? convertNDQueryToQueryGroup(query) : DEFAULT_QUERY),
            [query],
        );

        const [filters, setFilters] = useState<QueryBuilderGroup>(initialFilters);

        // Update filters when query changes
        useEffect(() => {
            if (query) {
                setFilters(convertNDQueryToQueryGroup(query));
            }
        }, [query]);

        const { data: playlists } = useQuery(
            playlistsQueries.list({
                query: { sortBy: PlaylistListSort.NAME, sortOrder: SortOrder.ASC, startIndex: 0 },
                serverId: server?.id,
            }),
        );

        const playlistData = useMemo(() => {
            if (!playlists) return [];

            return playlists.items
                .filter((p) => !playlistId || p.id !== playlistId)
                .map((p) => ({
                    label: p.name,
                    value: p.id,
                }));
        }, [playlistId, playlists]);

        // Memoize parsed sort entries
        const initialSortEntries = useMemo(
            () => parseSortEntries(sortBy, sortOrder),
            [sortBy, sortOrder],
        );

        const extraFiltersForm = useForm({
            initialValues: {
                limit,
                limitMode: limitPercent != null ? 'limitPercent' : 'limit',
                limitPercent,
                sortEntries: initialSortEntries,
            },
        });

        useImperativeHandle(
            ref,
            () => ({
                getFilters: () => {
                    const sortString = convertSortEntriesToSortString(
                        extraFiltersForm.values.sortEntries,
                    );
                    const isLimitPercent = extraFiltersForm.values.limitMode === 'limitPercent';
                    return {
                        extraFilters: {
                            limit: isLimitPercent ? undefined : extraFiltersForm.values.limit,
                            limitPercent: isLimitPercent
                                ? extraFiltersForm.values.limitPercent
                                : undefined,
                            sortBy: sortString ? [sortString] : undefined,
                        },
                        filters,
                    };
                },
            }),
            [
                extraFiltersForm.values.sortEntries,
                extraFiltersForm.values.limit,
                extraFiltersForm.values.limitMode,
                extraFiltersForm.values.limitPercent,
                filters,
            ],
        );

        const handleResetFilters = useCallback(() => {
            setFilters(query ? convertNDQueryToQueryGroup(query) : DEFAULT_QUERY);
        }, [query]);

        const handleClearFilters = useCallback(() => {
            setFilters(DEFAULT_QUERY);
        }, []);

        const handleAddRuleGroup = useCallback((args: AddArgs) => {
            const { groupIndex, level } = args;
            const path = getGroupPath(level, groupIndex);

            setFilters((prev) => {
                const currentGroups = get(prev, path) || [];
                return setWith(
                    clone(prev),
                    path,
                    [
                        ...currentGroups,
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
            });
        }, []);

        const handleDeleteRuleGroup = useCallback((args: DeleteArgs) => {
            const { groupIndex, level, uniqueId } = args;
            const path = level === 0 ? 'group' : getGroupPath(level - 1, groupIndex.slice(0, -1));

            setFilters((prev) => {
                const currentGroups = get(prev, path);
                if (!Array.isArray(currentGroups)) {
                    return prev;
                }
                return setWith(
                    clone(prev),
                    path,
                    currentGroups.filter((group: QueryBuilderGroup) => group.uniqueId !== uniqueId),
                    clone,
                );
            });
        }, []);

        const handleAddRule = useCallback((args: AddArgs) => {
            const { groupIndex, level } = args;
            const path = getRulePath(level, groupIndex);

            setFilters((prev) => {
                const currentRules = get(prev, path) || [];
                return setWith(
                    clone(prev),
                    path,
                    [
                        ...currentRules,
                        {
                            field: '',
                            operator: '',
                            uniqueId: nanoid(),
                            value: null,
                        },
                    ],
                    clone,
                );
            });
        }, []);

        const handleDeleteRule = useCallback((args: DeleteArgs) => {
            const { groupIndex, level, uniqueId } = args;
            const path = getRulePath(level, groupIndex);

            setFilters((prev) => {
                const currentRules = get(prev, path) || [];
                return setWith(
                    clone(prev),
                    path,
                    currentRules.filter((rule: QueryBuilderRule) => rule.uniqueId !== uniqueId),
                    clone,
                );
            });
        }, []);

        const handleChangeField = useCallback((args: any) => {
            const { groupIndex, level, uniqueId, value } = args;
            const path = getRulePath(level, groupIndex);

            setFilters((prev) => {
                const currentRules = get(prev, path) || [];
                return setWith(
                    clone(prev),
                    path,
                    currentRules.map((rule: QueryBuilderRule) => {
                        if (rule.uniqueId !== uniqueId) return rule;
                        return {
                            ...rule,
                            field: value,
                            operator: '',
                            value: '',
                        };
                    }),
                    clone,
                );
            });
        }, []);

        const handleChangeType = useCallback((args: any) => {
            const { groupIndex, level, value } = args;

            if (level === 0) {
                setFilters((prev) => ({ ...prev, type: value }));
                return;
            }

            const path = getTypePath(groupIndex);
            setFilters((prev) =>
                setWith(
                    clone(prev),
                    path,
                    {
                        ...get(prev, path),
                        type: value,
                    },
                    clone,
                ),
            );
        }, []);

        const handleChangeOperator = useCallback((args: any) => {
            const { groupIndex, level, uniqueId, value } = args;
            const path = getRulePath(level, groupIndex);

            setFilters((prev) => {
                const currentRules = get(prev, path) || [];
                return setWith(
                    clone(prev),
                    path,
                    currentRules.map((rule: QueryBuilderRule) => {
                        if (rule.uniqueId !== uniqueId) return rule;
                        return {
                            ...rule,
                            operator: value,
                        };
                    }),
                    clone,
                );
            });
        }, []);

        const handleChangeValue = useCallback((args: any) => {
            const { groupIndex, level, uniqueId, value } = args;
            const path = getRulePath(level, groupIndex);

            setFilters((prev) => {
                const currentRules = get(prev, path) || [];
                return setWith(
                    clone(prev),
                    path,
                    currentRules.map((rule: QueryBuilderRule) => {
                        if (rule.uniqueId !== uniqueId) return rule;
                        return {
                            ...rule,
                            value,
                        };
                    }),
                    clone,
                );
            });
        }, []);

        const customFields = useMemo(() => {
            return queryBuilderSettings.tag
                .filter((field) => field.value && field.value.trim() !== '')
                .map((field) => ({
                    label: field.label,
                    type: field.type,
                    value: field.value,
                }));
        }, [queryBuilderSettings.tag]);

        const groupedFilters = useMemo(() => {
            type FilterGroup = {
                group: string;
                items: Array<{ label: string; type: string; value: string }>;
            };
            const groups: FilterGroup[] = [];

            // Custom Fields group
            if (customFields.length > 0) {
                groups.push({
                    group: t('queryBuilder.customTags', {
                        postProcess: 'titleCase',
                    }),
                    items: customFields,
                });
            }

            // Standard Fields group
            if (NDSongQueryFields.length > 0) {
                groups.push({
                    group: t('queryBuilder.standardTags', {
                        postProcess: 'titleCase',
                    }),
                    items: NDSongQueryFields,
                });
            }

            if (groups.length === 0) {
                return NDSongQueryFields;
            }

            if (groups.length === 1) {
                return groups[0].items;
            }

            return groups;
        }, [customFields, t]);

        // Memoize sort options
        const sortOptions = useMemo(
            () => [
                {
                    label: t('filter.random', { postProcess: 'titleCase' }),
                    type: 'string',
                    value: 'random',
                },
                ...NDSongQueryFields,
            ],
            [t],
        );

        // Memoize order select data
        const orderSelectData = useMemo(
            () => [
                {
                    label: t('common.ascending', { postProcess: 'sentenceCase' }),
                    value: 'asc',
                },
                {
                    label: t('common.descending', { postProcess: 'sentenceCase' }),
                    value: 'desc',
                },
            ],
            [t],
        );

        // Memoize operators object
        const operators = useMemo(
            () => ({
                boolean: NDSongQueryBooleanOperators,
                date: NDSongQueryDateOperators,
                number: NDSongQueryNumberOperators,
                playlist: NDSongQueryPlaylistOperators,
                string: NDSongQueryStringOperators,
            }),
            [],
        );

        const handleAddSortEntry = useCallback(() => {
            extraFiltersForm.insertListItem('sortEntries', { field: '', order: 'asc' });
        }, [extraFiltersForm]);

        const handleRemoveSortEntry = useCallback(
            (index: number) => {
                extraFiltersForm.removeListItem('sortEntries', index);
            },
            [extraFiltersForm],
        );

        const handleSortFieldChange = useCallback(
            (index: number, value: string) => {
                extraFiltersForm.setFieldValue(`sortEntries.${index}.field`, value);
            },
            [extraFiltersForm],
        );

        const handleSortOrderChange = useCallback(
            (index: number, value: 'asc' | 'desc') => {
                extraFiltersForm.setFieldValue(`sortEntries.${index}.order`, value);
            },
            [extraFiltersForm],
        );

        return (
            <Flex direction="column" h="100%" w="100%">
                <ScrollArea style={{ height: '100%' }}>
                    <Stack gap="md" h="100%" p="1rem">
                        <QueryBuilder
                            data={filters}
                            filters={groupedFilters}
                            groupIndex={[]}
                            level={0}
                            onAddRule={handleAddRule}
                            onAddRuleGroup={handleAddRuleGroup}
                            onChangeField={handleChangeField}
                            onChangeOperator={handleChangeOperator}
                            onChangeType={handleChangeType}
                            onChangeValue={handleChangeValue}
                            onClearFilters={handleClearFilters}
                            onDeleteRule={handleDeleteRule}
                            onDeleteRuleGroup={handleDeleteRuleGroup}
                            onResetFilters={handleResetFilters}
                            operators={operators}
                            playlists={playlistData}
                            uniqueId={filters.uniqueId}
                        />
                        <Group align="flex-end" gap="sm" w="100%" wrap="nowrap">
                            <Stack gap="xs" w="100%">
                                {extraFiltersForm.values.sortEntries.map((entry, index) => (
                                    <Group align="flex-end" gap="sm" key={index} wrap="nowrap">
                                        <Select
                                            data={sortOptions}
                                            label={
                                                index === 0
                                                    ? t('common.sort', { postProcess: 'titleCase' })
                                                    : ''
                                            }
                                            onChange={(value) =>
                                                handleSortFieldChange(index, value || '')
                                            }
                                            searchable
                                            value={entry.field}
                                            width={200}
                                        />
                                        <Select
                                            data={orderSelectData}
                                            label={
                                                index === 0
                                                    ? t('common.sortOrder', {
                                                          postProcess: 'titleCase',
                                                      })
                                                    : ''
                                            }
                                            onChange={(value) =>
                                                handleSortOrderChange(
                                                    index,
                                                    (value as 'asc' | 'desc') || 'asc',
                                                )
                                            }
                                            value={entry.order}
                                            width={125}
                                        />
                                        {extraFiltersForm.values.sortEntries.length > 1 && (
                                            <ActionIcon
                                                icon="minus"
                                                onClick={() => handleRemoveSortEntry(index)}
                                                variant="subtle"
                                            />
                                        )}
                                        {index ===
                                            extraFiltersForm.values.sortEntries.length - 1 && (
                                            <ActionIcon
                                                icon="plus"
                                                onClick={handleAddSortEntry}
                                                variant="subtle"
                                            />
                                        )}
                                    </Group>
                                ))}
                            </Stack>
                            <NumberInput
                                label={
                                    <Group align="center" gap="xs" wrap="nowrap">
                                        {t('common.limit', { postProcess: 'titleCase' })}
                                        <SegmentedControl
                                            data={[
                                                { label: '#', value: 'limit' },
                                                { label: '%', value: 'limitPercent' },
                                            ]}
                                            onChange={(value) =>
                                                extraFiltersForm.setFieldValue(
                                                    'limitMode',
                                                    value as 'limit' | 'limitPercent',
                                                )
                                            }
                                            size="xs"
                                            value={extraFiltersForm.values.limitMode}
                                        />
                                    </Group>
                                }
                                max={
                                    extraFiltersForm.values.limitMode === 'limitPercent'
                                        ? 100
                                        : undefined
                                }
                                min={
                                    extraFiltersForm.values.limitMode === 'limitPercent'
                                        ? 0
                                        : undefined
                                }
                                onChange={(value) => {
                                    const nextValue =
                                        value === '' || value == null ? undefined : Number(value);
                                    if (extraFiltersForm.values.limitMode === 'limitPercent') {
                                        extraFiltersForm.setFieldValue('limitPercent', nextValue);
                                    } else {
                                        extraFiltersForm.setFieldValue('limit', nextValue);
                                    }
                                }}
                                value={
                                    extraFiltersForm.values.limitMode === 'limitPercent'
                                        ? extraFiltersForm.values.limitPercent
                                        : extraFiltersForm.values.limit
                                }
                                width={75}
                            />
                        </Group>
                    </Stack>
                </ScrollArea>
            </Flex>
        );
    },
);
