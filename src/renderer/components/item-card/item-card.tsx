import clsx from 'clsx';
import { AnimatePresence } from 'motion/react';
import { Fragment, memo, ReactNode, useCallback, useMemo, useState } from 'react';
import { generatePath, Link } from 'react-router';

import styles from './item-card.module.css';

import i18n from '/@/i18n/i18n';
import { ItemCardControls } from '/@/renderer/components/item-card/item-card-controls';
import { ItemImage } from '/@/renderer/components/item-image/item-image';
import { getDraggedItems } from '/@/renderer/components/item-list/helpers/get-dragged-items';
import { getTitlePath } from '/@/renderer/components/item-list/helpers/get-title-path';
import {
    ItemListStateActions,
    useItemDraggingState,
    useItemSelectionState,
} from '/@/renderer/components/item-list/helpers/item-list-state';
import { ItemControls } from '/@/renderer/components/item-list/types';
import { JoinedArtists } from '/@/renderer/features/albums/components/joined-artists';
import { useDragDrop } from '/@/renderer/hooks/use-drag-drop';
import { AppRoute } from '/@/renderer/router/routes';
import { useShowRatings } from '/@/renderer/store';
import {
    formatDateAbsolute,
    formatDateAbsoluteUTC,
    formatDateRelative,
    formatDurationString,
    formatRating,
} from '/@/renderer/utils/format';
import { SEPARATOR_STRING } from '/@/shared/api/utils';
import { ExplicitIndicator } from '/@/shared/components/explicit-indicator/explicit-indicator';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Separator } from '/@/shared/components/separator/separator';
import { Skeleton } from '/@/shared/components/skeleton/skeleton';
import { Text } from '/@/shared/components/text/text';
import { useDoubleClick } from '/@/shared/hooks/use-double-click';
import {
    Album,
    AlbumArtist,
    Artist,
    Genre,
    LibraryItem,
    Playlist,
    Song,
} from '/@/shared/types/domain-types';
import { DragOperation, DragTarget } from '/@/shared/types/drag-and-drop';
import { stringToColor } from '/@/shared/utils/string-to-color';

export type DataRow = {
    align?: 'center' | 'end' | 'start';
    format: (
        data: Album | AlbumArtist | Artist | Genre | Playlist | Song,
    ) => null | ReactNode | string;
    id: string;
    isMuted?: boolean;
};

export interface ItemCardProps {
    controls?: ItemControls;
    data: Album | AlbumArtist | Artist | Genre | Playlist | Song | undefined;
    enableDrag?: boolean;
    enableExpansion?: boolean;
    enableMultiSelect?: boolean;
    enableNavigation?: boolean;
    imageAsLink?: boolean;
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
    enableExpansion,
    enableMultiSelect,
    enableNavigation = true,
    imageAsLink,
    internalState,
    isRound,
    itemType,
    rows: providedRows,
    type = 'poster',
    withControls,
}: ItemCardProps) => {
    const showRatings = useShowRatings();
    const imageUrl = getImageUrl(data);
    const rows = providedRows || [];

    switch (type) {
        case 'compact':
            return (
                <MemoizedCompactItemCard
                    controls={controls}
                    data={data}
                    enableDrag={enableDrag}
                    enableExpansion={enableExpansion}
                    enableMultiSelect={enableMultiSelect}
                    enableNavigation={enableNavigation}
                    imageAsLink={imageAsLink}
                    imageUrl={imageUrl}
                    internalState={internalState}
                    isRound={isRound}
                    itemType={itemType}
                    rows={rows}
                    showRating={showRatings}
                    withControls={withControls}
                />
            );
        case 'poster':
            return (
                <MemoizedPosterItemCard
                    controls={controls}
                    data={data}
                    enableDrag={enableDrag}
                    enableExpansion={enableExpansion}
                    enableMultiSelect={enableMultiSelect}
                    enableNavigation={enableNavigation}
                    imageAsLink={imageAsLink}
                    imageUrl={imageUrl}
                    internalState={internalState}
                    isRound={isRound}
                    itemType={itemType}
                    rows={rows}
                    showRating={showRatings}
                    withControls={withControls}
                />
            );
        case 'default':
        default:
            return (
                <MemoizedDefaultItemCard
                    controls={controls}
                    data={data}
                    enableDrag={enableDrag}
                    enableExpansion={enableExpansion}
                    enableNavigation={enableNavigation}
                    imageAsLink={imageAsLink}
                    imageUrl={imageUrl}
                    internalState={internalState}
                    isRound={isRound}
                    itemType={itemType}
                    rows={rows}
                    showRating={showRatings}
                    withControls={withControls}
                />
            );
    }
};

