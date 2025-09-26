import clsx from 'clsx';
import { AnimatePresence } from 'motion/react';
import { Dispatch, Fragment, lazy, ReactNode, SetStateAction, useState } from 'react';
import { generatePath, Link } from 'react-router-dom';

import styles from './item-card.module.css';

import { AppRoute } from '/@/renderer/router/routes';
import { Image } from '/@/shared/components/image/image';
import { Separator } from '/@/shared/components/separator/separator';
import { Text } from '/@/shared/components/text/text';
import {
    Album,
    AlbumArtist,
    Artist,
    LibraryItem,
    Playlist,
    Song,
} from '/@/shared/types/domain-types';

const ItemCardControls = lazy(() =>
    import('/@/renderer/components/item-card/item-card-controls').then((module) => ({
        default: module.ItemCardControls,
    })),
);

type DataRow = {
    format: (data: Album | AlbumArtist | Artist | Playlist | Song) => ReactNode | string;
    id: string;
    isMuted?: boolean;
};

interface ItemCardProps {
    data: Album | AlbumArtist | Artist | Playlist | Song;
    isRound?: boolean;
    onClick?: () => void;
    onItemExpand?: () => void;
    onItemSelect?: () => void;
    type?: 'compact' | 'default' | 'poster';
    withControls?: boolean;
}

export const ItemCard = ({
    data,
    isRound,
    onClick,
    onItemExpand,
    onItemSelect,
    type = 'poster',
    withControls,
}: ItemCardProps) => {
    const imageUrl = getImageUrl(data);
    const rows = getDataRows(data);

    const [showControls, setShowControls] = useState(false);

    switch (type) {
        case 'compact':
            return (
                <CompactItemCard
                    data={data}
                    imageUrl={imageUrl}
                    isRound={isRound}
                    onClick={onClick}
                    onItemExpand={onItemExpand}
                    onItemSelect={onItemSelect}
                    rows={rows}
                    setShowControls={setShowControls}
                    showControls={showControls}
                    withControls={withControls}
                />
            );
        case 'poster':
            return (
                <PosterItemCard
                    data={data}
                    imageUrl={imageUrl}
                    isRound={isRound}
                    onClick={onClick}
                    onItemExpand={onItemExpand}
                    onItemSelect={onItemSelect}
                    rows={rows}
                    setShowControls={setShowControls}
                    showControls={showControls}
                    withControls={withControls}
                />
            );
        case 'default':
        default:
            return (
                <DefaultItemCard
                    data={data}
                    imageUrl={imageUrl}
                    isRound={isRound}
                    onClick={onClick}
                    onItemExpand={onItemExpand}
                    onItemSelect={onItemSelect}
                    rows={rows}
                    setShowControls={setShowControls}
                    showControls={showControls}
                    withControls={withControls}
                />
            );
    }
};

export interface ItemCardDerivativeProps extends Omit<ItemCardProps, 'type'> {
    imageUrl: string | undefined;
    rows: DataRow[];
    setShowControls: Dispatch<SetStateAction<boolean>>;
    showControls: boolean;
}

const CompactItemCard = ({
    data,
    imageUrl,
    isRound,
    onClick,
    onItemExpand,
    onItemSelect,
    rows,
    setShowControls,
    showControls,
    withControls,
}: ItemCardDerivativeProps) => {
    return (
        <div className={clsx(styles.container, styles.compact)}>
            <div
                className={clsx(styles.imageContainer, { [styles.isRound]: isRound })}
                onClick={onClick}
                onMouseEnter={() => withControls && setShowControls(true)}
                onMouseLeave={() => withControls && setShowControls(false)}
            >
                <Image
                    className={clsx(styles.image, { [styles.isRound]: isRound })}
                    src={imageUrl}
                />
                <AnimatePresence>
                    {withControls && showControls && <ItemCardControls type="compact" />}
                </AnimatePresence>
                <div className={clsx(styles.detailContainer, styles.compact)}>
                    {rows.map((row) => (
                        <ItemCardRow data={data} key={row.id} row={row} type="compact" />
                    ))}
                </div>
            </div>
        </div>
    );
};

const DefaultItemCard = ({
    data,
    imageUrl,
    isRound,
    onClick,
    onItemExpand,
    onItemSelect,
    rows,
    setShowControls,
    showControls,
    withControls,
}: ItemCardDerivativeProps) => {
    return (
        <div className={clsx(styles.container)}>
            <div
                className={clsx(styles.imageContainer, { [styles.isRound]: isRound })}
                onClick={onClick}
                onDoubleClick={onItemExpand}
                onMouseEnter={() => withControls && setShowControls(true)}
                onMouseLeave={() => withControls && setShowControls(false)}
            >
                <Image
                    className={clsx(styles.image, { [styles.isRound]: isRound })}
                    src={imageUrl}
                />
                <AnimatePresence>
                    {withControls && showControls && <ItemCardControls type="default" />}
                </AnimatePresence>
            </div>
            <div className={styles.detailContainer}>
                {rows.map((row) => (
                    <Fragment key={row.id}>
                        <ItemCardRow data={data} row={row} type="default" />
                    </Fragment>
                ))}
            </div>
        </div>
    );
};

const PosterItemCard = ({
    data,
    imageUrl,
    isRound,
    onClick,
    onItemExpand,
    onItemSelect,
    rows,
    setShowControls,
    showControls,
    withControls,
}: ItemCardDerivativeProps) => {
    return (
        <div className={clsx(styles.container, styles.poster)}>
            <div
                className={clsx(styles.imageContainer, { [styles.isRound]: isRound })}
                onClick={onClick}
                onMouseEnter={() => withControls && setShowControls(true)}
                onMouseLeave={() => withControls && setShowControls(false)}
            >
                <Image
                    className={clsx(styles.image, { [styles.isRound]: isRound })}
                    src={imageUrl}
                />
                <AnimatePresence>
                    {withControls && showControls && <ItemCardControls type="poster" />}
                </AnimatePresence>
            </div>
            <div className={styles.detailContainer}>
                {rows.map((row) => (
                    <Fragment key={row.id}>
                        <ItemCardRow data={data} row={row} type="poster" />
                    </Fragment>
                ))}
            </div>
        </div>
    );
};

const getDataRows = (data: Album | AlbumArtist | Artist | Playlist | Song): DataRow[] => {
    switch (data.itemType) {
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
    }
};

const getImageUrl = (data: Album | AlbumArtist | Artist | Playlist | Song) => {
    if ('imageUrl' in data) {
        return data.imageUrl || undefined;
    }

    return undefined;
};

const ItemCardRow = ({
    data,
    row,
    type,
}: {
    data: Album | AlbumArtist | Artist | Playlist | Song;
    row: DataRow;
    type?: 'compact' | 'default' | 'poster';
}) => {
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
