import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './drag-preview.module.css';

import { useItemImageUrl } from '/@/renderer/components/item-image/item-image';
import { Icon } from '/@/shared/components/icon/icon';
import { LibraryItem } from '/@/shared/types/domain-types';
import { DragData } from '/@/shared/types/drag-and-drop';

interface DragPreviewProps {
    data: DragData;
}

const getItemName = (item: unknown): string => {
    if (item && typeof item === 'object') {
        if ('name' in item && typeof item.name === 'string') {
            return item.name;
        }
        if ('title' in item && typeof item.title === 'string') {
            return item.title;
        }
    }
    return 'Item';
};

export const DragPreview = memo(({ data }: DragPreviewProps) => {
    const items = data.item || [];
    const { t } = useTranslation();
    const itemCount = items.length;
    const firstItem = items[0];
    const itemName = firstItem ? getItemName(firstItem) : 'Item';

    const itemImage = useItemImageUrl({
        id: (firstItem as { id: string })?.id,
        itemType: data.itemType || LibraryItem.SONG,
        type: 'table',
    });

    const isMultiple = itemCount > 1;

    return (
        <div className={styles.container}>
            <div className={styles.preview}>
                <div className={styles.content}>
                    {itemImage ? (
                        <div className={styles['image-container']}>
                            <img alt={itemName} className={styles.image} src={itemImage} />
                            <div className={styles['image-overlay']} />
                        </div>
                    ) : (
                        <div className={styles['icon-container']}>
                            {data.itemType === LibraryItem.ALBUM && <Icon icon="album" size="xl" />}
                            {data.itemType === LibraryItem.SONG && (
                                <Icon icon="itemSong" size="xl" />
                            )}
                            {data.itemType === LibraryItem.ARTIST && (
                                <Icon icon="artist" size="xl" />
                            )}
                            {data.itemType === LibraryItem.PLAYLIST && (
                                <Icon icon="playlist" size="xl" />
                            )}
                            {data.itemType === LibraryItem.GENRE && <Icon icon="genre" size="xl" />}
                            {!data.itemType && <Icon icon="library" size="xl" />}
                        </div>
                    )}
                    <div className={styles['text-container']}>
                        <div className={styles.name}>{itemName}</div>
                        {isMultiple && (
                            <div className={styles.count}>
                                +{t('common.itemsMore', { count: itemCount - 1 })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

DragPreview.displayName = 'DragPreview';