export interface ItemCardDerivativeProps extends Omit<ItemCardProps, 'type'> {
    controls?: ItemControls;
    enableExpansion?: boolean;
    enableNavigation?: boolean;
    imageAsLink?: boolean;
    imageUrl: string | undefined;
    internalState?: ItemListStateActions;
    rows: DataRow[];
    showRating: boolean;
}

const CompactItemCard = ({
    controls,
    data,
    enableDrag,
    enableExpansion,
    enableMultiSelect,
    enableNavigation,
    imageAsLink,
    internalState,
    isRound,
    itemType,
    rows,
    showRating,
    withControls,
}: ItemCardDerivativeProps) => {
    const [showControls, setShowControls] = useState(false);
    const itemRowId =
        data && internalState && typeof data === 'object' && 'id' in data
            ? internalState.extractRowId(data)
            : undefined;
    const isSelected = useItemSelectionState(internalState, itemRowId || undefined);

    const getId = useCallback(() => {
        if (!data) {
            return [];
        }

        const draggedItems = getDraggedItems(data, internalState, enableMultiSelect !== false);
        return draggedItems.map((item) => item.id);
    }, [data, internalState, enableMultiSelect]);

    const getItem = useCallback(() => {
        if (!data) {
            return [];
        }

        const draggedItems = getDraggedItems(data, internalState, enableMultiSelect !== false);
        return draggedItems;
    }, [data, internalState, enableMultiSelect]);

    const onDragStart = useCallback(() => {
        if (!data) {
            return;
        }

        const draggedItems = getDraggedItems(data, internalState, enableMultiSelect !== false);
        if (internalState) {
            internalState.setDragging(draggedItems);
        }
    }, [data, internalState, enableMultiSelect]);

    const onDrop = useCallback(() => {
        if (internalState) {
            internalState.setDragging([]);
        }
    }, [internalState]);

    const dragOperation = useMemo(
        () =>
            itemType === LibraryItem.QUEUE_SONG
                ? [DragOperation.REORDER, DragOperation.ADD]
                : [DragOperation.ADD],
        [itemType],
    );

    const drag = useMemo(
        () => ({
            getId,
            getItem,
            itemType,
            onDragStart,
            onDrop,
            operation: dragOperation,
            target: DragTarget.ALBUM,
        }),
        [getId, getItem, itemType, onDragStart, onDrop, dragOperation],
    );

    const { isDragging: isDraggingLocal, ref } = useDragDrop<HTMLDivElement>({
        drag,
        isEnabled: !!enableDrag && !!data,
    });

    const itemId = data && internalState ? data.id : undefined;
    const isDraggingState = useItemDraggingState(internalState, itemId);
    const isDragging = isDraggingState || isDraggingLocal;

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

        const handleLinkDragStart = (e: React.DragEvent<HTMLAnchorElement>) => {
            // Prevent default browser link drag behavior to allow custom drag and drop
            e.preventDefault();
            e.stopPropagation();
        };

        const isFavorite =
            'userFavorite' in data && (data as { userFavorite: boolean }).userFavorite;
        const userRating =
            'userRating' in data &&
            typeof (data as { userRating: null | number }).userRating === 'number'
                ? (data as { userRating: null | number }).userRating
                : null;
        const hasRating = showRating && userRating !== null && userRating > 0;

        const imageContainerClassName = clsx(styles.imageContainer, {
            [styles.isRound]: isRound,
        });

        const imageContainerContent = (
            <>
                {itemType === LibraryItem.GENRE &&
                data &&
                'name' in data &&
                typeof (data as Genre).name === 'string' ? (
                    <GenreImagePlaceholder
                        className={clsx(styles.image, styles.genrePlaceholder, {
                            [styles.isRound]: isRound,
                        })}
                        name={(data as Genre).name}
                    />
                ) : (
                    <ItemImage
                        className={clsx(styles.image, {
                            [styles.isRound]: isRound,
                        })}
                        enableDebounce={false}
                        explicitStatus={
                            'explicitStatus' in data && data ? data.explicitStatus : null
                        }
                        id={data?.imageId}
                        itemType={itemType}
                        src={(data as Album | AlbumArtist | Playlist | Song)?.imageUrl}
                        type="itemCard"
                    />
                )}
                {isFavorite && <div className={styles.favoriteBadge} />}
                {hasRating && <div className={styles.ratingBadge}>{userRating}</div>}
                <AnimatePresence>
                    {withControls && showControls && data && (
                        <ItemCardControls
                            controls={controls}
                            enableExpansion={enableExpansion}
                            internalState={internalState}
                            item={data}
                            itemType={itemType}
                            showRating={showRating}
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
                    [styles.dragging]: isDragging,
                    [styles.selected]: isSelected,
                })}
                ref={ref}
            >
                {enableNavigation && navigationPath && (imageAsLink ?? !internalState) ? (
                    <Link
                        className={imageContainerClassName}
                        draggable={false}
                        onClick={handleImageClick}
                        onContextMenu={handleContextMenu}
                        onDragStart={handleLinkDragStart}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        state={{ item: data }}
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
                            <Text
                                className={clsx(styles.row, {
                                    [styles.muted]: index > 0,
                                })}
                                key={row.id}
                                size={index > 0 ? 'sm' : 'md'}
                            >
                                &nbsp;
                            </Text>
                        ))}
                </div>
            </div>
        </div>
    );
};

