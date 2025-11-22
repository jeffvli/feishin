import { AnimatePresence } from 'motion/react';
import { MouseEvent, useMemo, useState } from 'react';
import { Link } from 'react-router';

import styles from './item-detail.module.css';

import { ItemCardControls } from '/@/renderer/components/item-card/item-card-controls';
import { useFastAverageColor } from '/@/renderer/hooks';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Badge } from '/@/shared/components/badge/badge';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { Image } from '/@/shared/components/image/image';
import { Rating } from '/@/shared/components/rating/rating';
import { Text } from '/@/shared/components/text/text';
import {
    Album,
    AlbumArtist,
    Artist,
    LibraryItem,
    Playlist,
    Song,
} from '/@/shared/types/domain-types';
import { stringToColor } from '/@/shared/utils/string-to-color';

interface ItemDetailProps {
    data: Album | AlbumArtist | Artist | Playlist | Song | undefined;
    itemHeight: number;
    itemType: LibraryItem;
    onClick?: (e: MouseEvent<HTMLDivElement>, item: unknown, itemType: LibraryItem) => void;
    withControls?: boolean;
}

export const ItemDetail = ({ data, itemType, onClick, withControls }: ItemDetailProps) => {
    const imageUrl = getImageUrl(data);

    const [showControls, setShowControls] = useState(false);

    const { background } = useFastAverageColor({
        algorithm: 'simple',
        src: imageUrl,
        srcLoaded: false,
    });

    // const tags = [...(data?.genres ?? [])];

    const tags = useMemo(() => {
        if (!data) {
            return [];
        }

        const items: {
            color?: string;
            id: string;
            isLight?: boolean;
            itemType: LibraryItem;
            name: string;
        }[] = [];

        if ('albumArtists' in data && Array.isArray(data.albumArtists)) {
            data.albumArtists?.forEach((tag: { id: string; name: string }) => {
                items.push({ id: tag.id, itemType: LibraryItem.ALBUM_ARTIST, name: tag.name });
            });
        }

        if ('genres' in data && Array.isArray(data.genres)) {
            data.genres?.forEach((tag: { id: string; itemType: LibraryItem; name: string }) => {
                const { color, isLight } = stringToColor(tag.name);
                items.push({ ...tag, color, isLight });
            });
        }

        // if ('tags' in data && typeof data.tags === 'object') {
        //     console.log('data.tags :>> ', data.tags);
        //     Object.entries(data.tags).forEach(([key, value]) => {
        //         items.push({ id: key, itemType: LibraryItem.TAG, name: value });
        //     });
        // }

        return items;
    }, [data]);

    return (
        <div
            className={styles.container}
            onClick={(e) => onClick?.(e, data, itemType)}
            style={{ backgroundColor: background }}
        >
            <div
                className={styles.imageContainer}
                onMouseEnter={() => withControls && setShowControls(true)}
                onMouseLeave={() => withControls && setShowControls(false)}
            >
                <Image alt={data?.name} src={imageUrl} />
                <AnimatePresence>
                    {withControls && showControls && <ItemCardControls type="compact" />}
                </AnimatePresence>
            </div>
            <div className={styles.metadataContainer}>
                <div className={styles.header}>
                    <Text className={styles.title} component={Link} isLink size="lg" weight={500}>
                        {data?.name}
                    </Text>
                    <Group>
                        {data && 'userRating' in data && (
                            <Rating size="xs" value={data?.userRating ?? 0} />
                        )}
                        {data && 'userFavorite' in data && (
                            <ActionIcon
                                icon="favorite"
                                iconProps={{
                                    fill: data?.userFavorite ? 'favorite' : 'default',
                                }}
                                size="xs"
                            />
                        )}
                    </Group>
                </div>
                <Divider />
                <div className={styles.content}>
                    <Group className={styles.tags} gap="xs">
                        {tags.map((tag) => (
                            <Badge
                                key={tag.id}
                                style={{
                                    backgroundColor: tag.color,
                                    color: tag.isLight ? 'black' : 'white',
                                }}
                            >
                                {tag.name}
                            </Badge>
                        ))}
                    </Group>
                </div>
            </div>
        </div>
    );
};

const getImageUrl = (data: Album | AlbumArtist | Artist | Playlist | Song | undefined) => {
    if (data && 'imageUrl' in data) {
        return data.imageUrl || undefined;
    }

    return undefined;
};
