import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { SONG_TABLE_COLUMNS } from '/@/renderer/components/item-list/item-table-list/default-columns';
import { useFolderListFilters } from '/@/renderer/features/folders/hooks/use-folder-list-filters';
import {
    ListConfigMenu,
    SONG_DISPLAY_TYPES,
} from '/@/renderer/features/shared/components/list-config-menu';
import { ListRefreshButton } from '/@/renderer/features/shared/components/list-refresh-button';
import { ListSortByDropdown } from '/@/renderer/features/shared/components/list-sort-by-dropdown';
import { ListSortOrderToggleButton } from '/@/renderer/features/shared/components/list-sort-order-toggle-button';
import { useContainerQuery } from '/@/renderer/hooks';
import { truncateMiddle } from '/@/renderer/utils';
import { Breadcrumb } from '/@/shared/components/breadcrumb/breadcrumb';
import { Button } from '/@/shared/components/button/button';
import { Divider } from '/@/shared/components/divider/divider';
import { DropdownMenu } from '/@/shared/components/dropdown-menu/dropdown-menu';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Stack } from '/@/shared/components/stack/stack';
import { LibraryItem, SongListSort, SortOrder } from '/@/shared/types/domain-types';
import { ItemListKey, ListDisplayType } from '/@/shared/types/types';

const MAX_BREADCRUMB_TEXT_LENGTH = 26;