const DefaultItemCard = ({
    controls,
    data,
    enableExpansion,
    enableNavigation,
    imageAsLink,
    internalState,
    isRound,
    itemType,
    rows,
    showRating,
    withControls,
}: ItemCardDerivativeProps) => {
    const [showControls, setShowControls] = useState(false);
    const itemRowId =
        data && internalState && typeof data === 'object' && 'id' in data
            ? internalState.extractRowId(data)
            : undefined;
    const isSelected = useItemSelectionState(internalState, itemRowId || undefined);

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

        const handleLinkDragStart = (e: React.DragEvent<HTMLAnchorElement>) => {
            // Prevent default browser link drag behavior to allow custom drag and drop
            e.preventDefault();
            e.stopPropagation();
        };

        const imageContainerClassName = clsx(styles.imageContainer, {
            [styles.isRound]: isRound,
        });

        const isFavorite =
            'userFavorite' in data && (data as { userFavorite: boolean }).userFavorite;
        const userRating =
            'userRating' in data &&
            typeof (data as { userRating: null | number }).userRating === 'number'
                ? (data as { userRating: null | number }).userRating
                : null;
        const hasRating = showRating && userRating !== null && userRating > 0;

        const imageContainerContent = (
            <>
                {itemType === LibraryItem.GENRE &&
                data &&
                'name' in data &&
                typeof (data as Genre).name === 'string' ? (
                    <GenreImagePlaceholder
                        className={clsx(styles.image, styles.genrePlaceholder, {
                            [styles.isRound]: isRound,
                        })}
                        name={(data as Genre).name}
                    />
                ) : (
                    <ItemImage
                        className={clsx(styles.image, { [styles.isRound]: isRound })}
                        enableDebounce={false}
                        explicitStatus={
                            'explicitStatus' in data && data ? data.explicitStatus : null
                        }
                        id={data?.imageId}
                        itemType={itemType}
                        src={(data as Album | AlbumArtist | Playlist | Song)?.imageUrl}
                        type="itemCard"
                    />
                )}
                {isFavorite && <div className={styles.favoriteBadge} />}
                {hasRating && <div className={styles.ratingBadge}>{userRating}</div>}
                <AnimatePresence>
                    {withControls && showControls && (
                        <ItemCardControls
                            controls={controls}
                            enableExpansion={enableExpansion}
                            item={data}
                            itemType={itemType}
                            showRating={showRating}
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
                {enableNavigation && navigationPath && (imageAsLink ?? !internalState) ? (
                    <Link
                        className={imageContainerClassName}
                        draggable={false}
                        onClick={handleImageClick}
                        onContextMenu={handleContextMenu}
                        onDragStart={handleLinkDragStart}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        state={{ item: data }}
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
                        <Text
                            className={clsx(styles.row, {
                                [styles.muted]: index > 0,
                            })}
                            key={row.id}
                            size={index > 0 ? 'sm' : 'md'}
                        >
                            &nbsp;
                        </Text>
                    ))}
            </div>
        </div>
    );
};

const PosterItemCard = ({
    controls,
    data,
    enableDrag,
    enableExpansion,
    enableMultiSelect,
    enableNavigation,
    imageAsLink,
    internalState,
    isRound,
    itemType,
    rows,
    showRating,
    withControls,
}: ItemCardDerivativeProps) => {
    const [showControls, setShowControls] = useState(false);
    const itemRowId =
        data && internalState && typeof data === 'object' && 'id' in data
            ? internalState.extractRowId(data)
            : undefined;
    const isSelected = useItemSelectionState(internalState, itemRowId || undefined);

    const getId = useCallback(() => {
        if (!data) {
            return [];
        }

        const draggedItems = getDraggedItems(data, internalState, enableMultiSelect !== false);
        return draggedItems.map((item) => item.id);
    }, [data, internalState, enableMultiSelect]);

    const getItem = useCallback(() => {
        if (!data) {
            return [];
        }

        const draggedItems = getDraggedItems(data, internalState, enableMultiSelect !== false);
        return draggedItems;
    }, [data, internalState, enableMultiSelect]);

    const onDragStart = useCallback(() => {
        if (!data) {
            return;
        }

        const draggedItems = getDraggedItems(data, internalState, enableMultiSelect !== false);
        if (internalState) {
            internalState.setDragging(draggedItems);
        }
    }, [data, internalState, enableMultiSelect]);

    const onDrop = useCallback(() => {
        if (internalState) {
            internalState.setDragging([]);
        }
    }, [internalState]);

    const dragOperation = useMemo(
        () =>
            itemType === LibraryItem.QUEUE_SONG
                ? [DragOperation.REORDER, DragOperation.ADD]
                : [DragOperation.ADD],
        [itemType],
    );

    const drag = useMemo(
        () => ({
            getId,
            getItem,
            itemType,
            onDragStart,
            onDrop,
            operation: dragOperation,
            target: DragTarget.ALBUM,
        }),
        [getId, getItem, itemType, onDragStart, onDrop, dragOperation],
    );

    const { isDragging: isDraggingLocal, ref } = useDragDrop<HTMLDivElement>({
        drag,
        isEnabled: !!enableDrag && !!data,
    });

    const itemId = data && internalState ? data.id : undefined;
    const isDraggingState = useItemDraggingState(internalState, itemId);
    const isDragging = isDraggingState || isDraggingLocal;

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

        const handleLinkDragStart = (e: React.DragEvent<HTMLAnchorElement>) => {
            // Prevent default browser link drag behavior to allow custom drag and drop
            e.preventDefault();
            e.stopPropagation();
        };

        const imageContainerClassName = clsx(styles.imageContainer, {
            [styles.isRound]: isRound,
        });

        const isFavorite =
            'userFavorite' in data && (data as { userFavorite: boolean }).userFavorite;
        const userRating =
            'userRating' in data &&
            typeof (data as { userRating: null | number }).userRating === 'number'
                ? (data as { userRating: null | number }).userRating
                : null;
        const hasRating = showRating && userRating !== null && userRating > 0;

        const imageContainerContent = (
            <>
                {itemType === LibraryItem.GENRE &&
                data &&
                'name' in data &&
                typeof (data as Genre).name === 'string' ? (
                    <GenreImagePlaceholder
                        className={clsx(styles.image, styles.genrePlaceholder, {
                            [styles.isRound]: isRound,
                        })}
                        name={(data as Genre).name}
                    />
                ) : (
                    <ItemImage
                        className={clsx(styles.image, { [styles.isRound]: isRound })}
                        enableDebounce={false}
                        explicitStatus={
                            'explicitStatus' in data && data ? data.explicitStatus : null
                        }
                        id={(data as { imageId: string })?.imageId}
                        itemType={itemType}
                        src={(data as { imageUrl: string })?.imageUrl}
                        type="itemCard"
                    />
                )}
                {isFavorite && <div className={styles.favoriteBadge} />}
                {hasRating && <div className={styles.ratingBadge}>{userRating}</div>}
                <AnimatePresence>
                    {withControls && showControls && data && (
                        <ItemCardControls
                            controls={controls}
                            enableExpansion={enableExpansion}
                            internalState={internalState}
                            item={data}
                            itemType={itemType}
                            showRating={showRating}
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
                {enableNavigation && navigationPath && (imageAsLink ?? !internalState) ? (
                    <Link
                        className={imageContainerClassName}
                        draggable={false}
                        onClick={handleImageClick}
                        onContextMenu={handleContextMenu}
                        onDragStart={handleLinkDragStart}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        state={{ item: data }}
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
                        <Text
                            className={clsx(styles.row, {
                                [styles.muted]: index > 0,
                            })}
                            key={row.id}
                            size={index > 0 ? 'sm' : 'md'}
                        >
                            &nbsp;
                        </Text>
                    ))}
            </div>
        </div>
    );
};

const MemoizedPosterItemCard = memo(PosterItemCard);
MemoizedPosterItemCard.displayName = 'MemoizedPosterItemCard';

const MemoizedCompactItemCard = memo(CompactItemCard);
MemoizedCompactItemCard.displayName = 'MemoizedCompactItemCard';

const MemoizedDefaultItemCard = memo(DefaultItemCard);
MemoizedDefaultItemCard.displayName = 'MemoizedDefaultItemCard';

export const getDataRows = (type?: 'compact' | 'default' | 'poster'): DataRow[] => {
    return [
        {
            format: (data) => {
                const explicitStatus = 'explicitStatus' in data ? data.explicitStatus : null;
                if ('name' in data && data.name) {
                    if ('id' in data && data.id) {
                        if ('_itemType' in data) {
                            switch (data._itemType) {
                                case LibraryItem.ALBUM:
                                    return (
                                        <Link
                                            state={{ item: data }}
                                            to={generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, {
                                                albumId: data.id,
                                            })}
                                        >
                                            <ExplicitIndicator explicitStatus={explicitStatus} />
                                            {data.name}
                                        </Link>
                                    );
                                case LibraryItem.ALBUM_ARTIST:
                                    return (
                                        <Link
                                            state={{ item: data }}
                                            to={generatePath(
                                                AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL,
                                                {
                                                    albumArtistId: data.id,
                                                },
                                            )}
                                        >
                                            <ExplicitIndicator explicitStatus={explicitStatus} />
                                            {data.name}
                                        </Link>
                                    );
                                case LibraryItem.GENRE:
                                    return (
                                        <Link
                                            state={{ item: data }}
                                            to={generatePath(AppRoute.LIBRARY_GENRES_DETAIL, {
                                                genreId: data.id,
                                            })}
                                        >
                                            {data.name}
                                        </Link>
                                    );
                                case LibraryItem.PLAYLIST:
                                    return (
                                        <Link
                                            state={{ item: data }}
                                            to={generatePath(AppRoute.PLAYLISTS_DETAIL_SONGS, {
                                                playlistId: data.id,
                                            })}
                                        >
                                            {data.name}
                                        </Link>
                                    );
                                default:
                                    return (
                                        <>
                                            <ExplicitIndicator explicitStatus={explicitStatus} />
                                            {data.name}
                                        </>
                                    );
                            }
                        }
                    }
                    return (
                        <>
                            <ExplicitIndicator explicitStatus={explicitStatus} />
                            {data.name}
                        </>
                    );
                }
                return '';
            },
            id: 'name',
        },
        {
            format: (data) => {
                if ('albumArtists' in data && Array.isArray(data.albumArtists)) {
                    return (
                        <JoinedArtists
                            artistName={data.albumArtistName}
                            artists={data.albumArtists}
                            linkProps={{ fw: 400, isMuted: true }}
                            rootTextProps={{
                                fw: 400,
                                isMuted: type === 'compact' ? false : true,
                                size: 'sm',
                            }}
                        />
                    );
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
                                state={{ item: artist }}
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
                    return formatDurationString(data.duration);
                }
                return '';
            },
            id: 'duration',
        },
        {
            format: (data) => {
                if ('releaseYear' in data && data.releaseYear !== null) {
                    const releaseYear = data.releaseYear;
                    const originalYear =
                        'originalYear' in data && data.originalYear !== null
                            ? data.originalYear
                            : null;

                    if (originalYear !== null && originalYear !== releaseYear) {
                        return `${originalYear}${SEPARATOR_STRING}${releaseYear}`;
                    }

                    return String(releaseYear);
                }
                return '';
            },
            id: 'releaseYear',
        },
        {
            format: (data) => {
                if ('releaseDate' in data && data.releaseDate) {
                    if (
                        'originalDate' in data &&
                        data.originalDate &&
                        data.originalDate !== data.releaseDate
                    ) {
                        return `${formatDateAbsoluteUTC(data.originalDate)}${SEPARATOR_STRING}${formatDateAbsoluteUTC(data.releaseDate)}`;
                    }

                    return `${formatDateAbsoluteUTC(data.releaseDate)}`;
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
                    return (
                        <Group align="center" gap="xs">
                            <Icon icon="lastPlayed" size="sm" />
                            {formatDateRelative(data.lastPlayedAt)}
                        </Group>
                    );
                }
                return '';
            },
            id: 'lastPlayedAt',
        },
        {
            format: (data) => {
                if ('playCount' in data && data.playCount !== null) {
                    return i18n.t('entity.play', { count: data.playCount });
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
                        const albumData = {
                            id: song.albumId,
                            imageUrl: song.imageUrl,
                            name: song.album,
                        };
                        return (
                            <Link
                                state={{ item: albumData }}
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
                    return i18n.t('entity.trackWithCount', { count: data.songCount });
                }
                return '';
            },
            id: 'songCount',
        },
        {
            format: (data) => {
                if ('albumCount' in data && data.albumCount !== null) {
                    return i18n.t('entity.albumWithCount', { count: data.albumCount });
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

const getImageUrl = (data: Album | AlbumArtist | Artist | Genre | Playlist | Song | undefined) => {
    if (data && 'imageUrl' in data) {
        return data.imageUrl || undefined;
    }

    return undefined;
};

const GenreImagePlaceholder = ({ className, name }: { className?: string; name: string }) => {
    const { color, isLight } = useMemo(() => stringToColor(name), [name]);
    return (
        <div
            className={className}
            style={{
                backgroundColor: color,
                color: isLight ? '#000' : '#fff',
            }}
        >
            <span className={styles.genrePlaceholderText}>{name}</span>
        </div>
    );
};

const getItemNavigationPath = (
    data: Album | AlbumArtist | Artist | Genre | Playlist | Song | undefined,
    itemType: LibraryItem,
): null | string => {
    if (!data || !('id' in data) || !data.id) {
        return null;
    }

    const effectiveItemType = '_itemType' in data && data._itemType ? data._itemType : itemType;

    return getTitlePath(effectiveItemType, data.id);
};

const ItemCardRow = memo(
    ({
        data,
        index,
        row,
        type,
    }: {
        data: Album | AlbumArtist | Artist | Genre | Playlist | Song | undefined;
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

        const formattedContent = useMemo(() => {
            if (!data) {
                return null;
            }
            return row.format(data);
        }, [data, row]);

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
                    [styles.bold]: index === 0,
                    [styles.compact]: type === 'compact',
                    [styles.default]: type === 'default',
                    [styles.muted]: isMuted,
                    [styles.poster]: type === 'poster',
                })}
                size={index > 0 ? 'sm' : 'md'}
            >
                {formattedContent}
            </Text>
        );
    },
);

ItemCardRow.displayName = 'ItemCardRow';

export const MemoizedItemCard = memo(ItemCard);
