import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { ListConfigTable } from '/@/renderer/features/shared/components/list-config-menu';
import {
    DataGridProps,
    ItemListSettings,
    useSettingsStore,
    useSettingsStoreActions,
} from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Badge } from '/@/shared/components/badge/badge';
import { Checkbox } from '/@/shared/components/checkbox/checkbox';
import { Group } from '/@/shared/components/group/group';
import { SegmentedControl } from '/@/shared/components/segmented-control/segmented-control';
import { Slider } from '/@/shared/components/slider/slider';
import { ItemListKey, ListPaginationType } from '/@/shared/types/types';

type GridConfigProps = {
    extraOptions?: {
        component: React.ReactNode;
        id: string;
        label: string;
    }[];
    listKey: ItemListKey;
};

export const GridConfig = ({ extraOptions, listKey }: GridConfigProps) => {
    const { t } = useTranslation();

    const list = useSettingsStore((state) => state.lists[listKey]) as ItemListSettings;
    const grid = list.grid as DataGridProps;
    const { setList } = useSettingsStoreActions();

    const options = useMemo(() => {
        return [
            {
                component: (
                    <SegmentedControl
                        data={[
                            {
                                label: t('table.config.general.pagination_infinite', {
                                    postProcess: 'sentenceCase',
                                }),
                                value: ListPaginationType.INFINITE,
                            },
                            {
                                label: t('table.config.general.pagination_paginate', {
                                    postProcess: 'sentenceCase',
                                }),
                                value: ListPaginationType.PAGINATED,
                            },
                        ]}
                        onChange={(value) =>
                            setList(listKey, {
                                ...list,
                                pagination: value as ListPaginationType,
                            })
                        }
                        size="sm"
                        value={list.pagination}
                        w="100%"
                    />
                ),
                id: 'pagination',
                label: t('table.config.general.pagination', { postProcess: 'sentenceCase' }),
                size: 'sm',
            },
            {
                component: (
                    <Slider
                        defaultValue={list.itemsPerPage}
                        marks={[
                            { value: 25 },
                            { value: 50 },
                            { value: 100 },
                            { value: 150 },
                            { value: 200 },
                            { value: 250 },
                            { value: 300 },
                            { value: 400 },
                            { value: 500 },
                        ]}
                        max={500}
                        min={25}
                        onChangeEnd={(value) => setList(listKey, { ...list, itemsPerPage: value })}
                        restrictToMarks
                        w="100%"
                    />
                ),
                id: 'itemsPerPage',
                label: (
                    <Group>
                        {t('table.config.general.pagination_itemsPerPage', {
                            postProcess: 'sentenceCase',
                        })}
                        <Badge>{list.itemsPerPage}</Badge>
                    </Group>
                ),
            },
            {
                component: (
                    <Group gap="xs" grow w="100%">
                        <ActionIcon
                            disabled={grid.itemGap === 'xl'}
                            icon="arrowUp"
                            iconProps={{ size: 'lg' }}
                            onClick={() => {
                                if (grid.itemGap === 'xl') return;

                                if (grid.itemGap === 'lg') {
                                    return setList(listKey, { grid: { itemGap: 'xl' } });
                                }

                                if (grid.itemGap === 'md') {
                                    return setList(listKey, { grid: { itemGap: 'lg' } });
                                }

                                if (grid.itemGap === 'sm') {
                                    return setList(listKey, { grid: { itemGap: 'md' } });
                                }

                                return setList(listKey, { grid: { itemGap: 'sm' } });
                            }}
                            size="xs"
                        />
                        <ActionIcon
                            disabled={grid.itemGap === 'xs'}
                            icon="arrowDown"
                            iconProps={{ size: 'lg' }}
                            onClick={() => {
                                if (grid.itemGap === 'xs') return;

                                if (grid.itemGap === 'sm') {
                                    return setList(listKey, { grid: { itemGap: 'xs' } });
                                }

                                if (grid.itemGap === 'md') {
                                    return setList(listKey, { grid: { itemGap: 'sm' } });
                                }

                                if (grid.itemGap === 'lg') {
                                    return setList(listKey, { grid: { itemGap: 'md' } });
                                }

                                return setList(listKey, { grid: { itemGap: 'lg' } });
                            }}
                            size="xs"
                        />
                    </Group>
                ),
                id: 'itemGap',
                label: (
                    <Group>
                        {t('table.config.general.gap', { postProcess: 'sentenceCase' })}
                        <Badge>{grid.itemGap}</Badge>
                    </Group>
                ),
            },
            {
                component: (
                    <Slider
                        defaultValue={grid.itemsPerRow}
                        max={20}
                        min={2}
                        onChangeEnd={(value) => setList(listKey, { grid: { itemsPerRow: value } })}
                        w="100%"
                    />
                ),
                id: 'itemsPerRow',
                label: (
                    <Group justify="space-between" w="100%" wrap="nowrap">
                        <Group>
                            {t('table.config.general.itemsPerRow', { postProcess: 'sentenceCase' })}
                            <Badge>{grid.itemsPerRow}</Badge>
                        </Group>
                        <Checkbox
                            checked={grid.itemsPerRowEnabled}
                            label={t('common.enable', { postProcess: 'titleCase' })}
                            onChange={(e) =>
                                setList(listKey, {
                                    grid: { itemsPerRowEnabled: e.target.checked },
                                })
                            }
                            pr="md"
                            size="xs"
                        />
                    </Group>
                ),
            },

            ...(extraOptions || []),
        ];
    }, [list, t, grid, extraOptions, setList, listKey]);

    return <ListConfigTable options={options} />;
};
