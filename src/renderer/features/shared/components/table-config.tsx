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
import clsx from 'clsx';
import Fuse, { type FuseResultMatch } from 'fuse.js';
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './table-config.module.css';

import { ItemTableListColumnConfig } from '/@/renderer/components/item-list/types';
import {
    ListConfigBooleanControl,
    ListConfigTable,
} from '/@/renderer/features/shared/components/list-config-menu';
import {
    type DataTableProps,
    ItemListSettings,
    useSettingsStore,
    useSettingsStoreActions,
} from '/@/renderer/store';
import { ActionIcon, ActionIconGroup } from '/@/shared/components/action-icon/action-icon';
import { Badge } from '/@/shared/components/badge/badge';
import { Checkbox } from '/@/shared/components/checkbox/checkbox';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { SegmentedControl } from '/@/shared/components/segmented-control/segmented-control';
import { Slider } from '/@/shared/components/slider/slider';
import { Stack } from '/@/shared/components/stack/stack';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Text } from '/@/shared/components/text/text';
import { Tooltip } from '/@/shared/components/tooltip/tooltip';
import { useDebouncedState } from '/@/shared/hooks/use-debounced-state';
import { dndUtils, DragData, DragOperation, DragTarget } from '/@/shared/types/drag-and-drop';
import { ItemListKey, ListPaginationType } from '/@/shared/types/types';

interface TableConfigProps {
    enablePinColumnButtons?: boolean;
    extraOptions?: {
        component: React.ReactNode;
        id: string;
        label: string;
    }[];
    listKey: ItemListKey;
    optionsConfig?: {
        [key: string]: {
            disabled?: boolean;
            hidden?: boolean;
        };
    };
    tableColumnsData: { label: string; value: string }[];
    tableKey?: 'detail' | 'main';
}

export const TableConfig = ({
    enablePinColumnButtons = true,
    extraOptions,
    listKey,
    optionsConfig,
    tableColumnsData,
    tableKey = 'main',
}: TableConfigProps) => {
    const { t } = useTranslation();

    const list = useSettingsStore((state) => state.lists[listKey]) as ItemListSettings;
    const { setList } = useSettingsStoreActions();

    const table = tableKey === 'detail' ? (list?.detail ?? list?.table) : list?.table;

    const setTableUpdate = useCallback(
        (patch: Partial<DataTableProps>) => {
            if (tableKey === 'detail') {
                setList(listKey, { detail: patch } as Parameters<
                    ReturnType<typeof useSettingsStoreActions>['setList']
                >[1]);
            } else {
                setList(listKey, { table: patch });
            }
        },
        [listKey, setList, tableKey],
    );

    const advancedSettings = useMemo(() => {
        const allOptions = [
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
                            setList(listKey, { pagination: value as ListPaginationType })
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
                        onChangeEnd={(value) => setList(listKey, { itemsPerPage: value })}
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
                    <SegmentedControl
                        data={[
                            {
                                label: t('table.config.general.size_compact', {
                                    postProcess: 'titleCase',
                                }),
                                value: 'compact',
                            },
                            {
                                label: t('table.config.general.size_default', {
                                    postProcess: 'titleCase',
                                }),
                                value: 'default',
                            },
                            {
                                label: t('table.config.general.size_large', {
                                    postProcess: 'titleCase',
                                }),
                                value: 'large',
                            },
                        ]}
                        onChange={(value) =>
                            setTableUpdate({
                                size: value as 'compact' | 'default' | 'large',
                            })
                        }
                        size="sm"
                        value={table?.size ?? 'default'}
                        w="100%"
                    />
                ),
                id: 'size',
                label: t('table.config.general.size', {
                    postProcess: 'titleCase',
                }),
            },
            {
                component: (
                    <ListConfigBooleanControl
                        onChange={(e) => setTableUpdate({ enableHeader: e })}
                        value={table.enableHeader}
                    />
                ),
                id: 'enableHeader',
                label: t('table.config.general.showHeader', {
                    postProcess: 'sentenceCase',
                }),
            },
            {
                component: (
                    <ListConfigBooleanControl
                        onChange={(e) => setTableUpdate({ enableRowHoverHighlight: e })}
                        value={table.enableRowHoverHighlight}
                    />
                ),
                id: 'enableRowHoverHighlight',
                label: t('table.config.general.rowHoverHighlight', {
                    postProcess: 'sentenceCase',
                }),
            },
            {
                component: (
                    <ListConfigBooleanControl
                        onChange={(e) => setTableUpdate({ enableAlternateRowColors: e })}
                        value={table.enableAlternateRowColors}
                    />
                ),
                id: 'enableAlternateRowColors',
                label: t('table.config.general.alternateRowColors', {
                    postProcess: 'sentenceCase',
                }),
            },
            {
                component: (
                    <ListConfigBooleanControl
                        onChange={(e) => setTableUpdate({ enableHorizontalBorders: e })}
                        value={table.enableHorizontalBorders}
                    />
                ),
                id: 'enableHorizontalBorders',
                label: t('table.config.general.horizontalBorders', {
                    postProcess: 'sentenceCase',
                }),
            },
            {
                component: (
                    <ListConfigBooleanControl
                        onChange={(e) => setTableUpdate({ enableVerticalBorders: e })}
                        value={table.enableVerticalBorders}
                    />
                ),
                id: 'enableVerticalBorders',
                label: t('table.config.general.verticalBorders', {
                    postProcess: 'sentenceCase',
                }),
            },
            {
                component: (
                    <ListConfigBooleanControl
                        onChange={(e) => setTableUpdate({ autoFitColumns: e })}
                        value={
                            tableKey === 'main' ? (table as DataTableProps).autoFitColumns : false
                        }
                    />
                ),
                id: 'autoFitColumns',
                label: t('table.config.general.autoFitColumns', { postProcess: 'sentenceCase' }),
            },

            ...(extraOptions || []),
        ];

        // Filter and apply config (hidden/disabled)
        return allOptions
            .map((option) => {
                const config = optionsConfig?.[option.id];
                if (config?.hidden) {
                    return null;
                }
                return option;
            })
            .filter((option): option is NonNullable<typeof option> => option !== null);
    }, [
        t,
        list.pagination,
        list.itemsPerPage,
        table,
        tableKey,
        extraOptions,
        setList,
        listKey,
        setTableUpdate,
        optionsConfig,
    ]);

    return (
        <>
            <ListConfigTable options={advancedSettings} />
            <Divider />
            <TableColumnConfig
                data={tableColumnsData}
                enablePinColumnButtons={enablePinColumnButtons}
                onChange={(columns) => setTableUpdate({ columns })}
                value={table.columns}
            />
        </>
    );
};

