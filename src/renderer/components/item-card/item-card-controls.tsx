import clsx from 'clsx';
import { motion } from 'motion/react';

import styles from './item-card-controls.module.css';

import { animationVariants } from '/@/shared/components/animations/animation-variants';
import { AppIcon, Icon } from '/@/shared/components/icon/icon';

interface ItemCardControlsProps {
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

export const ItemCardControls = ({ type = 'default' }: ItemCardControlsProps) => {
    return (
        <motion.div className={clsx(styles.container)} {...containerProps[type]}>
            <PlayButton />
            <SecondaryPlayButton className={styles.left} icon="mediaPlayNext" />
            <SecondaryPlayButton className={styles.right} icon="mediaPlayLast" />
            <SecondaryButton className={styles.favorite} icon="favorite" />
            <SecondaryButton className={styles.options} icon="ellipsisHorizontal" />
        </motion.div>
    );
};

const PlayButton = () => {
    return (
        <button
            className={clsx(styles.playButton, styles.primary)}
            onClick={(e) => e.stopPropagation()}
        >
            <Icon icon="mediaPlay" size="lg" />
        </button>
    );
};

const SecondaryPlayButton = ({
    className,
    icon,
}: {
    className?: string;
    icon: keyof typeof AppIcon;
}) => {
    return (
        <button className={clsx(styles.playButton, styles.secondary, className)}>
            <Icon icon={icon} size="lg" />
        </button>
    );
};

interface SecondaryButtonProps {
    className?: string;
    icon: keyof typeof AppIcon;
}

const SecondaryButton = ({ className, icon }: SecondaryButtonProps) => {
    return (
        <button className={clsx(styles.secondaryButton, className)}>
            <Icon icon={icon} size="lg" />
        </button>
    );
};
