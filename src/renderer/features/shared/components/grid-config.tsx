import {
    attachClosestEdge,
    type Edge,
    extractClosestEdge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import {
    draggable,
    dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { disableNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview';
import { useDebouncedState } from '@mantine/hooks';
import clsx from 'clsx';
import Fuse from 'fuse.js';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './table-config.module.css';

import { ListConfigTable } from '/@/renderer/features/shared/components/list-config-menu';
import {
    DataGridProps,
    ItemGridListRowConfig,
    ItemListSettings,
    useSettingsStore,
    useSettingsStoreActions,
} from '/@/renderer/store';
import { ActionIcon, ActionIconGroup } from '/@/shared/components/action-icon/action-icon';
import { Badge } from '/@/shared/components/badge/badge';
import { Checkbox } from '/@/shared/components/checkbox/checkbox';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { SegmentedControl } from '/@/shared/components/segmented-control/segmented-control';
import { Slider } from '/@/shared/components/slider/slider';
import { Stack } from '/@/shared/components/stack/stack';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Text } from '/@/shared/components/text/text';
import { dndUtils, DragData, DragOperation, DragTarget } from '/@/shared/types/drag-and-drop';
import { ItemListKey, ListPaginationType } from '/@/shared/types/types';

type GridConfigProps = {
    extraOptions?: {
        component: React.ReactNode;
        id: string;
        label: string;
    }[];
    gridRowsData: { label: string; value: string }[];
    listKey: ItemListKey;
};

export const GridConfig = ({ extraOptions, gridRowsData, listKey }: GridConfigProps) => {
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

    return (
        <>
            <ListConfigTable options={options} />
            <Divider />
            <GridRowConfig
                data={gridRowsData}
                listKey={listKey}
                onChange={(rows) => setList(listKey, { ...list, grid: { ...grid, rows } })}
                value={grid.rows}
            />
        </>
    );
};

const GridRowConfig = ({
    data,
    listKey,
    onChange,
    value,
}: {
    data: { label: string; value: string }[];
    listKey: ItemListKey;
    onChange: (value: ItemGridListRowConfig[]) => void;
    value: ItemGridListRowConfig[];
}) => {
    const { t } = useTranslation();

    const labelMap = useMemo(() => {
        return data.reduce(
            (acc, item) => {
                acc[item.value] = item.label;
                return acc;
            },
            {} as Record<string, string>,
        );
    }, [data]);

    console.log('data', data);
    console.log(labelMap);

    const handleChangeEnabled = useCallback(
        (item: ItemGridListRowConfig, checked: boolean) => {
            const value = useSettingsStore.getState().lists[listKey]?.grid.rows;
            if (!value) return;
            const index = value.findIndex((v) => v.id === item.id);
            const newValues = [...value];
            newValues[index] = { ...newValues[index], isEnabled: checked };
            onChange(newValues);
        },
        [listKey, onChange],
    );

    const handleMoveUp = useCallback(
        (item: ItemGridListRowConfig) => {
            const value = useSettingsStore.getState().lists[listKey]?.grid.rows;
            if (!value) return;
            const index = value.findIndex((v) => v.id === item.id);
            if (index === 0) return;
            const newValues = [...value];
            [newValues[index], newValues[index - 1]] = [newValues[index - 1], newValues[index]];
            onChange(newValues);
        },
        [listKey, onChange],
    );

    const handleMoveDown = useCallback(
        (item: ItemGridListRowConfig) => {
            const value = useSettingsStore.getState().lists[listKey]?.grid.rows;
            if (!value) return;
            const index = value.findIndex((v) => v.id === item.id);
            if (index === value.length - 1) return;
            const newValues = [...value];
            [newValues[index], newValues[index + 1]] = [newValues[index + 1], newValues[index]];
            onChange(newValues);
        },
        [listKey, onChange],
    );

    const handleAlignLeft = useCallback(
        (item: ItemGridListRowConfig) => {
            const value = useSettingsStore.getState().lists[listKey]?.grid.rows;
            if (!value) return;
            const index = value.findIndex((v) => v.id === item.id);
            const newValues = [...value];
            newValues[index] = { ...newValues[index], align: 'start' };
            onChange(newValues);
        },
        [listKey, onChange],
    );

    const handleAlignCenter = useCallback(
        (item: ItemGridListRowConfig) => {
            const value = useSettingsStore.getState().lists[listKey]?.grid.rows;
            if (!value) return;
            const index = value.findIndex((v) => v.id === item.id);
            const newValues = [...value];
            newValues[index] = { ...newValues[index], align: 'center' };
            onChange(newValues);
        },
        [listKey, onChange],
    );

    const handleAlignRight = useCallback(
        (item: ItemGridListRowConfig) => {
            const value = useSettingsStore.getState().lists[listKey]?.grid.rows;
            if (!value) return;
            const index = value.findIndex((v) => v.id === item.id);
            const newValues = [...value];
            newValues[index] = { ...newValues[index], align: 'end' };
            onChange(newValues);
        },
        [listKey, onChange],
    );

    const [searchRows, setSearchRows] = useDebouncedState('', 300);

    const fuse = useMemo(() => {
        return new Fuse(value, {
            getFn: (obj) => {
                return labelMap[obj.id] || '';
            },
            includeMatches: true,
            includeScore: true,
            keys: ['id', 'label'],
            threshold: 0.3,
        });
    }, [value, labelMap]);

    const filteredRows = useMemo(() => {
        if (!searchRows.trim()) {
            return value.map((item) => ({ item, matches: null }));
        }

        const results = fuse.search(searchRows);
        const resultMap = new Map(results.map((result) => [result.item.id, result.matches]));

        return value.map((item) => ({
            item,
            matches: resultMap.get(item.id) || null,
        }));
    }, [value, searchRows, fuse]);

    const handleReorder = useCallback(
        (idFrom: string, idTo: string, edge: Edge | null) => {
            const idList = value.map((item) => item.id);
            const newIdOrder = dndUtils.reorderById({
                edge,
                idFrom,
                idTo,
                list: idList,
            });

            // Map the new ID order back to full items
            const newOrder = newIdOrder.map((id) => value.find((item) => item.id === id)!);
            onChange(newOrder);
        },
        [onChange, value],
    );

    return (
        <Stack gap="xs">
            <Group justify="space-between" mb="md">
                <Text size="sm">{t('common.gridRows', { postProcess: 'sentenceCase' })}</Text>
                <TextInput
                    onChange={(e) => setSearchRows(e.currentTarget.value)}
                    placeholder={t('common.search', {
                        postProcess: 'sentenceCase',
                    })}
                    size="xs"
                />
            </Group>
            <div style={{ userSelect: 'none' }}>
                {filteredRows.map(({ item, matches }) => (
                    <GridRowItem
                        handleAlignCenter={handleAlignCenter}
                        handleAlignLeft={handleAlignLeft}
                        handleAlignRight={handleAlignRight}
                        handleChangeEnabled={handleChangeEnabled}
                        handleMoveDown={handleMoveDown}
                        handleMoveUp={handleMoveUp}
                        handleReorder={handleReorder}
                        item={item}
                        key={item.id}
                        label={labelMap[item.id]}
                        matches={matches}
                    />
                ))}
            </div>
        </Stack>
    );
};

const DragHandle = ({ dragHandleRef }: { dragHandleRef: React.RefObject<HTMLButtonElement> }) => {
    return (
        <ActionIcon
            icon="dragVertical"
            iconProps={{
                size: 'md',
            }}
            ref={dragHandleRef}
            size="xs"
            style={{ cursor: 'grab' }}
            variant="default"
        />
    );
};

const GridRowItem = memo(
    ({
        handleAlignCenter,
        handleAlignLeft,
        handleAlignRight,
        handleChangeEnabled,
        handleMoveDown,
        handleMoveUp,
        handleReorder,
        item,
        label,
        matches,
    }: {
        handleAlignCenter: (item: ItemGridListRowConfig) => void;
        handleAlignLeft: (item: ItemGridListRowConfig) => void;
        handleAlignRight: (item: ItemGridListRowConfig) => void;
        handleChangeEnabled: (item: ItemGridListRowConfig, checked: boolean) => void;
        handleMoveDown: (item: ItemGridListRowConfig) => void;
        handleMoveUp: (item: ItemGridListRowConfig) => void;
        handleReorder: (idFrom: string, idTo: string, edge: Edge | null) => void;
        item: ItemGridListRowConfig;
        label: string;
        matches: null | readonly Fuse.FuseResultMatch[];
    }) => {
        const { t } = useTranslation();
        const ref = useRef<HTMLDivElement>(null);
        const dragHandleRef = useRef<HTMLButtonElement>(null);
        const [isDragging, setIsDragging] = useState(false);
        const [isDraggedOver, setIsDraggedOver] = useState<Edge | null>(null);

        useEffect(() => {
            if (!ref.current || !dragHandleRef.current) {
                return;
            }

            return combine(
                draggable({
                    element: dragHandleRef.current,
                    getInitialData: () => {
                        const data = dndUtils.generateDragData({
                            id: [item.id],
                            operation: [DragOperation.REORDER],
                            type: DragTarget.GRID_ROW,
                        });
                        return data;
                    },
                    onDragStart: () => {
                        setIsDragging(true);
                    },
                    onDrop: () => {
                        setIsDragging(false);
                    },
                    onGenerateDragPreview: (data) => {
                        disableNativeDragPreview({ nativeSetDragImage: data.nativeSetDragImage });
                    },
                }),
                dropTargetForElements({
                    canDrop: (args) => {
                        const data = args.source.data as unknown as DragData;
                        const isSelf = (args.source.data.id as string[])[0] === item.id;
                        return dndUtils.isDropTarget(data.type, [DragTarget.GRID_ROW]) && !isSelf;
                    },
                    element: ref.current,
                    getData: ({ element, input }) => {
                        const data = dndUtils.generateDragData({
                            id: [item.id],
                            operation: [DragOperation.REORDER],
                            type: DragTarget.GRID_ROW,
                        });

                        return attachClosestEdge(data, {
                            allowedEdges: ['top', 'bottom'],
                            element,
                            input,
                        });
                    },
                    onDrag: (args) => {
                        const closestEdgeOfTarget: Edge | null = extractClosestEdge(args.self.data);
                        setIsDraggedOver(closestEdgeOfTarget);
                    },
                    onDragLeave: () => {
                        setIsDraggedOver(null);
                    },
                    onDrop: (args) => {
                        const closestEdgeOfTarget: Edge | null = extractClosestEdge(args.self.data);

                        const from = args.source.data.id as string[];
                        const to = args.self.data.id as string[];

                        handleReorder(from[0], to[0], closestEdgeOfTarget);
                        setIsDraggedOver(null);
                    },
                }),
            );
        }, [item.id, handleReorder]);

        return (
            <div
                className={clsx(styles.item, {
                    [styles.draggedOverBottom]: isDraggedOver === 'bottom',
                    [styles.draggedOverTop]: isDraggedOver === 'top',
                    [styles.dragging]: isDragging,
                    [styles.matched]: matches && matches.length > 0,
                })}
                ref={ref}
            >
                <Group wrap="nowrap">
                    <DragHandle dragHandleRef={dragHandleRef} />
                    <Checkbox
                        checked={item.isEnabled}
                        id={item.id}
                        label={label}
                        onChange={(e) => handleChangeEnabled(item, e.currentTarget.checked)}
                        size="sm"
                    />
                </Group>
                <Group wrap="nowrap">
                    <ActionIconGroup className={styles.group}>
                        <ActionIcon
                            icon="arrowUp"
                            iconProps={{ size: 'md' }}
                            onClick={() => handleMoveUp(item)}
                            size="xs"
                            tooltip={{
                                label: t('table.config.general.moveUp', {
                                    postProcess: 'sentenceCase',
                                }),
                            }}
                            variant="subtle"
                        />
                        <ActionIcon
                            icon="arrowDown"
                            iconProps={{ size: 'md' }}
                            onClick={() => handleMoveDown(item)}
                            size="xs"
                            tooltip={{
                                label: t('table.config.general.moveDown', {
                                    postProcess: 'sentenceCase',
                                }),
                            }}
                            variant="subtle"
                        />
                    </ActionIconGroup>
                    <ActionIconGroup className={styles.group}>
                        <ActionIcon
                            icon="alignLeft"
                            iconProps={{ size: 'md' }}
                            onClick={() => handleAlignLeft(item)}
                            size="xs"
                            tooltip={{
                                label: t('table.config.general.alignLeft', {
                                    postProcess: 'sentenceCase',
                                }),
                            }}
                            variant={item.align === 'start' ? 'filled' : 'subtle'}
                        />
                        <ActionIcon
                            icon="alignCenter"
                            iconProps={{ size: 'md' }}
                            onClick={() => handleAlignCenter(item)}
                            size="xs"
                            tooltip={{
                                label: t('table.config.general.alignCenter', {
                                    postProcess: 'sentenceCase',
                                }),
                            }}
                            variant={item.align === 'center' ? 'filled' : 'subtle'}
                        />
                        <ActionIcon
                            icon="alignRight"
                            iconProps={{ size: 'md' }}
                            onClick={() => handleAlignRight(item)}
                            size="xs"
                            tooltip={{
                                label: t('table.config.general.alignRight', {
                                    postProcess: 'sentenceCase',
                                }),
                            }}
                            variant={item.align === 'end' ? 'filled' : 'subtle'}
                        />
                    </ActionIconGroup>
                </Group>
            </div>
        );
    },
    (prevProps, nextProps) => {
        return (
            prevProps.item.id === nextProps.item.id &&
            prevProps.item.isEnabled === nextProps.item.isEnabled &&
            prevProps.item.align === nextProps.item.align &&
            prevProps.label === nextProps.label &&
            prevProps.matches === nextProps.matches
        );
    },
);
