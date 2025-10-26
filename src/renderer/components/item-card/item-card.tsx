import clsx from 'clsx';
import { AnimatePresence } from 'motion/react';
import { Fragment, memo, ReactNode, useState } from 'react';
import { generatePath, Link } from 'react-router';

import styles from './item-card.module.css';

import { ItemCardControls } from '/@/renderer/components/item-card/item-card-controls';
import { ItemControls } from '/@/renderer/components/item-list/types';
import { AppRoute } from '/@/renderer/router/routes';
import { Image } from '/@/shared/components/image/image';
import { Separator } from '/@/shared/components/separator/separator';
import { Skeleton } from '/@/shared/components/skeleton/skeleton';
import { Text } from '/@/shared/components/text/text';
import {
    Album,
    AlbumArtist,
    Artist,
    LibraryItem,
    Playlist,
    Song,
} from '/@/shared/types/domain-types';

type DataRow = {
    format: (data: Album | AlbumArtist | Artist | Playlist | Song) => ReactNode | string;
    id: string;
    isMuted?: boolean;
};

interface ItemCardProps {
    controls: ItemControls;
    data: Album | AlbumArtist | Artist | Playlist | Song | undefined;
    isRound?: boolean;
    itemType: LibraryItem;
    type?: 'compact' | 'default' | 'poster';
    withControls?: boolean;
}

export const ItemCard = ({
    controls,
    data,
    isRound,
    itemType,
    type = 'poster',
    withControls,
}: ItemCardProps) => {
    const imageUrl = getImageUrl(data);
    const rows = getDataRows(itemType);

    switch (type) {
        case 'compact':
            return (
                <CompactItemCard
                    controls={controls}
                    data={data}
                    imageUrl={imageUrl}
                    isRound={isRound}
                    itemType={itemType}
                    rows={rows}
                    withControls={withControls}
                />
            );
        case 'poster':
            return (
                <PosterItemCard
                    controls={controls}
                    data={data}
                    imageUrl={imageUrl}
                    isRound={isRound}
                    itemType={itemType}
                    rows={rows}
                    withControls={withControls}
                />
            );
        case 'default':
        default:
            return (
                <DefaultItemCard
                    controls={controls}
                    data={data}
                    imageUrl={imageUrl}
                    isRound={isRound}
                    itemType={itemType}
                    rows={rows}
                    withControls={withControls}
                />
            );
    }
};

export interface ItemCardDerivativeProps extends Omit<ItemCardProps, 'type'> {
    controls: ItemControls;
    imageUrl: string | undefined;
    rows: DataRow[];
}

