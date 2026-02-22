import clsx from 'clsx';
import { motion } from 'motion/react';
import { memo, MouseEvent, useMemo } from 'react';

import styles from './item-card-controls.module.css';

import { ItemListStateActions } from '/@/renderer/components/item-list/helpers/item-list-state';
import { ItemControls } from '/@/renderer/components/item-list/types';
import { PlayButton } from '/@/renderer/features/shared/components/play-button';
import { PlayTooltip } from '/@/renderer/features/shared/components/play-button-group';
import { useIsMutatingCreateFavorite } from '/@/renderer/features/shared/mutations/create-favorite-mutation';
import { useIsMutatingDeleteFavorite } from '/@/renderer/features/shared/mutations/delete-favorite-mutation';
import { useIsMutatingRating } from '/@/renderer/features/shared/mutations/set-rating-mutation';
import { animationVariants } from '/@/shared/components/animations/animation-variants';
import { AppIcon, Icon, IconProps } from '/@/shared/components/icon/icon';
import { Rating } from '/@/shared/components/rating/rating';
import { Tooltip } from '/@/shared/components/tooltip/tooltip';
import {
    Album,
    AlbumArtist,
    Artist,
    Genre,
    LibraryItem,
    Playlist,
    ServerType,
    Song,
} from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

interface ItemCardControlsProps {
    controls?: ItemControls;
    enableExpansion?: boolean;
    internalState?: ItemListStateActions;
    item: Album | AlbumArtist | Artist | Genre | Playlist | Song | undefined;
    itemType: LibraryItem;
    showRating: boolean;
    type?: 'compact' | 'default' | 'poster';
}

const containerProps = {
    compact: {
        animate: 'show',
        exit: 'hidden',
        initial: 'hidden',
        variants: animationVariants.combine(animationVariants.zoomIn, animationVariants.fadeIn),
    },
    default: {
        animate: 'show',
        exit: 'hidden',
        initial: 'hidden',
        variants: animationVariants.combine(animationVariants.zoomIn, animationVariants.fadeIn),
    },
    poster: {
        animate: 'show',
        exit: 'hidden',
        initial: 'hidden',
        variants: animationVariants.combine(animationVariants.slideInUp, animationVariants.fadeIn),
    },
};

const createPlayHandler =
    (
        controls: ItemControls | undefined,
        item: Album | AlbumArtist | Artist | Genre | Playlist | Song | undefined,
        internalState: ItemListStateActions | undefined,
        itemType: LibraryItem,
        playType: Play,
    ) =>
    (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        e.preventDefault();

        if (!item) {
            return;
        }

        const isSongItem =
            itemType === LibraryItem.SONG ||
            itemType === LibraryItem.PLAYLIST_SONG ||
            (item as { _itemType: LibraryItem })._itemType === LibraryItem.SONG;

        if (isSongItem && controls?.onDoubleClick && internalState) {
            const rowId = internalState.extractRowId(item);

            if (rowId) {
                const index = internalState.findItemIndex(rowId);
                return controls.onDoubleClick({
                    event: null,
                    index,
                    internalState,
                    item,
                    itemType,
                    meta: {
                        playType,
                    },
                });
            }
        }

        controls?.onPlay?.({
            event: e,
            internalState,
            item,
            itemType,
            playType,
        });
    };

const createFavoriteHandler =
    (
        controls: ItemControls | undefined,
        item: Album | AlbumArtist | Artist | Genre | Playlist | Song | undefined,
        internalState: ItemListStateActions | undefined,
        itemType: LibraryItem,
    ) =>
    (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        e.preventDefault();

        if (!item) {
            return;
        }

        const newFavorite = !(item as { userFavorite: boolean }).userFavorite;
        controls?.onFavorite?.({
            event: e,
            favorite: newFavorite,
            internalState,
            item,
            itemType,
        });
    };