const TableColumnConfig = ({
    data,
    enablePinColumnButtons,
    onChange,
    value,
}: {
    data: { label: string; value: string }[];
    enablePinColumnButtons: boolean;
    onChange: (value: ItemTableListColumnConfig[]) => void;
    value: ItemTableListColumnConfig[];
}) => {
    const { t } = useTranslation();

    const valueRef = useRef(value);
    const onChangeRef = useRef(onChange);

    useLayoutEffect(() => {
        valueRef.current = value;
        onChangeRef.current = onChange;
    });

    const labelMap = useMemo(() => {
        return data.reduce(
            (acc, item) => {
                acc[item.value] = item.label;
                return acc;
            },
            {} as Record<string, string>,
        );
    }, [data]);

    const handleChangeEnabled = useCallback((item: ItemTableListColumnConfig, checked: boolean) => {
        const currentValue = valueRef.current;
        const index = currentValue.findIndex((v) => v.id === item.id);
        const newValues = [...currentValue];
        newValues[index] = { ...newValues[index], isEnabled: checked };
        onChangeRef.current(newValues);
    }, []);

    const handleMoveUp = useCallback((item: ItemTableListColumnConfig) => {
        const currentValue = valueRef.current;
        const index = currentValue.findIndex((v) => v.id === item.id);
        if (index === 0) return;
        const newValues = [...currentValue];
        [newValues[index], newValues[index - 1]] = [newValues[index - 1], newValues[index]];
        onChangeRef.current(newValues);
    }, []);

    const handleMoveDown = useCallback((item: ItemTableListColumnConfig) => {
        const currentValue = valueRef.current;
        const index = currentValue.findIndex((v) => v.id === item.id);
        if (index === currentValue.length - 1) return;
        const newValues = [...currentValue];
        [newValues[index], newValues[index + 1]] = [newValues[index + 1], newValues[index]];
        onChangeRef.current(newValues);
    }, []);

    const handlePinToLeft = useCallback((item: ItemTableListColumnConfig) => {
        const currentValue = valueRef.current;
        const index = currentValue.findIndex((v) => v.id === item.id);
        const newValues = [...currentValue];

        const isPinned = newValues[index].pinned;
        const isPinnedLeft = isPinned === 'left';

        if (isPinnedLeft) {
            newValues[index] = { ...newValues[index], pinned: null };
        } else {
            newValues[index] = { ...newValues[index], pinned: 'left' };
        }

        onChangeRef.current(newValues);
    }, []);

    const handlePinToRight = useCallback((item: ItemTableListColumnConfig) => {
        const currentValue = valueRef.current;
        const index = currentValue.findIndex((v) => v.id === item.id);
        const newValues = [...currentValue];

        const isPinned = newValues[index].pinned;
        const isPinnedRight = isPinned === 'right';

        if (isPinnedRight) {
            newValues[index] = { ...newValues[index], pinned: null };
        } else {
            newValues[index] = { ...newValues[index], pinned: 'right' };
        }

        onChangeRef.current(newValues);
    }, []);

    const handleAlignLeft = useCallback((item: ItemTableListColumnConfig) => {
        const currentValue = valueRef.current;
        const index = currentValue.findIndex((v) => v.id === item.id);
        const newValues = [...currentValue];
        newValues[index] = { ...newValues[index], align: 'start' };
        onChangeRef.current(newValues);
    }, []);

    const handleAlignCenter = useCallback((item: ItemTableListColumnConfig) => {
        const currentValue = valueRef.current;
        const index = currentValue.findIndex((v) => v.id === item.id);
        const newValues = [...currentValue];
        newValues[index] = { ...newValues[index], align: 'center' };
        onChangeRef.current(newValues);
    }, []);

    const handleAlignRight = useCallback((item: ItemTableListColumnConfig) => {
        const currentValue = valueRef.current;
        const index = currentValue.findIndex((v) => v.id === item.id);
        const newValues = [...currentValue];
        newValues[index] = { ...newValues[index], align: 'end' };
        onChangeRef.current(newValues);
    }, []);

    const handleAutoSize = useCallback((item: ItemTableListColumnConfig, checked: boolean) => {
        const currentValue = valueRef.current;
        const index = currentValue.findIndex((v) => v.id === item.id);
        const newValues = [...currentValue];
        newValues[index] = { ...newValues[index], autoSize: checked };
        onChangeRef.current(newValues);
    }, []);

    const handleRowWidth = useCallback(
        (item: ItemTableListColumnConfig, number: number | string) => {
            if (typeof number !== 'number') {
                number = 0;
            }

            if (number < 0) {
                number = 0;
            }

            if (number > 2000) {
                number = 2000;
            }

            const currentValue = valueRef.current;
            const index = currentValue.findIndex((v) => v.id === item.id);
            const newValues = [...currentValue];
            newValues[index] = { ...newValues[index], width: number };
            onChangeRef.current(newValues);
        },
        [],
    );

    const [searchColumns, setSearchColumns] = useDebouncedState('', 300);

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

    const filteredColumns = useMemo(() => {
        if (!searchColumns.trim()) {
            return value.map((item) => ({ item, matches: null }));
        }

        const results = fuse.search(searchColumns);
        const resultMap = new Map(results.map((result) => [result.item.id, result.matches]));

        return value.map((item) => ({
            item,
            matches: resultMap.get(item.id) || null,
        }));
    }, [value, searchColumns, fuse]);

    const handleReorder = useCallback((idFrom: string, idTo: string, edge: Edge | null) => {
        const currentValue = valueRef.current;
        const idList = currentValue.map((item) => item.id);
        const newIdOrder = dndUtils.reorderById({
            edge,
            idFrom,
            idTo,
            list: idList,
        });

        // Map the new ID order back to full items
        const newOrder = newIdOrder.map((id) => currentValue.find((item) => item.id === id)!);
        onChangeRef.current(newOrder);
    }, []);

    return (
        <Stack gap="xs">
            <Group justify="space-between" mb="md">
                <Text size="sm">{t('common.tableColumns', { postProcess: 'sentenceCase' })}</Text>
                <TextInput
                    onChange={(e) => setSearchColumns(e.currentTarget.value)}
                    placeholder={t('common.search', {
                        postProcess: 'sentenceCase',
                    })}
                    size="xs"
                />
            </Group>
            <div style={{ userSelect: 'none' }}>
                {filteredColumns.map(({ item, matches }) => (
                    <TableColumnItem
                        enablePinColumnButtons={enablePinColumnButtons}
                        handleAlignCenter={handleAlignCenter}
                        handleAlignLeft={handleAlignLeft}
                        handleAlignRight={handleAlignRight}
                        handleAutoSize={handleAutoSize}
                        handleChangeEnabled={handleChangeEnabled}
                        handleMoveDown={handleMoveDown}
                        handleMoveUp={handleMoveUp}
                        handlePinToLeft={handlePinToLeft}
                        handlePinToRight={handlePinToRight}
                        handleReorder={handleReorder}
                        handleRowWidth={handleRowWidth}
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

const DragHandle = ({
    dragHandleRef,
}: {
    dragHandleRef: React.RefObject<HTMLButtonElement | null>;
}) => {
    return (
        <ActionIcon
            icon="dragVertical"
            iconProps={{
                size: 'md',
            }}
            ref={dragHandleRef as React.RefObject<HTMLButtonElement>}
            size="xs"
            style={{ cursor: 'grab' }}
            variant="default"
        />
    );
};

const TableColumnItem = memo(
    ({
        enablePinColumnButtons,
        handleAlignCenter,
        handleAlignLeft,
        handleAlignRight,
        handleAutoSize,
        handleChangeEnabled,
        handleMoveDown,
        handleMoveUp,
        handlePinToLeft,
        handlePinToRight,
        handleReorder,
        handleRowWidth,
        item,
        label,
        matches,
    }: {
        enablePinColumnButtons: boolean;
        handleAlignCenter: (item: ItemTableListColumnConfig) => void;
        handleAlignLeft: (item: ItemTableListColumnConfig) => void;
        handleAlignRight: (item: ItemTableListColumnConfig) => void;
        handleAutoSize: (item: ItemTableListColumnConfig, checked: boolean) => void;
        handleChangeEnabled: (item: ItemTableListColumnConfig, checked: boolean) => void;
        handleMoveDown: (item: ItemTableListColumnConfig) => void;
        handleMoveUp: (item: ItemTableListColumnConfig) => void;
        handlePinToLeft: (item: ItemTableListColumnConfig) => void;
        handlePinToRight: (item: ItemTableListColumnConfig) => void;
        handleReorder: (idFrom: string, idTo: string, edge: Edge | null) => void;
        handleRowWidth: (item: ItemTableListColumnConfig, number: number | string) => void;
        item: ItemTableListColumnConfig;
        label: string;
        matches: null | readonly FuseResultMatch[];
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
                            type: DragTarget.TABLE_COLUMN,
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
                        return (
                            dndUtils.isDropTarget(data.type, [DragTarget.TABLE_COLUMN]) && !isSelf
                        );
                    },
                    element: ref.current,
                    getData: ({ element, input }) => {
                        const data = dndUtils.generateDragData({
                            id: [item.id],
                            operation: [DragOperation.REORDER],
                            type: DragTarget.TABLE_COLUMN,
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
                    {enablePinColumnButtons && (
                        <ActionIconGroup className={styles.group}>
                            <ActionIcon
                                icon="arrowLeftToLine"
                                iconProps={{ size: 'md' }}
                                onClick={() => handlePinToLeft(item)}
                                size="xs"
                                tooltip={{
                                    label: t('table.config.general.pinToLeft', {
                                        postProcess: 'sentenceCase',
                                    }),
                                }}
                                variant={item.pinned === 'left' ? 'filled' : 'subtle'}
                            />
                            <ActionIcon
                                icon="arrowRightToLine"
                                iconProps={{ size: 'md' }}
                                onClick={() => handlePinToRight(item)}
                                size="xs"
                                tooltip={{
                                    label: t('table.config.general.pinToRight', {
                                        postProcess: 'sentenceCase',
                                    }),
                                }}
                                variant={item.pinned === 'right' ? 'filled' : 'subtle'}
                            />
                        </ActionIconGroup>
                    )}
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
                    <NumberInput
                        className={clsx(styles.group, styles.numberInput)}
                        hideControls={false}
                        leftSection={
                            <>
                                {item.pinned === null && (
                                    <Tooltip
                                        label={t('table.config.general.autosize', {
                                            postProcess: 'sentenceCase',
                                        })}
                                    >
                                        <Checkbox
                                            checked={item.autoSize}
                                            disabled={item.pinned !== null}
                                            id={item.id}
                                            onChange={(e) =>
                                                handleAutoSize(item, e.currentTarget.checked)
                                            }
                                            size="xs"
                                        />
                                    </Tooltip>
                                )}
                            </>
                        }
                        max={2000}
                        min={0}
                        onChange={(value) => handleRowWidth(item, value)}
                        size="xs"
                        step={10}
                        stepHoldDelay={300}
                        stepHoldInterval={100}
                        value={item.width}
                        variant="subtle"
                    />
                </Group>
            </div>
        );
    },
    (prevProps, nextProps) => {
        // Custom comparison function for better memoization
        return (
            prevProps.enablePinColumnButtons === nextProps.enablePinColumnButtons &&
            prevProps.item.id === nextProps.item.id &&
            prevProps.item.isEnabled === nextProps.item.isEnabled &&
            prevProps.item.autoSize === nextProps.item.autoSize &&
            prevProps.item.width === nextProps.item.width &&
            prevProps.item.pinned === nextProps.item.pinned &&
            prevProps.item.align === nextProps.item.align &&
            prevProps.label === nextProps.label &&
            prevProps.matches === nextProps.matches
        );
    },
);
