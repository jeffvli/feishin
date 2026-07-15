import { Reorder } from 'motion/react';
import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { DraggableItem } from '/@/renderer/features/settings/components/general/draggable-item';
import {
    AlbumGroupItem,
    SortableItem,
    useAlbumGroupItems,
    useSettingsStoreActions,
} from '/@/renderer/store';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';

const ALBUM_GROUP_ITEM_LABELS: Array<[AlbumGroupItem, string]> = [
    [AlbumGroupItem.ALBUM_ARTISTS, 'table.column.albumArtist'],
    [AlbumGroupItem.RELEASE_DATE, 'table.column.releaseDate'],
    [AlbumGroupItem.RELEASE_YEAR, 'table.column.releaseYear'],
    [AlbumGroupItem.SONG_COUNT, 'table.column.songCount'],
    [AlbumGroupItem.DURATION, 'common.duration'],
    [AlbumGroupItem.RELEASE_TYPE, 'common.releaseType'],
    [AlbumGroupItem.GENRES, 'table.column.genre'],
    [AlbumGroupItem.SIZE, 'table.column.size'],
];

const mergeItems = <K extends string, T extends SortableItem<K>>(
    items: T[],
    itemLabels: Array<[K, string]>,
): T[] => {
    const allItemIds = itemLabels.map(([key]) => key);

    const missingItemIds = allItemIds.filter((id) => !items.some((item) => item.id === id));

    const merged = [
        ...items,
        ...(missingItemIds.map((id) => ({
            disabled: true,
            id,
        })) as T[]),
    ];

    const uniqueMerged = merged.filter(
        (item, index, self) => index === self.findIndex((t) => t.id === item.id),
    );

    return uniqueMerged.filter((item) => itemLabels.some(([key]) => key === item.id));
};

export const AlbumGroupMetadataConfig = memo(() => {
    const { t } = useTranslation();
    const albumGroupItems = useAlbumGroupItems();
    const { setAlbumGroupItems } = useSettingsStoreActions();

    const items = useMemo(
        () =>
            mergeItems(albumGroupItems as SortableItem<AlbumGroupItem>[], ALBUM_GROUP_ITEM_LABELS),
        [albumGroupItems],
    );

    const translatedItemMap = useMemo(
        () =>
            Object.fromEntries(
                ALBUM_GROUP_ITEM_LABELS.map(([key, value]) => [key, t(value)]),
            ) as Record<AlbumGroupItem, string>,
        [t],
    );

    const handleChangeDisabled = useCallback(
        (id: string, enabled: boolean) => {
            setAlbumGroupItems(
                items.map((item) => {
                    if (item.id === id) {
                        return {
                            ...item,
                            disabled: !enabled,
                        };
                    }

                    return item;
                }),
            );
        },
        [items, setAlbumGroupItems],
    );

    const handleReorder = useCallback(
        (reorderedItems: SortableItem<AlbumGroupItem>[]) => {
            setAlbumGroupItems(reorderedItems);
        },
        [setAlbumGroupItems],
    );

    return (
        <Stack gap="sm" pb="md" pl="md" pr="md">
            <Stack gap={0}>
                <Text fw={500} size="sm">
                    {t('table.config.general.albumGroupMetadata')}
                </Text>
            </Stack>
            <Reorder.Group
                axis="y"
                onReorder={handleReorder}
                style={{ userSelect: 'none' }}
                values={items}
            >
                {items.map((item) => (
                    <DraggableItem
                        handleChangeDisabled={handleChangeDisabled}
                        item={item}
                        key={item.id}
                        value={translatedItemMap[item.id]}
                    />
                ))}
            </Reorder.Group>
        </Stack>
    );
});