const createRatingChangeHandler =
    (
        controls: ItemControls | undefined,
        item: Album | AlbumArtist | Artist | Genre | Playlist | Song | undefined,
        internalState: ItemListStateActions | undefined,
        itemType: LibraryItem,
    ) =>
    (rating: number) => {
        if (!item) {
            return;
        }

        let newRating = rating;

        if (rating === (item as { userRating: number }).userRating) {
            newRating = 0;
        }

        controls?.onRating?.({
            event: null,
            internalState,
            item,
            itemType,
            rating: newRating,
        });
    };

const moreDoubleClickHandler = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
};

const createMoreHandler =
    (
        controls: ItemControls | undefined,
        item: Album | AlbumArtist | Artist | Genre | Playlist | Song | undefined,
        internalState: ItemListStateActions | undefined,
        itemType: LibraryItem,
    ) =>
    (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        e.preventDefault();
        controls?.onMore?.({
            event: e,
            internalState,
            item,
            itemType,
        });
    };

const createExpandHandler =
    (
        controls: ItemControls | undefined,
        item: Album | AlbumArtist | Artist | Genre | Playlist | Song | undefined,
        internalState: ItemListStateActions | undefined,
        itemType: LibraryItem,
    ) =>
    (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        e.preventDefault();
        controls?.onExpand?.({
            event: e,
            internalState,
            item,
            itemType,
        });
    };

export const ItemCardControls = ({
    controls,
    enableExpansion,
    internalState,
    item,
    itemType,
    showRating,
    type = 'default',
}: ItemCardControlsProps) => {
    const playNowHandler = useMemo(
        () => createPlayHandler(controls, item, internalState, itemType, Play.NOW),
        [controls, item, internalState, itemType],
    );

    const playNextHandler = useMemo(
        () => createPlayHandler(controls, item, internalState, itemType, Play.NEXT),
        [controls, item, internalState, itemType],
    );

    const playLastHandler = useMemo(
        () => createPlayHandler(controls, item, internalState, itemType, Play.LAST),
        [controls, item, internalState, itemType],
    );

    const playShuffleHandler = useMemo(
        () => createPlayHandler(controls, item, internalState, itemType, Play.SHUFFLE),
        [controls, item, internalState, itemType],
    );

    const playNextShuffleHandler = useMemo(
        () => createPlayHandler(controls, item, internalState, itemType, Play.NEXT_SHUFFLE),
        [controls, item, internalState, itemType],
    );

    const playLastShuffleHandler = useMemo(
        () => createPlayHandler(controls, item, internalState, itemType, Play.LAST_SHUFFLE),
        [controls, item, internalState, itemType],
    );

    const favoriteHandler = useMemo(
        () => createFavoriteHandler(controls, item, internalState, itemType),
        [controls, item, internalState, itemType],
    );

    const ratingChangeHandler = useMemo(
        () => createRatingChangeHandler(controls, item, internalState, itemType),
        [controls, item, internalState, itemType],
    );

    const moreHandler = useMemo(
        () => createMoreHandler(controls, item, internalState, itemType),
        [controls, item, internalState, itemType],
    );

    const expandHandler = useMemo(
        () => createExpandHandler(controls, item, internalState, itemType),
        [controls, item, internalState, itemType],
    );

    const isFavorite = (item as { userFavorite?: boolean })?.userFavorite ?? false;

    return (
        <motion.div className={clsx(styles.container)} {...containerProps[type]}>
            {controls?.onPlay && (
                <Tooltip.Group>
                    <PlayTooltip type={Play.NOW}>
                        <PlayButton
                            classNames={clsx(styles.playButton, styles.primary)}
                            onClick={playNowHandler}
                            onLongPress={playShuffleHandler}
                        />
                    </PlayTooltip>
                    <PlayTooltip type={Play.NEXT}>
                        <PlayButton
                            classNames={clsx(styles.playButton, styles.secondary, styles.left)}
                            icon="mediaPlayNext"
                            onClick={playNextHandler}
                            onLongPress={playNextShuffleHandler}
                        />
                    </PlayTooltip>
                    <PlayTooltip type={Play.LAST}>
                        <PlayButton
                            classNames={clsx(styles.playButton, styles.secondary, styles.right)}
                            icon="mediaPlayLast"
                            onClick={playLastHandler}
                            onLongPress={playLastShuffleHandler}
                        />
                    </PlayTooltip>
                </Tooltip.Group>
            )}
            {controls?.onFavorite && (
                <FavoriteButton isFavorite={isFavorite} onClick={favoriteHandler} />
            )}
            {controls?.onRating &&
                showRating &&
                (item?._serverType === ServerType.NAVIDROME ||
                    item?._serverType === ServerType.SUBSONIC) && (
                    <RatingButton
                        onChange={ratingChangeHandler}
                        rating={(item as { userRating: number }).userRating}
                    />
                )}
            {controls?.onMore && (
                <SecondaryButton
                    className={styles.options}
                    icon="ellipsisHorizontal"
                    onClick={moreHandler}
                    onDoubleClick={moreDoubleClickHandler}
                />
            )}
            {controls?.onExpand && enableExpansion && (
                <SecondaryButton
                    className={styles.expand}
                    icon="arrowDownS"
                    onClick={expandHandler}
                />
            )}
        </motion.div>
    );
};

