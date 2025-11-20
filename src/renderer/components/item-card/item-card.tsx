import clsx from 'clsx';
import formatDuration from 'format-duration';
import { AnimatePresence } from 'motion/react';
import { Fragment, memo, ReactNode, useState } from 'react';
import { generatePath, Link } from 'react-router';

import styles from './item-card.module.css';

import { ItemCardControls } from '/@/renderer/components/item-card/item-card-controls';
import { getDraggedItems } from '/@/renderer/components/item-list/helpers/get-dragged-items';
import { getTitlePath } from '/@/renderer/components/item-list/helpers/get-title-path';
import { ItemListStateActions } from '/@/renderer/components/item-list/helpers/item-list-state';
import { ItemControls } from '/@/renderer/components/item-list/types';
import { useDragDrop } from '/@/renderer/hooks/use-drag-drop';
import { AppRoute } from '/@/renderer/router/routes';
import { formatDateAbsolute, formatDateRelative, formatRating } from '/@/renderer/utils/format';
import { Image } from '/@/shared/components/image/image';
import { Separator } from '/@/shared/components/separator/separator';
import { Skeleton } from '/@/shared/components/skeleton/skeleton';
import { Text } from '/@/shared/components/text/text';
import { useDoubleClick } from '/@/shared/hooks/use-double-click';
import {
    Album,
    AlbumArtist,
    Artist,
    LibraryItem,
    Playlist,
    Song,
} from '/@/shared/types/domain-types';
import { DragOperation, DragTarget } from '/@/shared/types/drag-and-drop';

export type DataRow = {
    align?: 'center' | 'end' | 'start';
    format: (data: Album | AlbumArtist | Artist | Playlist | Song) => null | ReactNode | string;
    id: string;
    isMuted?: boolean;
};

export interface ItemCardProps {
    controls?: ItemControls;
    data: Album | AlbumArtist | Artist | Playlist | Song | undefined;
    enableDrag?: boolean;
    internalState?: ItemListStateActions;
    isRound?: boolean;
    itemType: LibraryItem;
    rows?: DataRow[];
    type?: 'compact' | 'default' | 'poster';
    withControls?: boolean;
}

export const ItemCard = ({
    controls,
    data,
    enableDrag,
    internalState,
    isRound,
    itemType,
    rows: providedRows,
    type = 'poster',
    withControls,
}: ItemCardProps) => {
    const imageUrl = getImageUrl(data);
    const defaultRows = getDataRows();
    const rows = providedRows && providedRows.length > 0 ? providedRows : defaultRows;

    switch (type) {
        case 'compact':
            return (
                <CompactItemCard
                    controls={controls}
                    data={data}
                    enableDrag={enableDrag}
                    imageUrl={imageUrl}
                    internalState={internalState}
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
                    enableDrag={enableDrag}
                    imageUrl={imageUrl}
                    internalState={internalState}
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
                    enableDrag={enableDrag}
                    imageUrl={imageUrl}
                    internalState={internalState}
                    isRound={isRound}
                    itemType={itemType}
                    rows={rows}
                    withControls={withControls}
                />
            );
    }
};

export interface ItemCardDerivativeProps extends Omit<ItemCardProps, 'type'> {
    controls?: ItemControls;
    imageUrl: string | undefined;
    internalState?: ItemListStateActions;
    rows: DataRow[];
}

