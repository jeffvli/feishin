import type { MouseEvent } from 'react';

import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { generatePath, Link } from 'react-router';

import styles from './feature-carousel.module.css';

import { ItemImage, useItemImageUrl } from '/@/renderer/components/item-image/item-image';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { BackgroundOverlay } from '/@/renderer/features/shared/components/library-background-overlay';
import { PlayButtonGroup } from '/@/renderer/features/shared/components/play-button-group';
import { useContainerQuery, useFastAverageColor } from '/@/renderer/hooks';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer } from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Badge } from '/@/shared/components/badge/badge';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { Album, LibraryItem } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

const containerVariants = {
    animate: {},
    exit: {},
    initial: {},
};

const itemVariants = {
    animate: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.2,
            ease: 'easeOut' as const,
        },
        y: 0,
    },
    exit: {
        opacity: 0,
        transition: {
            duration: 0.3,
            ease: 'easeIn' as const,
        },
        y: 0,
    },
    initial: {
        opacity: 0,
        y: 0,
    },
};

interface FeatureCarouselProps {
    data: Album[] | undefined;
    onNearEnd?: () => void;
}

const getItemsPerRow = (breakpoints: {
    is2xl: boolean;
    is3xl: boolean;
    isLg: boolean;
    isMd: boolean;
    isSm: boolean;
    isXl: boolean;
}) => {
    if (breakpoints.is3xl) return 6;
    if (breakpoints.is2xl) return 5;
    if (breakpoints.isXl) return 5;
    if (breakpoints.isLg) return 4;
    if (breakpoints.isMd) return 3;
    if (breakpoints.isSm) return 2;
    return 2;
};

interface CarouselItemProps {
    album: Album;
}

const CarouselItem = ({ album }: CarouselItemProps) => {
    const imageUrl = useItemImageUrl({
        id: album.imageId || undefined,
        itemType: LibraryItem.ALBUM,
        type: 'itemCard',
    });

    const { background: backgroundColor } = useFastAverageColor({
        algorithm: 'dominant',
        src: imageUrl || null,
        srcLoaded: true,
    });

    const server = useCurrentServer();
    const { addToQueueByFetch } = usePlayer();

    const handlePlay = (type: Play) => {
        if (!server?.id) return;
        addToQueueByFetch(server.id, [album.id], LibraryItem.ALBUM, type);
    };

    return (
        <div className={styles.carouselItem}>
            <BackgroundOverlay backgroundColor={backgroundColor} opacity={0.7} />
            <Link
                className={styles.carouselLink}
                state={{ item: album }}
                to={generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, {
                    albumId: album.id,
                })}
            >
                <div className={styles.content}>
                    <div className={styles.titleSection}>
                        <Text className={styles.title} fw={700} lineClamp={2} size="lg" ta="center">
                            {album.name}
                        </Text>
                    </div>

                    <div className={styles.imageSection}>
                        <ItemImage
                            className={styles.albumImage}
                            containerClassName={styles.albumImageContainer}
                            id={album.id}
                            itemType={LibraryItem.ALBUM}
                            src={imageUrl}
                        />
                        <div className={styles.playButtonOverlay}>
                            <PlayButtonGroup onPlay={handlePlay} />
                        </div>
                    </div>

                    <div className={styles.metadataSection}>
                        <Stack gap="sm">
                            {album.albumArtists?.[0] && (
                                <Text className={styles.artist} fw={500} size="md">
                                    {album.albumArtists[0].name}
                                </Text>
                            )}
                            <Group gap="xs" justify="center" wrap="wrap">
                                {album.genres?.slice(0, 2).map((genre) => (
                                    <Badge
                                        classNames={{ label: styles.badge }}
                                        key={`genre-${genre.id}`}
                                        size="sm"
                                        variant="transparent"
                                    >
                                        {genre.name}
                                    </Badge>
                                ))}
                                {album.releaseYear && (
                                    <Badge
                                        classNames={{ label: styles.badge }}
                                        size="sm"
                                        variant="transparent"
                                    >
                                        {album.releaseYear}
                                    </Badge>
                                )}
                            </Group>
                        </Stack>
                    </div>
                </div>
            </Link>
        </div>
    );
};

