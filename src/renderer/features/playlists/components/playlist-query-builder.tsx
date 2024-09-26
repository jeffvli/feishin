import { forwardRef, Ref, useImperativeHandle, useMemo, useState } from 'react';
import { Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { openModal } from '@mantine/modals';
import clone from 'lodash/clone';
import get from 'lodash/get';
import setWith from 'lodash/setWith';
import { nanoid } from 'nanoid';
import {
    Button,
    DropdownMenu,
    MotionFlex,
    NumberInput,
    QueryBuilder,
    ScrollArea,
    Select,
} from '/@/renderer/components';
import {
    convertNDQueryToQueryGroup,
    convertQueryGroupToNDQuery,
} from '/@/renderer/features/playlists/utils';
import { QueryBuilderGroup, QueryBuilderRule } from '/@/renderer/types';
import { useTranslation } from 'react-i18next';
import { RiMore2Fill, RiSaveLine } from 'react-icons/ri';
import { PlaylistListSort, SongListSort, SortOrder } from '/@/renderer/api/types';
import {
    NDSongQueryBooleanOperators,
    NDSongQueryDateOperators,
    NDSongQueryFields,
    NDSongQueryNumberOperators,
    NDSongQueryPlaylistOperators,
    NDSongQueryStringOperators,
} from '/@/renderer/api/navidrome.types';
import { usePlaylistList } from '/@/renderer/features/playlists/queries/playlist-list-query';
import { useCurrentServer } from '/@/renderer/store';
import { JsonPreview } from '/@/renderer/features/shared/components/json-preview';

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
    isSaving?: boolean;
    limit?: number;
    onSave?: (
        parsedFilter: any,
        extraFilters: { limit?: number; sortBy?: string; sortOrder?: string },
    ) => void;
    onSaveAs?: (
        parsedFilter: any,
        extraFilters: { limit?: number; sortBy?: string; sortOrder?: string },
    ) => void;
    playlistId?: string;
    query: any;
    sortBy: SongListSort;
    sortOrder: 'asc' | 'desc';
}

const DEFAULT_QUERY = {
    group: [],
    rules: [
        {
            field: '',
            operator: '',
            uniqueId: nanoid(),
            value: '',
        },
    ],
    type: 'all' as 'all' | 'any',
    uniqueId: nanoid(),
};

export type PlaylistQueryBuilderRef = {
    getFilters: () => {
        extraFilters: {
            limit?: number;
            sortBy?: string;
            sortOrder?: string;
        };
        filters: QueryBuilderGroup;
    };
};