const CompactItemCard = ({
    controls,
    data,
    imageUrl,
    internalState,
    isRound,
    itemType,
    rows,
    withControls,
}: ItemCardDerivativeProps) => {
    const [showControls, setShowControls] = useState(false);
    const isSelected =
        data && internalState && typeof data === 'object' && 'id' in data
            ? internalState.isSelected(internalState.extractRowId(data) || '')
            : false;

    const handleClick = useDoubleClick({
        onDoubleClick: (e: React.MouseEvent<HTMLDivElement>) => {
            if (!data || !controls || !internalState) {
                return;
            }

            controls.onDoubleClick?.({
                event: e,
                internalState,
                item: data as any,
                itemType,
            });
        },
        onSingleClick: (e: React.MouseEvent<HTMLDivElement>) => {
            if (!data || !controls || !internalState) {
                return;
            }

            // Don't trigger selection if clicking on interactive elements
            const target = e.target as HTMLElement;
            const isInteractiveElement = target.closest(
                'button, a, input, select, textarea, [role="button"]',
            );

            if (isInteractiveElement) {
                return;
            }

            controls.onClick?.({
                event: e,
                internalState,
                item: data as any,
                itemType,
            });
        },
    });

    if (data) {
        const navigationPath = getItemNavigationPath(data, itemType);

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

        const handleContextMenu = (e: React.MouseEvent<HTMLElement>) => {
            if (!data || !controls) {
                return;
            }

            e.preventDefault();

            controls.onMore?.({
                event: e,
                internalState,
                item: data as any,
                itemType,
            });
        };

        const handleImageClick = (e: React.MouseEvent<HTMLElement>) => {
            // Prevent navigation on double-click, let the double-click handler work
            if (e.detail === 2 && navigationPath) {
                e.preventDefault();
            }
            handleClick(e as any);
        };

        const imageContainerClassName = clsx(styles.imageContainer, {
            [styles.isRound]: isRound,
        });

        const isFavorite =
            'userFavorite' in data && (data as { userFavorite: boolean }).userFavorite;

        const imageContainerContent = (
            <>
                <Image
                    className={clsx(styles.image, { [styles.isRound]: isRound })}
                    src={imageUrl}
                />
                {isFavorite && <div className={styles.favoriteBadge} />}
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
                    {rows
                        .filter(
                            (row): row is NonNullable<typeof row> =>
                                row !== null && row !== undefined,
                        )
                        .map((row, index) => (
                            <ItemCardRow
                                data={data!}
                                index={index}
                                key={row.id}
                                row={row}
                                type="compact"
                            />
                        ))}
                </div>
            </>
        );

        return (
            <div
                className={clsx(styles.container, styles.compact, {
                    [styles.selected]: isSelected,
                })}
            >
                {navigationPath ? (
                    <Link
                        className={imageContainerClassName}
                        onClick={handleImageClick}
                        onContextMenu={handleContextMenu}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        to={navigationPath}
                    >
                        {imageContainerContent}
                    </Link>
                ) : (
                    <div
                        className={imageContainerClassName}
                        onClick={handleImageClick}
                        onContextMenu={handleContextMenu}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        {imageContainerContent}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={clsx(styles.container, styles.compact)}>
            <div className={clsx(styles.imageContainer, { [styles.isRound]: isRound })}>
                <Skeleton className={styles.image} />
                <div className={clsx(styles.detailContainer, styles.compact)}>
                    {rows
                        .filter(
                            (row): row is NonNullable<typeof row> =>
                                row !== null && row !== undefined,
                        )
                        .map((row, index) => (
                            <div
                                className={clsx(styles.row, {
                                    [styles.muted]: index > 0,
                                })}
                                key={row.id}
                            >
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
    internalState,
    isRound,
    itemType,
    rows,
    withControls,
}: ItemCardDerivativeProps) => {
    const [showControls, setShowControls] = useState(false);
    const isSelected =
        data && internalState && typeof data === 'object' && 'id' in data
            ? internalState.isSelected(internalState.extractRowId(data) || '')
            : false;

    const handleClick = useDoubleClick({
        onDoubleClick: (e: React.MouseEvent<HTMLDivElement>) => {
            if (!data || !controls || !internalState) {
                return;
            }

            controls.onDoubleClick?.({
                event: e,
                internalState,
                item: data as any,
                itemType,
            });
        },
        onSingleClick: (e: React.MouseEvent<HTMLDivElement>) => {
            if (!data || !controls || !internalState) {
                return;
            }

            // Don't trigger selection if clicking on interactive elements
            const target = e.target as HTMLElement;
            const isInteractiveElement = target.closest(
                'button, a, input, select, textarea, [role="button"]',
            );

            if (isInteractiveElement) {
                return;
            }

            controls.onClick?.({
                event: e,
                internalState,
                item: data as any,
                itemType,
            });
        },
    });

    if (data) {
        const navigationPath = getItemNavigationPath(data, itemType);

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

        const handleContextMenu = (e: React.MouseEvent<HTMLElement>) => {
            if (!data || !controls) {
                return;
            }

            e.preventDefault();

            controls.onMore?.({
                event: e,
                internalState,
                item: data as any,
                itemType,
            });
        };

        const handleImageClick = (e: React.MouseEvent<HTMLElement>) => {
            // Prevent navigation on double-click, let the double-click handler work
            if (e.detail === 2 && navigationPath) {
                e.preventDefault();
            }
            handleClick(e as any);
        };

        const imageContainerClassName = clsx(styles.imageContainer, {
            [styles.isRound]: isRound,
        });

        const isFavorite =
            'userFavorite' in data && (data as { userFavorite: boolean }).userFavorite;

        const imageContainerContent = (
            <>
                <Image
                    className={clsx(styles.image, { [styles.isRound]: isRound })}
                    src={imageUrl}
                />
                {isFavorite && <div className={styles.favoriteBadge} />}
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
            </>
        );

        return (
            <div
                className={clsx(styles.container, {
                    [styles.selected]: isSelected,
                })}
            >
                {navigationPath ? (
                    <Link
                        className={imageContainerClassName}
                        onClick={handleImageClick}
                        onContextMenu={handleContextMenu}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        to={navigationPath}
                    >
                        {imageContainerContent}
                    </Link>
                ) : (
                    <div
                        className={imageContainerClassName}
                        onClick={handleImageClick}
                        onContextMenu={handleContextMenu}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        {imageContainerContent}
                    </div>
                )}
                <div className={styles.detailContainer}>
                    {rows
                        .filter(
                            (row): row is NonNullable<typeof row> =>
                                row !== null && row !== undefined,
                        )
                        .map((row, index) => (
                            <ItemCardRow
                                data={data!}
                                index={index}
                                key={row.id}
                                row={row}
                                type="default"
                            />
                        ))}
                </div>
            </div>
        );
    }

    return (
        <div className={clsx(styles.container)}>
            <div className={clsx(styles.imageContainer, { [styles.isRound]: isRound })}>
                <Skeleton className={styles.image} />
            </div>
            <div className={styles.detailContainer}>
                {rows
                    .filter(
                        (row): row is NonNullable<typeof row> => row !== null && row !== undefined,
                    )
                    .map((row, index) => (
                        <div
                            className={clsx(styles.row, {
                                [styles.muted]: index > 0,
                            })}
                            key={row.id}
                        >
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
    enableDrag,
    imageUrl,
    internalState,
    isRound,
    itemType,
    rows,
    withControls,
}: ItemCardDerivativeProps) => {
    const [showControls, setShowControls] = useState(false);
    const isSelected =
        data && internalState && typeof data === 'object' && 'id' in data
            ? internalState.isSelected(internalState.extractRowId(data) || '')
            : false;

    const { isDragging: isDraggingLocal, ref } = useDragDrop<HTMLDivElement>({
        drag: {
            getId: () => {
                if (!data) {
                    return [];
                }

                const draggedItems = getDraggedItems(data, internalState);
                return draggedItems.map((item) => item.id);
            },
            getItem: () => {
                if (!data) {
                    return [];
                }

                const draggedItems = getDraggedItems(data, internalState);
                return draggedItems;
            },
            itemType,
            onDragStart: () => {
                if (!data) {
                    return;
                }

                const draggedItems = getDraggedItems(data, internalState);
                if (internalState) {
                    internalState.setDragging(draggedItems);
                }
            },
            onDrop: () => {
                if (internalState) {
                    internalState.setDragging([]);
                }
            },
            operation:
                itemType === LibraryItem.QUEUE_SONG
                    ? [DragOperation.REORDER, DragOperation.ADD]
                    : [DragOperation.ADD],
            target: DragTarget.ALBUM,
        },
        isEnabled: !!enableDrag && !!data,
    });

    const isDragging = data && internalState ? internalState.isDragging(data.id) : isDraggingLocal;

    const handleClick = useDoubleClick({
        onDoubleClick: (e: React.MouseEvent<HTMLDivElement>) => {
            if (!data || !controls || !internalState) {
                return;
            }

            controls.onDoubleClick?.({
                event: e,
                internalState,
                item: data as any,
                itemType,
            });
        },
        onSingleClick: (e: React.MouseEvent<HTMLDivElement>) => {
            if (!data || !controls || !internalState) {
                return;
            }

            // Don't trigger selection if clicking on interactive elements
            const target = e.target as HTMLElement;
            const isInteractiveElement = target.closest(
                'button, a, input, select, textarea, [role="button"]',
            );

            if (isInteractiveElement) {
                return;
            }

            controls.onClick?.({
                event: e,
                internalState,
                item: data as any,
                itemType,
            });
        },
    });

    if (data) {
        const navigationPath = getItemNavigationPath(data, itemType);

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

        const handleContextMenu = (e: React.MouseEvent<HTMLElement>) => {
            if (!data || !controls) {
                return;
            }

            e.preventDefault();

            controls.onMore?.({
                event: e,
                internalState,
                item: data as any,
                itemType,
            });
        };

        const handleImageClick = (e: React.MouseEvent<HTMLElement>) => {
            // Prevent navigation on double-click, let the double-click handler work
            if (e.detail === 2 && navigationPath) {
                e.preventDefault();
            }
            handleClick(e as any);
        };

        const imageContainerClassName = clsx(styles.imageContainer, {
            [styles.isRound]: isRound,
        });

        const isFavorite =
            'userFavorite' in data && (data as { userFavorite: boolean }).userFavorite;

        const imageContainerContent = (
            <>
                <Image
                    className={clsx(styles.image, { [styles.isRound]: isRound })}
                    src={imageUrl}
                />
                {isFavorite && <div className={styles.favoriteBadge} />}
                <AnimatePresence>
                    {withControls && showControls && data && (
                        <ItemCardControls
                            controls={controls}
                            internalState={internalState}
                            item={data}
                            itemType={itemType}
                            type="poster"
                        />
                    )}
                </AnimatePresence>
            </>
        );

        return (
            <div
                className={clsx(styles.container, styles.poster, {
                    [styles.dragging]: isDragging,
                    [styles.selected]: isSelected,
                })}
                ref={ref}
            >
                {navigationPath ? (
                    <Link
                        className={imageContainerClassName}
                        onClick={handleImageClick}
                        onContextMenu={handleContextMenu}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        to={navigationPath}
                    >
                        {imageContainerContent}
                    </Link>
                ) : (
                    <div
                        className={imageContainerClassName}
                        onClick={handleImageClick}
                        onContextMenu={handleContextMenu}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        {imageContainerContent}
                    </div>
                )}
                {data && (
                    <div className={styles.detailContainer}>
                        {rows
                            .filter(
                                (row): row is NonNullable<typeof row> =>
                                    row !== null && row !== undefined,
                            )
                            .map((row, index) => (
                                <ItemCardRow
                                    data={data}
                                    index={index}
                                    key={row.id}
                                    row={row}
                                    type="poster"
                                />
                            ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={clsx(styles.container, styles.poster)}>
            <div className={clsx(styles.imageContainer, { [styles.isRound]: isRound })}>
                <Skeleton className={clsx(styles.image, { [styles.isRound]: isRound })} />
            </div>
            <div className={styles.detailContainer}>
                {rows
                    .filter(
                        (row): row is NonNullable<typeof row> => row !== null && row !== undefined,
                    )
                    .map((row, index) => (
                        <div
                            className={clsx(styles.row, {
                                [styles.muted]: index > 0,
                            })}
                            key={row.id}
                        >
                            &nbsp;
                        </div>
                    ))}
            </div>
        </div>
    );
};

export const getDataRows = (): DataRow[] => {
    return [
        {
            format: (data) => {
                if ('name' in data && data.name) {
                    if ('id' in data && data.id) {
                        if ('_itemType' in data) {
                            switch (data._itemType) {
                                case LibraryItem.ALBUM:
                                    return (
                                        <Link
                                            to={generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, {
                                                albumId: data.id,
                                            })}
                                        >
                                            {data.name}
                                        </Link>
                                    );
                                case LibraryItem.ALBUM_ARTIST:
                                    return (
                                        <Link
                                            to={generatePath(
                                                AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL,
                                                {
                                                    albumArtistId: data.id,
                                                },
                                            )}
                                        >
                                            {data.name}
                                        </Link>
                                    );
                                case LibraryItem.PLAYLIST:
                                    return (
                                        <Link
                                            to={generatePath(AppRoute.PLAYLISTS_DETAIL_SONGS, {
                                                playlistId: data.id,
                                            })}
                                        >
                                            {data.name}
                                        </Link>
                                    );
                                default:
                                    return data.name;
                            }
                        }
                    }
                    return data.name;
                }
                return '';
            },
            id: 'name',
        },
        {
            format: (data) => {
                if ('albumArtists' in data && Array.isArray(data.albumArtists)) {
                    return (data as Album | Song).albumArtists.map((artist, index) => (
                        <Fragment key={artist.id}>
                            <Link
                                to={generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL, {
                                    albumArtistId: artist.id,
                                })}
                            >
                                {artist.name}
                            </Link>
                            {index < (data as Album | Song).albumArtists.length - 1 && (
                                <Separator />
                            )}
                        </Fragment>
                    ));
                }
                return '';
            },
            id: 'albumArtists',
            isMuted: true,
        },
        {
            format: (data) => {
                if ('artists' in data && Array.isArray(data.artists)) {
                    return (data as Album | Song).artists.map((artist, index) => (
                        <Fragment key={artist.id}>
                            <Link
                                to={generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL, {
                                    albumArtistId: artist.id,
                                })}
                            >
                                {artist.name}
                            </Link>
                            {index < (data as Album | Song).artists.length - 1 && <Separator />}
                        </Fragment>
                    ));
                }
                return '';
            },
            id: 'artists',
            isMuted: true,
        },
        {
            format: (data) => {
                if ('duration' in data && data.duration !== null) {
                    return formatDuration(data.duration * 1000);
                }
                return '';
            },
            id: 'duration',
        },
        {
            format: (data) => {
                if ('releaseYear' in data && data.releaseYear !== null) {
                    return String(data.releaseYear);
                }
                return '';
            },
            id: 'releaseYear',
        },
        {
            format: (data) => {
                if ('releaseDate' in data && data.releaseDate) {
                    return data.releaseDate;
                }
                return '';
            },
            id: 'releaseDate',
        },
        {
            format: (data) => {
                if ('createdAt' in data && data.createdAt) {
                    return formatDateAbsolute(data.createdAt);
                }
                return '';
            },
            id: 'createdAt',
        },
        {
            format: (data) => {
                if ('lastPlayedAt' in data && data.lastPlayedAt) {
                    return formatDateRelative(data.lastPlayedAt);
                }
                return '';
            },
            id: 'lastPlayedAt',
        },
        {
            format: (data) => {
                if ('playCount' in data && data.playCount !== null) {
                    return String(data.playCount);
                }
                return '';
            },
            id: 'playCount',
        },
        {
            format: (data) => {
                if ('genres' in data && Array.isArray(data.genres)) {
                    return (data as Album | AlbumArtist | Song).genres
                        .map((genre) => genre.name)
                        .join(', ');
                }
                return '';
            },
            id: 'genres',
            isMuted: true,
        },
        {
            format: (data) => {
                if ('album' in data && data.album) {
                    const song = data as Song;
                    if ('albumId' in song && song.albumId) {
                        return (
                            <Link
                                to={generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, {
                                    albumId: song.albumId,
                                })}
                            >
                                {song.album}
                            </Link>
                        );
                    }
                    return song.album;
                }
                return '';
            },
            id: 'album',
            isMuted: true,
        },
        {
            format: (data) => {
                if ('songCount' in data && data.songCount !== null) {
                    return String(data.songCount);
                }
                return '';
            },
            id: 'songCount',
        },
        {
            format: (data) => {
                if ('albumCount' in data && data.albumCount !== null) {
                    return String(data.albumCount);
                }
                return '';
            },
            id: 'albumCount',
        },
        {
            format: (data) => {
                if (
                    'userRating' in data &&
                    (data as Album | AlbumArtist | Song).userRating !== null
                ) {
                    return formatRating(data as Album | AlbumArtist | Song);
                }
                return null;
            },
            id: 'rating',
        },
        {
            format: (data) => {
                if ('userFavorite' in data) {
                    return (data as Album | AlbumArtist | Song).userFavorite ? '★' : '';
                }
                return '';
            },
            id: 'userFavorite',
        },
    ];
};

export const getDataRowsCount = () => {
    return getDataRows().length;
};

const getImageUrl = (data: Album | AlbumArtist | Artist | Playlist | Song | undefined) => {
    if (data && 'imageUrl' in data) {
        return data.imageUrl || undefined;
    }

    return undefined;
};

const getItemNavigationPath = (
    data: Album | AlbumArtist | Artist | Playlist | Song | undefined,
    itemType: LibraryItem,
): null | string => {
    if (!data || !('id' in data) || !data.id) {
        return null;
    }

    // Check if data has _itemType (like in title row logic)
    const effectiveItemType = '_itemType' in data && data._itemType ? data._itemType : itemType;

    return getTitlePath(effectiveItemType, data.id);
};

const ItemCardRow = ({
    data,
    index,
    row,
    type,
}: {
    data: Album | AlbumArtist | Artist | Playlist | Song | undefined;
    index: number;
    row: DataRow;
    type?: 'compact' | 'default' | 'poster';
}) => {
    const alignmentClass =
        row.align === 'center'
            ? styles['align-center']
            : row.align === 'end'
              ? styles['align-end']
              : styles['align-start'];

    // All rows except the first one (index 0) should be muted
    const isMuted = index > 0 || row.isMuted;

    if (!data) {
        return (
            <div
                className={clsx(styles.row, alignmentClass, {
                    [styles.compact]: type === 'compact',
                    [styles.default]: type === 'default',
                    [styles.muted]: isMuted,
                    [styles.poster]: type === 'poster',
                })}
            >
                &nbsp;
            </div>
        );
    }

    return (
        <Text
            className={clsx(styles.row, alignmentClass, {
                [styles.compact]: type === 'compact',
                [styles.default]: type === 'default',
                [styles.muted]: isMuted,
                [styles.poster]: type === 'poster',
            })}
        >
            {row.format(data)}
        </Text>
    );
};

export const MemoizedItemCard = memo(ItemCard);
