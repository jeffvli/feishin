import { useState } from 'react';
import { generatePath, Link } from 'react-router-dom';

import styles from './poster-card.module.css';

import { CardRows } from '/@/renderer/components/card/card-rows';
import { GridCardControls } from '/@/renderer/components/virtual-grid/grid-card/grid-card-controls';
import { Image } from '/@/shared/components/image/image';
import { Skeleton } from '/@/shared/components/skeleton/skeleton';
import { Stack } from '/@/shared/components/stack/stack';
import { Album, AlbumArtist, Artist, LibraryItem } from '/@/shared/types/domain-types';
import { CardRoute, CardRow, Play, PlayQueueAddOptions } from '/@/shared/types/types';

interface BaseGridCardProps {
    controls: {
        cardRows: CardRow<Album>[] | CardRow<AlbumArtist>[] | CardRow<Artist>[];
        handleFavorite: (options: {
            id: string[];
            isFavorite: boolean;
            itemType: LibraryItem;
            serverId: string;
        }) => void;
        handlePlayQueueAdd: ((options: PlayQueueAddOptions) => void) | undefined;
        itemType: LibraryItem;
        playButtonBehavior: Play;
        route: CardRoute;
    };
    data: any;
    isLoading?: boolean;
}

export const PosterCard = ({
    controls,
    data,
    isLoading,
    uniqueId,
}: BaseGridCardProps & { uniqueId: string }) => {
    const [isHovered, setIsHovered] = useState(false);

    if (!isLoading) {
        const path = generatePath(
            controls.route.route as string,
            controls.route.slugs?.reduce((acc, slug) => {
                return {
                    ...acc,
                    [slug.slugProperty]: data[slug.idProperty],
                };
            }, {}),
        );

        return (
            <div
                className={styles.container}
                key={`${uniqueId}-${data.id}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <Link
                    className={styles.imageContainer}
                    to={path}
                >
                    <Image
                        className={styles.image}
                        src={data?.imageUrl}
                    />
                    <GridCardControls
                        handleFavorite={controls.handleFavorite}
                        handlePlayQueueAdd={controls.handlePlayQueueAdd}
                        isHovered={isHovered}
                        itemData={data}
                        itemType={controls.itemType}
                    />
                </Link>
                <div className={styles.detailContainer}>
                    <CardRows
                        data={data}
                        rows={controls.cardRows}
                    />
                </div>
            </div>
        );
    }

    return (
        <div
            className={styles.container}
            key={`placeholder-${uniqueId}-${data.id}`}
        >
            <div className={styles.imageContainer}>
                <Skeleton className={styles.image} />
            </div>
            <div className={styles.detailContainer}>
                <Stack gap="xs">
                    {(controls?.cardRows || []).map((row, index) => (
                        <Skeleton
                            height={14}
                            key={`${index}-${row.arrayProperty}`}
                        />
                    ))}
                </Stack>
            </div>
        </div>
    );
};
