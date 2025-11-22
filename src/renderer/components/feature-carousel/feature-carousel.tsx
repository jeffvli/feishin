import type { MouseEvent } from 'react';

import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { generatePath, Link } from 'react-router';

import styles from './feature-carousel.module.css';

import { ItemCard } from '/@/renderer/components/item-card/item-card';
import { useDefaultItemListControls } from '/@/renderer/components/item-list/helpers/item-list-controls';
import { BackgroundOverlay } from '/@/renderer/features/shared/components/library-background-overlay';
import { useContainerQuery, useFastAverageColor } from '/@/renderer/hooks';
import { AppRoute } from '/@/renderer/router/routes';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Badge } from '/@/shared/components/badge/badge';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { TextTitle } from '/@/shared/components/text-title/text-title';
import { Text } from '/@/shared/components/text/text';
import { Album, LibraryItem } from '/@/shared/types/domain-types';

const fadeVariants = {
    center: {
        opacity: 1,
        transition: {
            duration: 0.4,
            ease: 'easeInOut' as const,
        },
    },
    enter: {
        opacity: 0,
    },
    exit: {
        opacity: 0,
        transition: {
            duration: 0.4,
            ease: 'easeInOut' as const,
        },
    },
};

interface FeatureCarouselProps {
    data: Album[] | undefined;
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
    const { background: backgroundColor } = useFastAverageColor({
        algorithm: 'dominant',
        src: album.imageUrl || null,
        srcLoaded: true,
    });

    const controls = useDefaultItemListControls();

    return (
        <div className={styles.carouselItem}>
            <BackgroundOverlay backgroundColor={backgroundColor} opacity={1} />
            <Link
                className={styles.carouselLink}
                state={{ item: album }}
                to={generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, {
                    albumId: album.id,
                })}
            >
                <div className={styles.content}>
                    <div className={styles.titleSection}>
                        <TextTitle className={styles.title} fw={700} lineClamp={2} order={3}>
                            {album.name}
                        </TextTitle>
                    </div>

                    <div
                        className={styles.imageSection}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                    >
                        <ItemCard
                            controls={controls}
                            data={album}
                            itemType={LibraryItem.ALBUM}
                            rows={[]}
                            type="poster"
                            withControls
                        />
                    </div>

                    <div className={styles.metadataSection}>
                        <Stack gap="sm">
                            {album.albumArtists.slice(0, 1).map((artist) => (
                                <Link
                                    className={styles.artistLink}
                                    key={`artist-${artist.id}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                    }}
                                    state={{ item: artist }}
                                    to={generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL, {
                                        albumArtistId: artist.id,
                                    })}
                                >
                                    <Text className={styles.artist} fw={600} size="md">
                                        {artist.name}
                                    </Text>
                                </Link>
                            ))}
                            <Group gap="sm" justify="center" wrap="wrap">
                                {album.genres?.slice(0, 2).map((genre) => (
                                    <Badge key={`genre-${genre.id}`} size="sm">
                                        {genre.name}
                                    </Badge>
                                ))}
                                {album.releaseYear && <Badge size="sm">{album.releaseYear}</Badge>}
                            </Group>
                        </Stack>
                    </div>
                </div>
            </Link>
        </div>
    );
};

export const FeatureCarousel = ({ data }: FeatureCarouselProps) => {
    const [startIndex, setStartIndex] = useState(0);
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

    const handleNext = (e?: MouseEvent<HTMLButtonElement>) => {
        e?.preventDefault();
        e?.stopPropagation();
        if (!data) return;
        setStartIndex((prev) => (prev + itemsPerRow) % data.length);
    };

    const handlePrevious = (e?: MouseEvent<HTMLButtonElement>) => {
        e?.preventDefault();
        e?.stopPropagation();
        if (!data) return;
        setStartIndex((prev) => (prev - itemsPerRow + data.length) % data.length);
    };

    if (!data || data.length === 0) {
        return null;
    }

    return (
        <div className={styles.carouselContainer} ref={containerRef}>
            <AnimatePresence initial={false} mode="popLayout">
                <motion.div
                    animate="center"
                    className={styles.carousel}
                    exit="exit"
                    initial="enter"
                    key={`carousel-${startIndex}`}
                    style={{ '--items-per-row': itemsPerRow } as React.CSSProperties}
                    variants={fadeVariants}
                >
                    {visibleItems.map((album) => (
                        <CarouselItem album={album} key={`item-${album.id}-${startIndex}`} />
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
                        variant="subtle"
                    />
                    <ActionIcon
                        className={styles.navArrowRight}
                        icon="arrowRightS"
                        iconProps={{ size: 'xl' }}
                        onClick={handleNext}
                        radius="50%"
                        size="md"
                        variant="subtle"
                    />
                </>
            )}
        </div>
    );
};
