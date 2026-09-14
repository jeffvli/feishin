import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './drag-preview.module.css';

import { useItemImageUrl } from '/@/renderer/components/item-image/item-image';
import { useImagePlaceholderPriority } from '/@/renderer/store';
import { Icon } from '/@/shared/components/icon/icon';
import { useImageHashUrl } from '/@/shared/hooks/use-image-hash-url';
import { LibraryItem } from '/@/shared/types/domain-types';
import { DragData, DragTarget } from '/@/shared/types/drag-and-drop';

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
    const folderName = data.type === DragTarget.SIDEBAR_PLAYLIST_FOLDER ? data.id[0] : undefined;
    const itemName = folderName || (firstItem ? getItemName(firstItem) : 'Item');

    const itemImage = useItemImageUrl({
        id: (firstItem as { imageId: string })?.imageId,
        itemType: data.itemType || LibraryItem.SONG,
        type: 'table',
    });
    const item = firstItem as
        | undefined
        | {
              blurHash?: null | string;
              dominantColor?: null | string;
              thumbHash?: null | string;
          };
    const imagePlaceholderPriority = useImagePlaceholderPriority();
    const hashUrl = useImageHashUrl(
        item?.thumbHash,
        item?.blurHash,
        item?.dominantColor,
        imagePlaceholderPriority,
    );

    const isMultiple = itemCount > 1;

    return (
        <div className={styles.container}>
            <div className={styles.preview}>
                <div className={styles.content}>
                    {itemImage || hashUrl ? (
                        <div
                            className={styles['image-container']}
                            style={
                                hashUrl
                                    ? {
                                          backgroundImage: `url(${hashUrl})`,
                                          backgroundPosition: 'center',
                                          backgroundSize: 'cover',
                                      }
                                    : undefined
                            }
                        >
                            {itemImage ? (
                                <img alt={itemName} className={styles.image} src={itemImage} />
                            ) : null}
                            <div className={styles['image-overlay']} />
                        </div>
                    ) : (
                        <div className={styles['icon-container']}>
                            {data.type === DragTarget.SIDEBAR_PLAYLIST_FOLDER && (
                                <Icon icon="folder" size="xl" />
                            )}
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
