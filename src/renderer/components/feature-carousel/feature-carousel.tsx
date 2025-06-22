import type { Variants } from 'motion/react';
import type { MouseEvent } from 'react';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, Link } from 'react-router-dom';

import styles from './feature-carousel.module.css';

import { usePlayQueueAdd } from '/@/renderer/features/player/hooks/use-playqueue-add';
import { PlayButton } from '/@/renderer/features/shared';
import { AppRoute } from '/@/renderer/router/routes';
import { usePlayButtonBehavior } from '/@/renderer/store';
import { Badge } from '/@/shared/components/badge/badge';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Image } from '/@/shared/components/image/image';
import { Stack } from '/@/shared/components/stack/stack';
import { TextTitle } from '/@/shared/components/text-title/text-title';
import { Text } from '/@/shared/components/text/text';
import { Album, LibraryItem } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

const variants: Variants = {
    animate: {
        opacity: 1,
        transition: { opacity: { duration: 0.5 } },
    },
    exit: {
        opacity: 0,
        transition: { opacity: { duration: 0.5 } },
    },
    initial: {
        opacity: 0,
    },
};

interface FeatureCarouselProps {
    data: Album[] | undefined;
}

export const FeatureCarousel = ({ data }: FeatureCarouselProps) => {
    const { t } = useTranslation();
    const handlePlayQueueAdd = usePlayQueueAdd();
    const [itemIndex, setItemIndex] = useState(0);
    const [direction, setDirection] = useState(0);
    const playType = usePlayButtonBehavior();

    const currentItem = data?.[itemIndex];

    const handleNext = (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setDirection(1);
        if (itemIndex === (data?.length || 0) - 1 || 0) {
            setItemIndex(0);
            return;
        }

        setItemIndex((prev) => prev + 1);
    };

    const handlePrevious = (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setDirection(-1);
        if (itemIndex === 0) {
            setItemIndex((data?.length || 0) - 1);
            return;
        }

        setItemIndex((prev) => prev - 1);
    };

    return (
        <Link
            className={styles.wrapper}
            to={generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, { albumId: currentItem?.id || '' })}
        >
            <AnimatePresence
                custom={direction}
                initial={false}
                mode="popLayout"
            >
                {data && (
                    <motion.div
                        animate="animate"
                        className={styles.carousel}
                        custom={direction}
                        exit="exit"
                        initial="initial"
                        key={`image-${itemIndex}`}
                        variants={variants}
                    >
                        <div className={styles.grid}>
                            <div className={styles.imageColumn}>
                                <Image
                                    height={225}
                                    src={data[itemIndex]?.imageUrl || ''}
                                    width={225}
                                />
                            </div>
                            <div className={styles.infoColumn}>
                                <Stack
                                    gap="md"
                                    style={{ width: '100%' }}
                                >
                                    <div className={styles.titleWrapper}>
                                        <TextTitle
                                            fw={900}
                                            lineClamp={2}
                                            order={1}
                                            overflow="hidden"
                                        >
                                            {currentItem?.name}
                                        </TextTitle>
                                    </div>
                                    <div className={styles.titleWrapper}>
                                        {currentItem?.albumArtists.slice(0, 1).map((artist) => (
                                            <Text
                                                fw={600}
                                                key={`carousel-artist-${artist.id}`}
                                            >
                                                {artist.name}
                                            </Text>
                                        ))}
                                    </div>
                                    <Group>
                                        {currentItem?.genres?.slice(0, 1).map((genre) => (
                                            <Badge
                                                key={`carousel-genre-${genre.id}`}
                                                variant="default"
                                            >
                                                {genre.name}
                                            </Badge>
                                        ))}
                                        <Badge variant="default">{currentItem?.releaseYear}</Badge>
                                    </Group>
                                    <Group justify="space-between">
                                        <PlayButton
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (!currentItem) return;

                                                handlePlayQueueAdd?.({
                                                    byItemType: {
                                                        id: [currentItem.id],
                                                        type: LibraryItem.ALBUM,
                                                    },
                                                    playType,
                                                });
                                            }}
                                            variant="outline"
                                        >
                                            {t(
                                                playType === Play.NOW
                                                    ? 'player.play'
                                                    : playType === Play.NEXT
                                                      ? 'player.addNext'
                                                      : 'player.addLast',
                                                { postProcess: 'titleCase' },
                                            )}
                                        </PlayButton>
                                        <Group gap="sm">
                                            <Button
                                                onClick={handlePrevious}
                                                radius="lg"
                                                variant="subtle"
                                            >
                                                <Icon icon="arrowLeftS" />
                                            </Button>
                                            <Button
                                                onClick={handleNext}
                                                radius="lg"
                                                variant="subtle"
                                            >
                                                <Icon icon="arrowRightS" />
                                            </Button>
                                        </Group>
                                    </Group>
                                </Stack>
                            </div>
                        </div>
                        <Image
                            className={styles.backgroundImage}
                            draggable="false"
                            src={currentItem?.imageUrl || ''}
                        />
                        <div className={styles.backgroundImageOverlay} />
                    </motion.div>
                )}
            </AnimatePresence>
        </Link>
    );
};