export const FeatureCarousel = ({ data, onNearEnd }: FeatureCarouselProps) => {
    const [startIndex, setStartIndex] = useState(0);
    const directionRef = useRef<{ isNext: boolean }>({ isNext: true });
    const {
        is2xl,
        is3xl,
        isLg,
        isMd,
        isSm,
        isXl,
        ref: containerRef,
    } = useContainerQuery({
        '2xl': 1920,
        '3xl': 2560,
        lg: 1024,
        md: 768,
        sm: 640,
        xl: 1440,
    });

    const itemsPerRow = useMemo(
        () => getItemsPerRow({ is2xl, is3xl, isLg, isMd, isSm, isXl }),
        [is2xl, is3xl, isLg, isMd, isSm, isXl],
    );

    const visibleItems = useMemo(() => {
        if (!data) return [];
        const items: Album[] = [];
        for (let i = 0; i < itemsPerRow; i++) {
            const index = (startIndex + i) % data.length;
            items.push(data[index]);
        }
        return items;
    }, [data, startIndex, itemsPerRow]);

    // Check if we're near the end and trigger loading more
    useEffect(() => {
        if (!data || !onNearEnd) return;
        const remainingItems = data.length - startIndex;
        // Trigger when we have less than 2 rows worth of items remaining
        if (remainingItems < itemsPerRow * 2) {
            onNearEnd();
        }
    }, [data, startIndex, itemsPerRow, onNearEnd]);

    const handleNext = useCallback(
        (e?: MouseEvent<HTMLButtonElement>) => {
            e?.preventDefault();
            e?.stopPropagation();
            if (!data) return;
            directionRef.current = { isNext: true };
            setStartIndex((prev) => (prev + itemsPerRow) % data.length);
        },
        [data, itemsPerRow],
    );

    const handlePrevious = useCallback(
        (e?: MouseEvent<HTMLButtonElement>) => {
            e?.preventDefault();
            e?.stopPropagation();
            if (!data) return;
            directionRef.current = { isNext: false };
            setStartIndex((prev) => (prev - itemsPerRow + data.length) % data.length);
        },
        [data, itemsPerRow],
    );

    const canNavigate = data && data.length > itemsPerRow;

    const wheelCooldownRef = useRef(0);
    const wheelThreshold = 10;
    const wheelCooldownMs = 250;

    const handleWheel = useCallback(
        (event: React.WheelEvent<HTMLDivElement>) => {
            if (!canNavigate || !data) {
                return;
            }

            if (!event.shiftKey) {
                return;
            }

            const now = Date.now();
            const elapsed = now - wheelCooldownRef.current;

            const horizontalDelta = Math.abs(event.deltaY);

            if (horizontalDelta < wheelThreshold || elapsed < wheelCooldownMs) {
                return;
            }

            if (event.deltaY > 0) {
                wheelCooldownRef.current = now;
                handleNext();
            } else if (event.deltaY < 0) {
                wheelCooldownRef.current = now;
                handlePrevious();
            }
        },
        [canNavigate, data, handleNext, handlePrevious, wheelCooldownMs, wheelThreshold],
    );

    if (!data || data.length === 0) {
        return null;
    }

    return (
        <div className={styles.carouselContainer} onWheel={handleWheel} ref={containerRef}>
            <AnimatePresence initial={false} mode="popLayout">
                <motion.div
                    animate="animate"
                    className={styles.carousel}
                    exit="exit"
                    initial="initial"
                    key={`carousel-${startIndex}`}
                    style={{ '--items-per-row': itemsPerRow } as React.CSSProperties}
                    variants={containerVariants}
                >
                    {visibleItems.map((album, index) => (
                        <motion.div
                            key={`item-${album.id}-${startIndex}-${index}`}
                            variants={itemVariants}
                        >
                            <CarouselItem album={album} />
                        </motion.div>
                    ))}
                </motion.div>
            </AnimatePresence>

            {data.length > itemsPerRow && (
                <>
                    <ActionIcon
                        className={styles.navArrowLeft}
                        icon="arrowLeftS"
                        iconProps={{ size: 'xl' }}
                        onClick={handlePrevious}
                        radius="50%"
                        size="md"
                        styles={{
                            icon: {
                                color: 'white',
                                fill: 'white',
                            },
                        }}
                        variant="subtle"
                    />
                    <ActionIcon
                        className={styles.navArrowRight}
                        icon="arrowRightS"
                        iconProps={{ size: 'xl' }}
                        onClick={handleNext}
                        radius="50%"
                        size="md"
                        styles={{
                            icon: {
                                color: 'white',
                                fill: 'white',
                            },
                        }}
                        variant="subtle"
                    />
                </>
            )}
        </div>
    );
};
