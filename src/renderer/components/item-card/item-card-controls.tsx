import clsx from 'clsx';
import { motion } from 'motion/react';
import { MouseEvent } from 'react';

import styles from './item-card-controls.module.css';

import { ItemListStateActions } from '/@/renderer/components/item-list/helpers/item-list-state';
import { ItemControls } from '/@/renderer/components/item-list/types';
import { useIsPlayerFetching } from '/@/renderer/features/player/context/player-context';
import { animationVariants } from '/@/shared/components/animations/animation-variants';
import { AppIcon, Icon } from '/@/shared/components/icon/icon';
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

export const ItemCardControls = ({
    controls,
    internalState,
    item,
    itemType,
    type = 'default',
}: ItemCardControlsProps) => {
    const isPlayerFetching = useIsPlayerFetching();

    return (
        <motion.div className={clsx(styles.container)} {...containerProps[type]}>
            {controls?.onPlay && (
                <>
                    <PlayButton
                        disabled={isPlayerFetching}
                        onClick={(e) => {
                            e.stopPropagation();

                            if (!item) {
                                return;
                            }

                            controls?.onPlay?.({
                                event: e,
                                internalState,
                                item,
                                itemType,
                                playType: Play.NOW,
                            });
                        }}
                    />
                    <SecondaryPlayButton
                        className={styles.left}
                        icon="mediaPlayNext"
                        onClick={(e) => {
                            e.stopPropagation();

                            if (!item) {
                                return;
                            }

                            controls?.onPlay?.({
                                event: e,
                                internalState,
                                item,
                                itemType,
                                playType: Play.NEXT,
                            });
                        }}
                    />
                    <SecondaryPlayButton
                        className={styles.right}
                        icon="mediaPlayLast"
                        onClick={(e) => {
                            e.stopPropagation();

                            if (!item) {
                                return;
                            }

                            controls?.onPlay?.({
                                event: e,
                                internalState,
                                item,
                                itemType,
                                playType: Play.LAST,
                            });
                        }}
                    />
                </>
            )}
            {controls?.onFavorite && (
                <SecondaryButton
                    className={styles.favorite}
                    icon="favorite"
                    onClick={(e) => {
                        e.stopPropagation();

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
                    }}
                />
            )}
            {controls?.onRating && (
                <Rating
                    className={styles.rating}
                    onChange={(rating) => {
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
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                    size="xs"
                />
            )}
            {controls?.onMore && (
                <SecondaryButton
                    className={styles.options}
                    icon="ellipsisHorizontal"
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        controls?.onMore?.({
                            event: e,
                            internalState,
                            item,
                            itemType,
                        });
                    }}
                    onDoubleClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                    }}
                />
            )}
            {controls?.onExpand && (
                <SecondaryButton
                    className={styles.expand}
                    icon="arrowDownS"
                    onClick={(e) => {
                        e.stopPropagation();
                        controls?.onExpand?.({
                            event: e,
                            internalState,
                            item,
                            itemType,
                        });
                    }}
                />
            )}
        </motion.div>
    );
};

const PlayButton = ({
    disabled,
    loading,
    onClick,
}: {
    disabled?: boolean;
    loading?: boolean;
    onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
}) => {
    return (
        <button
            className={clsx(styles.playButton, styles.primary, {
                [styles.disabled]: disabled,
            })}
            disabled={disabled}
            onClick={(e) => {
                e.stopPropagation();
                if (disabled || loading) {
                    return;
                }
                onClick?.(e);
            }}
        >
            <Icon icon="mediaPlay" size="lg" />
        </button>
    );
};

const SecondaryPlayButton = ({
    className,
    icon,
    onClick,
}: {
    className?: string;
    icon: keyof typeof AppIcon;
    onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
}) => {
    return (
        <button
            className={clsx(styles.playButton, styles.secondary, className)}
            onClick={(e) => {
                e.stopPropagation();
                onClick?.(e);
            }}
        >
            <Icon icon={icon} size="lg" />
        </button>
    );
};

interface SecondaryButtonProps {
    className?: string;
    icon: keyof typeof AppIcon;
    onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
}

const SecondaryButton = ({
    className,
    icon,
    onClick,
    onDoubleClick,
}: SecondaryButtonProps & { onDoubleClick?: (e: MouseEvent<HTMLButtonElement>) => void }) => {
    return (
        <button
            className={clsx(styles.secondaryButton, className)}
            onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onClick?.(e);
            }}
            onDoubleClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onDoubleClick?.(e);
            }}
        >
            <Icon icon={icon} size="lg" />
        </button>
    );
};