export const FolderListHeaderFilters = () => {
    const { t } = useTranslation();
    const { folderPath, navigateToPathIndex, setFolderPath } = useFolderListFilters();
    const {
        is2xl,
        isLg,
        isMd,
        isSm,
        isXl,
        isXs,
        ref: breadcrumbContainerRef,
    } = useContainerQuery();

    const maxItems = useMemo(() => {
        if (is2xl) return 8;
        if (isXl) return 6;
        if (isLg) return 4;
        if (isMd) return 3;
        if (isSm) return 2;
        if (isXs) return 2;
        return 1;
    }, [is2xl, isLg, isMd, isSm, isXl, isXs]);

    const allBreadcrumbItems = useMemo(() => {
        const items: Array<{
            fullLabel: string;
            id: string;
            label: string;
            onClick: () => void;
        }> = [];

        const homeLabel = t('common.home', { postProcess: 'titleCase' });
        items.push({
            fullLabel: homeLabel,
            id: 'folder-root',
            label: homeLabel,
            onClick: () => {
                setFolderPath([]);
            },
        });

        folderPath.forEach((folder, index) => {
            items.push({
                fullLabel: folder.name,
                id: `folder-${folder.id}`,
                label: truncateMiddle(folder.name, MAX_BREADCRUMB_TEXT_LENGTH),
                onClick: () => navigateToPathIndex(index),
            });
        });

        return items;
    }, [folderPath, navigateToPathIndex, setFolderPath, t]);

    const visibleItems = useMemo(() => {
        const firstItem = allBreadcrumbItems[0];

        if (maxItems === 1) {
            return [firstItem];
        }

        if (allBreadcrumbItems.length <= maxItems) {
            return allBreadcrumbItems;
        }

        const lastItem = allBreadcrumbItems[allBreadcrumbItems.length - 1];
        const middleItems = allBreadcrumbItems.slice(1, -1);
        const availableSlots = maxItems - 2;

        if (availableSlots <= 0) {
            return [firstItem, lastItem];
        }

        if (middleItems.length <= availableSlots) {
            return [firstItem, ...middleItems, lastItem];
        }

        const startCount = Math.floor(availableSlots / 2);
        const endCount = availableSlots - startCount;
        const startMiddle = middleItems.slice(0, startCount);
        const endMiddle = middleItems.slice(-endCount);

        return [firstItem, ...startMiddle, ...endMiddle, lastItem];
    }, [allBreadcrumbItems, maxItems]);

    const collapsedItems = useMemo(() => {
        if (maxItems === 1) {
            return allBreadcrumbItems.slice(1);
        }

        if (allBreadcrumbItems.length <= maxItems) {
            return [];
        }

        const middleItems = allBreadcrumbItems.slice(1, -1);
        const availableSlots = maxItems - 2;

        if (availableSlots <= 0) {
            return middleItems;
        }

        if (middleItems.length <= availableSlots) {
            return [];
        }

        const startCount = Math.floor(availableSlots / 2);
        const endCount = availableSlots - startCount;
        const visibleStart = middleItems.slice(0, startCount);
        const visibleEnd = middleItems.slice(-endCount);

        return middleItems.filter(
            (item) => !visibleStart.includes(item) && !visibleEnd.includes(item),
        );
    }, [allBreadcrumbItems, maxItems]);

    const breadcrumbItems = useMemo(() => {
        const items: React.ReactNode[] = [];
        const firstItem = allBreadcrumbItems[0];
        const lastItem = allBreadcrumbItems[allBreadcrumbItems.length - 1];
        const hasCollapsedItems = collapsedItems.length > 0;

        const renderDropdown = () => (
            <DropdownMenu key="breadcrumb-dropdown" position="bottom-start">
                <DropdownMenu.Target>
                    <Button size="compact-sm" variant="subtle">
                        <Icon icon="ellipsisHorizontal" />
                    </Button>
                </DropdownMenu.Target>
                <DropdownMenu.Dropdown>
                    {collapsedItems.map((collapsedItem) => (
                        <DropdownMenu.Item key={collapsedItem.id} onClick={collapsedItem.onClick}>
                            {collapsedItem.fullLabel}
                        </DropdownMenu.Item>
                    ))}
                </DropdownMenu.Dropdown>
            </DropdownMenu>
        );

        if (hasCollapsedItems && maxItems === 1) {
            items.push(
                <Button
                    key={firstItem.id}
                    onClick={firstItem.onClick}
                    size="compact-sm"
                    variant="subtle"
                >
                    {firstItem.label}
                </Button>,
            );
            items.push(renderDropdown());
            return items;
        }

        if (hasCollapsedItems) {
            const middleItems = allBreadcrumbItems.slice(1, -1);
            const availableSlots = maxItems - 2;
            const startCount = Math.floor(availableSlots / 2);
            const visibleStartMiddle = middleItems.slice(0, startCount);
            const visibleEndMiddle = middleItems.slice(-(availableSlots - startCount));

            visibleItems.forEach((item, index) => {
                items.push(
                    <Button key={item.id} onClick={item.onClick} size="compact-sm" variant="subtle">
                        {item.label}
                    </Button>,
                );

                if (index < visibleItems.length - 1) {
                    const nextItem = visibleItems[index + 1];
                    const isFirstItem = item.id === firstItem.id;
                    const isLastStartMiddle =
                        item.id !== firstItem.id &&
                        item.id !== lastItem.id &&
                        visibleStartMiddle.length > 0 &&
                        item.id === visibleStartMiddle[visibleStartMiddle.length - 1].id;

                    const shouldInsertDropdown =
                        (isFirstItem && nextItem.id === lastItem.id) ||
                        (isLastStartMiddle &&
                            (nextItem.id === lastItem.id ||
                                (visibleEndMiddle.length > 0 &&
                                    nextItem.id === visibleEndMiddle[0].id)));

                    if (shouldInsertDropdown) {
                        items.push(renderDropdown());
                    }
                }
            });
        } else {
            visibleItems.forEach((item) => {
                items.push(
                    <Button key={item.id} onClick={item.onClick} size="compact-sm" variant="subtle">
                        {item.label}
                    </Button>,
                );
            });
        }

        return items;
    }, [visibleItems, collapsedItems, allBreadcrumbItems, maxItems]);

    return (
        <Stack>
            <Flex justify="space-between">
                <Group gap="sm" w="100%">
                    <ListSortByDropdown
                        defaultSortByValue={SongListSort.ID}
                        itemType={LibraryItem.FOLDER}
                        listKey={ItemListKey.FOLDER}
                    />
                    <Divider orientation="vertical" />
                    <ListSortOrderToggleButton
                        defaultSortOrder={SortOrder.ASC}
                        listKey={ItemListKey.FOLDER}
                    />
                    <ListRefreshButton listKey={ItemListKey.SONG} />
                </Group>
                <Group gap="sm" wrap="nowrap">
                    <ListConfigMenu
                        displayTypes={[
                            { hidden: true, value: ListDisplayType.GRID },
                            ...SONG_DISPLAY_TYPES,
                        ]}
                        listKey={ItemListKey.SONG}
                        optionsConfig={{
                            grid: {
                                itemsPerPage: { hidden: true },
                                pagination: { hidden: true },
                            },
                            table: {
                                itemsPerPage: { hidden: true },
                                pagination: { hidden: true },
                            },
                        }}
                        tableColumnsData={SONG_TABLE_COLUMNS}
                    />
                </Group>
            </Flex>
            <div ref={breadcrumbContainerRef}>
                <Breadcrumb separator={<Icon icon="arrowRight" />}>{breadcrumbItems}</Breadcrumb>
            </div>
        </Stack>
    );
};
