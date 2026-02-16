import { useTranslation } from 'react-i18next';

import styles from './context-menu-preview.module.css';

import { useItemImageUrl } from '/@/renderer/components/item-image/item-image';
import {
    getArtistImageDisplay,
    StackedCovers,
} from '/@/renderer/features/artists/components/stacked-covers';
import { useArtistAlbumStack } from '/@/renderer/hooks/use-artist-album-stack';
import { useGeneralSettings } from '/@/renderer/store';
import { Icon } from '/@/shared/components/icon/icon';
import { Text } from '/@/shared/components/text/text';
import { LibraryItem } from '/@/shared/types/domain-types';

interface ContextMenuPreviewProps {
    items: unknown[];
    itemType?: LibraryItem;
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

const getItemImage = (item: unknown): null | string => {
    if (item && typeof item === 'object') {
        if ('imageId' in item && typeof item.imageId === 'string') {
            return item.imageId;
        }

        if ('imageUrl' in item && typeof item.imageUrl === 'string') {
            return item.imageUrl;
        }
    }
    return null;
};

export const ContextMenuPreview = ({ items, itemType }: ContextMenuPreviewProps) => {
    const { t } = useTranslation();
    const settings = useGeneralSettings();
    const itemCount = items.length;
    const firstItem = items[0];
    const itemName = firstItem ? getItemName(firstItem) : 'Item';
    const itemImage = firstItem ? getItemImage(firstItem) : null;
    const isMultiple = itemCount > 1;

    const imageUrl = useItemImageUrl({
        id: (firstItem as { imageId?: string })?.imageId,
        itemType: itemType || LibraryItem.SONG,
        serverId: (firstItem as { _serverId?: string })?._serverId,
        type: 'table',
    });

    // Determine if this is an artist type that might need album stack
    const isArtistType = itemType === LibraryItem.ALBUM_ARTIST || itemType === LibraryItem.ARTIST;
    const artistId =
        isArtistType && firstItem && typeof firstItem === 'object' && 'id' in firstItem
            ? (firstItem as { id: string }).id
            : undefined;

    // Fetch album stack data lazily for artists
    const albumStackData = useArtistAlbumStack(artistId, {
        enabled: isArtistType && settings.artistCoverStackEnabled && !isMultiple,
        maxAlbums: settings.artistCoverStackSize,
        preferArtistCover: settings.artistCoverStackPreferArtistCover,
        sortBy: settings.artistCoverStackSortBy,
        sortOrder: settings.artistCoverStackSortOrder,
    });

    const artistImageDisplay = getArtistImageDisplay(
        itemType || LibraryItem.SONG,
        settings,
        albumStackData,
    );

    if (itemCount === 0) {
        return null;
    }

    return (
        <div className={styles.container}>
            <div className={styles.divider} />
            <div className={styles.preview}>
                <div className={styles.content}>
                    {artistImageDisplay.showStackedCovers && artistImageDisplay.albumIds ? (
                        <div className={styles.imageContainer}>
                            <StackedCovers
                                albumIds={artistImageDisplay.albumIds}
                                className={styles.image}
                                fitment={artistImageDisplay.fitment}
                                maxStackSize={artistImageDisplay.maxStackSize}
                                overfitSize={artistImageDisplay.overfitSize}
                                spunRotation={artistImageDisplay.spunRotation}
                                staggerHeight={artistImageDisplay.staggerHeight}
                                staggerWidth={artistImageDisplay.staggerWidth}
                                style={artistImageDisplay.stackStyle}
                            />
                            <div className={styles.imageOverlay} />
                        </div>
                    ) : itemImage ? (
                        <div className={styles.imageContainer}>
                            <img alt={itemName} className={styles.image} src={imageUrl} />
                            <div className={styles.imageOverlay} />
                        </div>
                    ) : (
                        <div className={styles.iconContainer}>
                            {itemType === LibraryItem.ALBUM && <Icon icon="album" size="md" />}
                            {itemType === LibraryItem.SONG && <Icon icon="itemSong" size="md" />}
                            {itemType === LibraryItem.ALBUM_ARTIST && (
                                <Icon icon="artist" size="md" />
                            )}
                            {itemType === LibraryItem.ARTIST && <Icon icon="artist" size="md" />}
                            {itemType === LibraryItem.PLAYLIST && (
                                <Icon icon="playlist" size="md" />
                            )}
                            {itemType === LibraryItem.GENRE && <Icon icon="genre" size="md" />}
                            {itemType === LibraryItem.FOLDER && <Icon icon="folder" size="md" />}
                            {!itemType && <Icon icon="library" size="md" />}
                        </div>
                    )}
                    <div className={styles.textContainer}>
                        <Text className={styles.name} isNoSelect>
                            {itemName}
                        </Text>
                        {isMultiple && (
                            <Text className={styles.count} isNoSelect>
                                +{t('common.itemsMore', { count: itemCount - 1 })}
                            </Text>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

ContextMenuPreview.displayName = 'ContextMenuPreview';
