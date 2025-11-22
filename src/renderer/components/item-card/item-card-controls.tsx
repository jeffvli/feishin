import clsx from 'clsx';
import { motion } from 'motion/react';
import { memo, MouseEvent, useMemo } from 'react';

import styles from './item-card-controls.module.css';

import { ItemListStateActions } from '/@/renderer/components/item-list/helpers/item-list-state';
import { ItemControls } from '/@/renderer/components/item-list/types';
import { useIsPlayerFetching } from '/@/renderer/features/player/context/player-context';
import { animationVariants } from '/@/shared/components/animations/animation-variants';
import { AppIcon, Icon, IconProps } from '/@/shared/components/icon/icon';
import { Rating } from '/@/shared/components/rating/rating';
import {
    Album,
    AlbumArtist,
    Artist,
    LibraryItem,
    Playlist,
    Song,
} from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

interface ItemCardControlsProps {
    controls?: ItemControls;
    enableExpansion?: boolean;
    internalState?: ItemListStateActions;
    item: Album | AlbumArtist | Artist | Playlist | Song | undefined;
    itemType: LibraryItem;
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
        item: Album | AlbumArtist | Artist | Playlist | Song | undefined,
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
        item: Album | AlbumArtist | Artist | Playlist | Song | undefined,
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
        item: Album | AlbumArtist | Artist | Playlist | Song | undefined,
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

const ratingClickHandler = (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    e.preventDefault();
};

const ratingMouseDownHandler = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    e.preventDefault();
};

const moreDoubleClickHandler = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
};

const createMoreHandler =
    (
        controls: ItemControls | undefined,
        item: Album | AlbumArtist | Artist | Playlist | Song | undefined,
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
        item: Album | AlbumArtist | Artist | Playlist | Song | undefined,
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
    type = 'default',
}: ItemCardControlsProps) => {
    const isPlayerFetching = useIsPlayerFetching();

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

    const favoriteIconProps = useMemo<Partial<IconProps>>(
        () => ({
            color: isFavorite ? ('primary' as const) : ('default' as const),
            fill: isFavorite ? ('primary' as const) : undefined,
        }),
        [isFavorite],
    );

    return (
        <motion.div className={clsx(styles.container)} {...containerProps[type]}>
            {controls?.onPlay && (
                <>
                    <PlayButton disabled={isPlayerFetching} onClick={playNowHandler} />
                    <SecondaryPlayButton
                        className={styles.left}
                        icon="mediaPlayNext"
                        onClick={playNextHandler}
                    />
                    <SecondaryPlayButton
                        className={styles.right}
                        icon="mediaPlayLast"
                        onClick={playLastHandler}
                    />
                </>
            )}
            {controls?.onFavorite && (
                <SecondaryButton
                    className={styles.favorite}
                    icon="favorite"
                    iconProps={favoriteIconProps}
                    onClick={favoriteHandler}
                />
            )}
            {controls?.onRating && (
                <Rating
                    className={styles.rating}
                    onChange={ratingChangeHandler}
                    onClick={ratingClickHandler}
                    onMouseDown={ratingMouseDownHandler}
                    size="xs"
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

const PlayButton = memo(
    ({
        disabled,
        loading,
        onClick,
    }: {
        disabled?: boolean;
        loading?: boolean;
        onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
    }) => {
        const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            e.preventDefault();
            if (disabled || loading) {
                return;
            }
            onClick?.(e);
        };

        const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            e.preventDefault();
        };

        return (
            <button
                className={clsx(styles.playButton, styles.primary, {
                    [styles.disabled]: disabled,
                })}
                disabled={disabled}
                onClick={handleClick}
                onMouseDown={handleMouseDown}
            >
                <Icon icon="mediaPlay" size="lg" />
            </button>
        );
    },
);

const SecondaryPlayButton = memo(
    ({
        className,
        icon,
        onClick,
    }: {
        className?: string;
        icon: keyof typeof AppIcon;
        onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
    }) => {
        const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            e.preventDefault();
            onClick?.(e);
        };

        const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            e.preventDefault();
        };

        return (
            <button
                className={clsx(styles.playButton, styles.secondary, className)}
                onClick={handleClick}
                onMouseDown={handleMouseDown}
            >
                <Icon icon={icon} size="lg" />
            </button>
        );
    },
);

interface SecondaryButtonProps {
    className?: string;
    icon: keyof typeof AppIcon;
    onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
}

const SecondaryButton = memo(
    ({
        className,
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
                onClick={handleClick}
                onDoubleClick={handleDoubleClick}
                onMouseDown={handleMouseDown}
            >
                <Icon icon={icon} size="lg" {...iconProps} />
            </button>
        );
    },
);