export const PlaylistQueryBuilder = forwardRef(
    (
        {
            sortOrder,
            sortBy,
            limit,
            isSaving,
            query,
            onSave,
            onSaveAs,
            playlistId,
        }: PlaylistQueryBuilderProps,
        ref: Ref<PlaylistQueryBuilderRef>,
    ) => {
        const { t } = useTranslation();
        const server = useCurrentServer();
        const [filters, setFilters] = useState<QueryBuilderGroup>(
            query ? convertNDQueryToQueryGroup(query) : DEFAULT_QUERY,
        );

        const { data: playlists } = usePlaylistList({
            query: { sortBy: PlaylistListSort.NAME, sortOrder: SortOrder.ASC, startIndex: 0 },
            serverId: server?.id,
        });

        const playlistData = useMemo(() => {
            if (!playlists) return [];

            return playlists.items
                .filter((p) => {
                    if (!playlistId) return true;
                    return p.id !== playlistId;
                })
                .map((p) => ({
                    label: p.name,
                    value: p.id,
                }));
        }, [playlistId, playlists]);

        const extraFiltersForm = useForm({
            initialValues: {
                limit,
                sortBy,
                sortOrder,
            },
        });

        useImperativeHandle(ref, () => ({
            getFilters: () => ({
                extraFilters: extraFiltersForm.values,
                filters,
            }),
        }));

        const handleResetFilters = () => {
            if (query) {
                setFilters(convertNDQueryToQueryGroup(query));
            } else {
                setFilters(DEFAULT_QUERY);
            }
        };

        const handleClearFilters = () => {
            setFilters(DEFAULT_QUERY);
        };

        const setFilterHandler = (newFilters: QueryBuilderGroup) => {
            setFilters(newFilters);
        };

        const handleSave = () => {
            onSave?.(convertQueryGroupToNDQuery(filters), extraFiltersForm.values);
        };

        const handleSaveAs = () => {
            onSaveAs?.(convertQueryGroupToNDQuery(filters), extraFiltersForm.values);
        };

        const openPreviewModal = () => {
            const previewValue = convertQueryGroupToNDQuery(filters);

            openModal({
                children: <JsonPreview value={previewValue} />,
                size: 'xl',
                title: t('common.preview', { postProcess: 'titleCase' }),
            });
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
                        field: '',
                        operator: '',
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
                get(filtersCopy, path).filter(
                    (rule: QueryBuilderRule) => rule.uniqueId !== uniqueId,
                ),
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

        const sortOptions = [
            {
                label: t('filter.random', { postProcess: 'titleCase' }),
                type: 'string',
                value: 'random',
            },
            ...NDSongQueryFields,
        ];

        return (
            <MotionFlex
                direction="column"
                h="calc(100% - 3.5rem)"
                justify="space-between"
            >
                <ScrollArea
                    h="100%"
                    p="1rem"
                >
                    <QueryBuilder
                        data={filters}
                        filters={NDSongQueryFields}
                        groupIndex={[]}
                        level={0}
                        operators={{
                            boolean: NDSongQueryBooleanOperators,
                            date: NDSongQueryDateOperators,
                            number: NDSongQueryNumberOperators,
                            playlist: NDSongQueryPlaylistOperators,
                            string: NDSongQueryStringOperators,
                        }}
                        playlists={playlistData}
                        uniqueId={filters.uniqueId}
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
                    />
                </ScrollArea>
                <Group
                    noWrap
                    align="flex-end"
                    m="1rem"
                    position="apart"
                >
                    <Group
                        noWrap
                        spacing="sm"
                        w="100%"
                    >
                        <Select
                            searchable
                            data={sortOptions}
                            label="Sort"
                            maxWidth="20%"
                            width={150}
                            {...extraFiltersForm.getInputProps('sortBy')}
                        />
                        <Select
                            data={[
                                {
                                    label: t('common.ascending', { postProcess: 'sentenceCase' }),
                                    value: 'asc',
                                },
                                {
                                    label: t('common.descending', { postProcess: 'sentenceCase' }),
                                    value: 'desc',
                                },
                            ]}
                            label={t('common.sortOrder', { postProcess: 'titleCase' })}
                            maxWidth="20%"
                            width={125}
                            {...extraFiltersForm.getInputProps('sortOrder')}
                        />
                        <NumberInput
                            label={t('common.limit', { postProcess: 'titleCase' })}
                            maxWidth="20%"
                            width={75}
                            {...extraFiltersForm.getInputProps('limit')}
                        />
                    </Group>
                    {onSave && onSaveAs && (
                        <Group
                            noWrap
                            spacing="sm"
                        >
                            <Button
                                loading={isSaving}
                                variant="filled"
                                onClick={handleSaveAs}
                            >
                                {t('common.saveAs', { postProcess: 'titleCase' })}
                            </Button>
                            <Button
                                p="0.5em"
                                variant="default"
                                onClick={openPreviewModal}
                            >
                                {t('common.preview', { postProcess: 'titleCase' })}
                            </Button>
                            <DropdownMenu position="bottom-end">
                                <DropdownMenu.Target>
                                    <Button
                                        disabled={isSaving}
                                        p="0.5em"
                                        variant="default"
                                    >
                                        <RiMore2Fill size={15} />
                                    </Button>
                                </DropdownMenu.Target>
                                <DropdownMenu.Dropdown>
                                    <DropdownMenu.Item
                                        $danger
                                        icon={<RiSaveLine color="var(--danger-color)" />}
                                        onClick={handleSave}
                                    >
                                        {t('common.saveAndReplace', { postProcess: 'titleCase' })}
                                    </DropdownMenu.Item>
                                </DropdownMenu.Dropdown>
                            </DropdownMenu>
                        </Group>
                    )}
                </Group>
            </MotionFlex>
        );
    },
);
