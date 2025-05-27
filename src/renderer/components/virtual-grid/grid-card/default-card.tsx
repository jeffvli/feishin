import clsx from 'clsx';
import { useState } from 'react';
import { generatePath, useNavigate } from 'react-router-dom';
import { ListChildComponentProps } from 'react-window';

import styles from './default-card.module.css';

import { CardRows } from '/@/renderer/components/card/card-rows';
import { GridCardControls } from '/@/renderer/components/virtual-grid/grid-card/grid-card-controls';
import { Image } from '/@/shared/components/image/image';
import { Skeleton } from '/@/shared/components/skeleton/skeleton';
import { Stack } from '/@/shared/components/stack/stack';
import {
    Album,
    AlbumArtist,
    Artist,
    LibraryItem,
    Playlist,
    Song,
} from '/@/shared/types/domain-types';
import { CardRoute, CardRow, Play, PlayQueueAddOptions } from '/@/shared/types/types';

interface BaseGridCardProps {
    columnIndex: number;
    controls: {
        cardRows: CardRow<Album | AlbumArtist | Artist | Playlist | Song>[];
        handleFavorite: (options: {
            id: string[];
            isFavorite: boolean;
            itemType: LibraryItem;
        }) => void;
        handlePlayQueueAdd: (options: PlayQueueAddOptions) => void;
        itemGap: number;
        itemType: LibraryItem;
        playButtonBehavior: Play;
        resetInfiniteLoaderCache: () => void;
        route: CardRoute;
    };
    data: any;
    isHidden?: boolean;
    listChildProps: Omit<ListChildComponentProps, 'data' | 'style'>;
}

export const DefaultCard = ({
    columnIndex,
    controls,
    data,
    isHidden,
    listChildProps,
}: BaseGridCardProps) => {
    const navigate = useNavigate();

    const [isHovered, setIsHovered] = useState(false);

    if (data) {
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
                className={clsx(styles.container, isHidden && styles.isHidden)}
                key={`card-${columnIndex}-${listChildProps.index}`}
                onClick={() => navigate(path)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    margin: controls.itemGap,
                }}
            >
                <div className={styles.innerContainer}>
                    <div
                        className={clsx(
                            styles.imageContainer,
                            data?.userFavorite && styles.isFavorite,
                        )}
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
                            resetInfiniteLoaderCache={controls.resetInfiniteLoaderCache}
                        />
                    </div>
                    <div className={styles.detailContainer}>
                        <CardRows
                            data={data}
                            rows={controls.cardRows}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={clsx(styles.container, isHidden && styles.isHidden)}
            key={`card-${columnIndex}-${listChildProps.index}`}
            style={{
                margin: controls.itemGap,
            }}
        >
            <div className={styles.innerContainer}>
                <div className={styles.imageContainer}>
                    <Skeleton className={styles.image} />
                </div>
                <div className={styles.detailContainer}>
                    <Stack gap="xs">
                        {(controls?.cardRows || []).map((row, index) => (
                            <Skeleton key={`${index}-${columnIndex}-${row.arrayProperty}`} />
                        ))}
                    </Stack>
                </div>
            </div>
        </div>
    );
};
