import clsx from 'clsx';
import { motion } from 'motion/react';
import { MouseEvent } from 'react';

import styles from './item-card-controls.module.css';

import { ItemControls } from '/@/renderer/components/item-list/types';
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
    controls: ItemControls;
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
    item,
    itemType,
    type = 'default',
}: ItemCardControlsProps) => {
    return (
        <motion.div className={clsx(styles.container)} {...containerProps[type]}>
            <PlayButton
                onClick={(e) => {
                    e.stopPropagation();
                    controls.onPlay?.(item, itemType, Play.NOW, e);
                }}
            />
            <SecondaryPlayButton
                className={styles.left}
                icon="mediaPlayNext"
                onClick={(e) => {
                    e.stopPropagation();
                    controls.onPlay?.(item, itemType, Play.NEXT, e);
                }}
            />
            <SecondaryPlayButton
                className={styles.right}
                icon="mediaPlayLast"
                onClick={(e) => {
                    e.stopPropagation();
                    controls.onPlay?.(item, itemType, Play.LAST, e);
                }}
            />
            <SecondaryButton
                className={styles.favorite}
                icon="favorite"
                onClick={(e) => {
                    e.stopPropagation();
                    controls.onFavorite?.(item, itemType, e);
                }}
            />
            <Rating className={styles.rating} size="xs" />
            <SecondaryButton
                className={styles.options}
                icon="ellipsisHorizontal"
                onClick={(e) => {
                    e.stopPropagation();
                    controls.onMore?.(item, itemType, e);
                }}
            />
            {controls.onItemExpand && (
                <SecondaryButton
                    className={styles.expand}
                    icon="arrowDownS"
                    onClick={(e) => {
                        e.stopPropagation();
                        controls.onItemExpand?.(item, itemType, e);
                    }}
                />
            )}
        </motion.div>
    );
};

const PlayButton = ({ onClick }: { onClick?: (e: MouseEvent<HTMLButtonElement>) => void }) => {
    return (
        <button
            className={clsx(styles.playButton, styles.primary)}
            onClick={(e) => {
                e.stopPropagation();
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

const SecondaryButton = ({ className, icon, onClick }: SecondaryButtonProps) => {
    return (
        <button
            className={clsx(styles.secondaryButton, className)}
            onClick={(e) => {
                e.stopPropagation();
                onClick?.(e);
            }}
        >
            <Icon icon={icon} size="lg" />
        </button>
    );
};