const CompactItemCard = ({
    controls,
    data,
    imageUrl,
    isRound,
    itemType,
    rows,
    withControls,
}: ItemCardDerivativeProps) => {
    const [showControls, setShowControls] = useState(false);

    if (data) {
        const handleMouseEnter = () => {
            if (withControls) {
                setShowControls(true);
            }
        };

        const handleMouseLeave = () => {
            if (withControls) {
                setShowControls(false);
            }
        };

        const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
            controls?.onClick?.(data, itemType, e);
        };

        return (
            <div className={clsx(styles.container, styles.compact)}>
                <div
                    className={clsx(styles.imageContainer, { [styles.isRound]: isRound })}
                    onClick={handleClick}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <Image
                        className={clsx(styles.image, { [styles.isRound]: isRound })}
                        src={imageUrl}
                    />
                    <AnimatePresence>
                        {withControls && showControls && (
                            <ItemCardControls
                                controls={controls}
                                item={data}
                                itemType={itemType}
                                type="compact"
                            />
                        )}
                    </AnimatePresence>
                    <div className={clsx(styles.detailContainer, styles.compact)}>
                        {rows.map((row) => (
                            <ItemCardRow data={data!} key={row.id} row={row} type="compact" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={clsx(styles.container, styles.compact)}>
            <div className={clsx(styles.imageContainer, { [styles.isRound]: isRound })}>
                <Skeleton className={styles.image} enableAnimation />
                <div className={clsx(styles.detailContainer, styles.compact)}>
                    {rows.map((row) => (
                        <div className={styles.row} key={row.id}>
                            &nbsp;
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const DefaultItemCard = ({
    controls,
    data,
    imageUrl,
    isRound,
    itemType,
    rows,
    withControls,
}: ItemCardDerivativeProps) => {
    const [showControls, setShowControls] = useState(false);

    if (data) {
        const handleMouseEnter = () => {
            if (withControls) {
                setShowControls(true);
            }
        };

        const handleMouseLeave = () => {
            if (withControls) {
                setShowControls(false);
            }
        };

        const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
            controls?.onClick?.(data, itemType, e);
        };

        return (
            <div className={clsx(styles.container)}>
                <div
                    className={clsx(styles.imageContainer, { [styles.isRound]: isRound })}
                    onClick={handleClick}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <Image
                        className={clsx(styles.image, { [styles.isRound]: isRound })}
                        src={imageUrl}
                    />
                    <AnimatePresence>
                        {withControls && showControls && (
                            <ItemCardControls
                                controls={controls}
                                item={data}
                                itemType={itemType}
                                type="default"
                            />
                        )}
                    </AnimatePresence>
                </div>
                <div className={styles.detailContainer}>
                    {rows.map((row) => (
                        <ItemCardRow data={data!} key={row.id} row={row} type="default" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={clsx(styles.container)}>
            <div className={clsx(styles.imageContainer, { [styles.isRound]: isRound })}>
                <Skeleton className={styles.image} enableAnimation />
            </div>
            <div className={styles.detailContainer}>
                {rows.map((row) => (
                    <div className={styles.row} key={row.id}>
                        &nbsp;
                    </div>
                ))}
            </div>
        </div>
    );
};

const PosterItemCard = ({
    controls,
    data,
    imageUrl,
    isRound,
    itemType,
    rows,
    withControls,
}: ItemCardDerivativeProps) => {
    const [showControls, setShowControls] = useState(false);

    if (data) {
        const handleMouseEnter = () => {
            if (withControls) {
                setShowControls(true);
            }
        };

        const handleMouseLeave = () => {
            if (withControls) {
                setShowControls(false);
            }
        };

        const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
            controls?.onClick?.(data, itemType, e);
        };

        return (
            <div className={clsx(styles.container, styles.poster)}>
                <div
                    className={clsx(styles.imageContainer, { [styles.isRound]: isRound })}
                    onClick={handleClick}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <Image
                        className={clsx(styles.image, { [styles.isRound]: isRound })}
                        src={imageUrl}
                    />
                    {withControls && showControls && data && (
                        <ItemCardControls
                            controls={controls}
                            item={data}
                            itemType={itemType}
                            type="poster"
                        />
                    )}
                </div>
                {data && (
                    <div className={styles.detailContainer}>
                        {rows.map((row) => (
                            <ItemCardRow data={data} key={row.id} row={row} type="poster" />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={clsx(styles.container, styles.poster)}>
            <div className={clsx(styles.imageContainer, { [styles.isRound]: isRound })}>
                <Skeleton
                    className={clsx(styles.image, { [styles.isRound]: isRound })}
                    enableAnimation
                />
            </div>
            <div className={styles.detailContainer}>
                {rows.map((row) => (
                    <div className={styles.row} key={row.id}>
                        &nbsp;
                    </div>
                ))}
            </div>
        </div>
    );
};

const getDataRows = (itemType: LibraryItem): DataRow[] => {
    switch (itemType) {
        case LibraryItem.ALBUM:
            return [
                {
                    format: (data) => {
                        const album = data as Album;
                        return (
                            <Link
                                to={generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, {
                                    albumId: album.id,
                                })}
                            >
                                {album.name}
                            </Link>
                        );
                    },
                    id: 'name',
                },
                {
                    format: (data) => {
                        const album = data as Album;
                        return album.albumArtists.map((artist, index) => (
                            <Fragment key={artist.id}>
                                <Link
                                    to={generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL, {
                                        albumArtistId: artist.id,
                                    })}
                                >
                                    {artist.name}
                                </Link>
                                {index < album.albumArtists.length - 1 && <Separator />}
                            </Fragment>
                        ));
                    },
                    id: 'albumArtists',
                    isMuted: true,
                },
            ];
        case LibraryItem.ALBUM_ARTIST:
            return [{ format: (data) => (data as AlbumArtist).name, id: 'name' }];
        case LibraryItem.ARTIST:
            return [{ format: (data) => (data as Artist).name, id: 'name' }];
        case LibraryItem.PLAYLIST:
            return [{ format: (data) => (data as Playlist).name, id: 'name' }];
        case LibraryItem.SONG:
            return [{ format: (data) => (data as Song).name, id: 'name' }];
        default:
            return [];
    }
};

export const getDataRowsCount = (itemType: LibraryItem) => {
    switch (itemType) {
        case LibraryItem.ALBUM:
            return 2;
        case LibraryItem.ALBUM_ARTIST:
            return 1;
        case LibraryItem.ARTIST:
            return 1;
        case LibraryItem.PLAYLIST:
            return 2;
        case LibraryItem.SONG:
            return 2;
        default:
            return 1;
    }
};

const getImageUrl = (data: Album | AlbumArtist | Artist | Playlist | Song | undefined) => {
    if (data && 'imageUrl' in data) {
        return data.imageUrl || undefined;
    }

    return undefined;
};

const ItemCardRow = ({
    data,
    row,
    type,
}: {
    data: Album | AlbumArtist | Artist | Playlist | Song | undefined;
    row: DataRow;
    type?: 'compact' | 'default' | 'poster';
}) => {
    if (!data) {
        return (
            <div
                className={clsx(styles.row, {
                    [styles.compact]: type === 'compact',
                    [styles.default]: type === 'default',
                    [styles.muted]: row.isMuted,
                    [styles.poster]: type === 'poster',
                })}
            >
                &nbsp;
            </div>
        );
    }

    return (
        <Text
            className={clsx(styles.row, {
                [styles.compact]: type === 'compact',
                [styles.default]: type === 'default',
                [styles.muted]: row.isMuted,
                [styles.poster]: type === 'poster',
            })}
        >
            {row.format(data)}
        </Text>
    );
};

export const MemoizedItemCard = memo(ItemCard);
