import clsx from 'clsx';

import styles from './discover-skeleton.module.css';

import { Group } from '/@/shared/components/group/group';
import { Skeleton } from '/@/shared/components/skeleton/skeleton';
import { Stack } from '/@/shared/components/stack/stack';
import { useMediaQuery } from '/@/shared/hooks/use-media-query';

interface DiscoverSkeletonProps {
    /** How many placeholder rows to draw. */
    rowCount?: number;
}

/**
 * Runs past the right edge of a maximised window, where the real carousel tops out at eight
 * cards. The strip clips rather than counting, so the surplus costs nothing but a few divs.
 */
const CARDS_PER_ROW = 10;

/**
 * Card-shaped placeholders for the Discover page.
 *
 * ListenBrainz can take twenty seconds and the library scan runs once per session, which is
 * long enough that a spinner reads as a hang. Showing the page's shape instead says the wait
 * is loading rather than nothing.
 */
export function DiscoverSkeleton(props: DiscoverSkeletonProps) {
    const { rowCount = 3 } = props;

    // The Skeleton primitive shimmers unconditionally and nothing upstream of it opts out.
    const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
    const enableAnimation = !prefersReducedMotion;

    return (
        <Stack gap="2xl">
            {Array.from({ length: rowCount }, (_, rowIndex) => (
                <Stack gap="md" key={rowIndex}>
                    <Group gap="xs" justify="space-between" w="100%">
                        <Skeleton className={styles.heading} enableAnimation={enableAnimation} />
                        <Group gap="xs" justify="end">
                            <Skeleton
                                className={styles.navButton}
                                enableAnimation={enableAnimation}
                            />
                            <Skeleton
                                className={styles.navButton}
                                enableAnimation={enableAnimation}
                            />
                        </Group>
                    </Group>
                    <div className={styles.cardStrip}>
                        {Array.from({ length: CARDS_PER_ROW }, (_, cardIndex) => (
                            <div className={styles.card} key={cardIndex}>
                                <div className={styles.cardImage}>
                                    <Skeleton
                                        borderRadius="var(--theme-radius-md)"
                                        enableAnimation={enableAnimation}
                                    />
                                </div>
                                <div className={styles.cardDetail}>
                                    <Skeleton
                                        className={clsx(styles.cardLine, styles.title)}
                                        enableAnimation={enableAnimation}
                                    />
                                    <Skeleton
                                        className={clsx(styles.cardLine, styles.artist)}
                                        enableAnimation={enableAnimation}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </Stack>
            ))}
        </Stack>
    );
}