const FavoriteButton = memo(
    ({
        isFavorite,
        onClick,
    }: {
        isFavorite: boolean;
        onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
    }) => {
        const isMutatingCreate = useIsMutatingCreateFavorite();
        const isMutatingDelete = useIsMutatingDeleteFavorite();
        const isMutating = isMutatingCreate || isMutatingDelete;

        const favoriteIconProps = useMemo<Partial<IconProps>>(
            () => ({
                color: isFavorite ? ('primary' as const) : ('default' as const),
                fill: isFavorite ? ('primary' as const) : undefined,
            }),
            [isFavorite],
        );

        return (
            <SecondaryButton
                className={styles.favorite}
                disabled={isMutating}
                icon="favorite"
                iconProps={favoriteIconProps}
                onClick={onClick}
            />
        );
    },
    (prev, next) => prev.isFavorite === next.isFavorite,
);

const RatingButton = memo(
    ({ onChange, rating }: { onChange: (rating: number) => void; rating: number }) => {
        const ratingClickHandler = (e: MouseEvent<HTMLElement>) => {
            e.stopPropagation();
            e.preventDefault();
        };

        const ratingMouseDownHandler = (e: React.MouseEvent<HTMLElement>) => {
            e.stopPropagation();
            e.preventDefault();
        };

        const isMutatingRating = useIsMutatingRating();
        return (
            <Rating
                className={styles.rating}
                onChange={onChange}
                onClick={ratingClickHandler}
                onMouseDown={ratingMouseDownHandler}
                readOnly={isMutatingRating}
                size="sm"
                value={rating}
            />
        );
    },
    (prev, next) => prev.rating === next.rating,
);

interface SecondaryButtonProps {
    className?: string;
    disabled?: boolean;
    icon: keyof typeof AppIcon;
    onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
}

const SecondaryButton = memo(
    ({
        className,
        disabled,
        icon,
        iconProps,
        onClick,
        onDoubleClick,
    }: SecondaryButtonProps & {
        iconProps?: Partial<IconProps>;
        onDoubleClick?: (e: MouseEvent<HTMLButtonElement>) => void;
    }) => {
        const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            e.preventDefault();
            onClick?.(e);
        };

        const handleDoubleClick = (e: MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            e.preventDefault();
            onDoubleClick?.(e);
        };

        const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            e.preventDefault();
        };

        return (
            <button
                className={clsx(styles.secondaryButton, className)}
                disabled={disabled}
                onClick={handleClick}
                onDoubleClick={handleDoubleClick}
                onMouseDown={handleMouseDown}
            >
                <Icon icon={icon} size="lg" {...iconProps} />
            </button>
        );
    },
);
