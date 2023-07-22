import { isValidElement, memo, ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import { Group, Stack } from '@mantine/core';
import throttle from 'lodash/throttle';
import { RiArrowLeftSLine, RiArrowRightSLine } from 'react-icons/ri';
import styled from 'styled-components';
import { SwiperOptions, Virtual } from 'swiper';
import 'swiper/css';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Swiper as SwiperCore } from 'swiper/types';
import { Album, AlbumArtist, Artist, LibraryItem, RelatedArtist } from '/@/renderer/api/types';
import { Button } from '/@/renderer/components/button';
import { PosterCard } from '/@/renderer/components/card/poster-card';
import { TextTitle } from '/@/renderer/components/text-title';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { useCreateFavorite, useDeleteFavorite } from '/@/renderer/features/shared';
import { usePlayButtonBehavior } from '/@/renderer/store';
import { CardRoute, CardRow } from '/@/renderer/types';

const getSlidesPerView = (windowWidth: number) => {
    if (windowWidth < 400) return 2;
    if (windowWidth < 700) return 3;
    if (windowWidth < 900) return 4;
    if (windowWidth < 1100) return 5;
    if (windowWidth < 1300) return 6;
    if (windowWidth < 1500) return 7;
    if (windowWidth < 1920) return 8;
    return 10;
};

const CarouselContainer = styled(Stack)`
    container-type: inline-size;
`;

interface TitleProps {
    handleNext?: () => void;
    handlePrev?: () => void;
    label?: string | ReactNode;
    pagination: {
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

const Title = ({ label, handleNext, handlePrev, pagination }: TitleProps) => {
    return (
        <Group position="apart">
            {isValidElement(label) ? (
                label
            ) : (
                <TextTitle
                    order={2}
                    weight={700}
                >
                    {label}
                </TextTitle>
            )}

            <Group spacing="sm">
                <Button
                    compact
                    disabled={!pagination.hasPreviousPage}
                    size="lg"
                    variant="default"
                    onClick={handlePrev}
                >
                    <RiArrowLeftSLine />
                </Button>
                <Button
                    compact
                    disabled={!pagination.hasNextPage}
                    size="lg"
                    variant="default"
                    onClick={handleNext}
                >
                    <RiArrowRightSLine />
                </Button>
            </Group>
        </Group>
    );
};

export interface SwiperGridCarouselProps {
    cardRows: CardRow<Album>[] | CardRow<Artist>[] | CardRow<AlbumArtist>[];
    data: Album[] | AlbumArtist[] | Artist[] | RelatedArtist[] | undefined;
    isLoading?: boolean;
    itemType: LibraryItem;
    route: CardRoute;
    swiperProps?: SwiperOptions;
    title?: {
        children?: ReactNode;
        hasPagination?: boolean;
        icon?: ReactNode;
        label: string | ReactNode;
    };
    uniqueId: string;
}

export const SwiperGridCarousel = ({
    cardRows,
    data,
    itemType,
    route,
    swiperProps,
    title,
    isLoading,
    uniqueId,
}: SwiperGridCarouselProps) => {
    const swiperRef = useRef<SwiperCore | any>(null);
    const playButtonBehavior = usePlayButtonBehavior();
    const handlePlayQueueAdd = usePlayQueueAdd();

    const [pagination, setPagination] = useState({
        hasNextPage: (data?.length || 0) > Math.round(3),
        hasPreviousPage: false,
    });

    const createFavoriteMutation = useCreateFavorite({});
    const deleteFavoriteMutation = useDeleteFavorite({});

    const handleFavorite = useCallback(
        (options: {
            id: string[];
            isFavorite: boolean;
            itemType: LibraryItem;
            serverId: string;
        }) => {
            const { id, itemType, isFavorite, serverId } = options;
            if (isFavorite) {
                deleteFavoriteMutation.mutate({
                    query: {
                        id,
                        type: itemType,
                    },
                    serverId,
                });
            } else {
                createFavoriteMutation.mutate({
                    query: {
                        id,
                        type: itemType,
                    },
                    serverId,
                });
            }
        },
        [createFavoriteMutation, deleteFavoriteMutation],
    );

    const slides = useMemo(() => {
        if (!data) return [];

        return data.map((el) => (
            <PosterCard
                controls={{
                    cardRows,
                    handleFavorite,
                    handlePlayQueueAdd,
                    itemType,
                    playButtonBehavior,
                    route,
                }}
                data={el}
                isLoading={isLoading}
                uniqueId={uniqueId}
            />
        ));
    }, [
        cardRows,
        data,
        handleFavorite,
        handlePlayQueueAdd,
        isLoading,
        itemType,
        playButtonBehavior,
        route,
        uniqueId,
    ]);

    const handleNext = useCallback(() => {
        const activeIndex = swiperRef?.current?.activeIndex || 0;
        const slidesPerView = Math.round(Number(swiperProps?.slidesPerView || 4));
        swiperRef?.current?.slideTo(activeIndex + slidesPerView);
    }, [swiperProps?.slidesPerView]);

    const handlePrev = useCallback(() => {
        const activeIndex = swiperRef?.current?.activeIndex || 0;
        const slidesPerView = Math.round(Number(swiperProps?.slidesPerView || 4));
        swiperRef?.current?.slideTo(activeIndex - slidesPerView);
    }, [swiperProps?.slidesPerView]);

    const handleOnSlideChange = useCallback((e: SwiperCore) => {
        const { slides, isEnd, isBeginning, params } = e;
        if (isEnd || isBeginning) return;

        setPagination({
            hasNextPage: (params?.slidesPerView || 4) < slides.length,
            hasPreviousPage: (params?.slidesPerView || 4) < slides.length,
        });
    }, []);

    const handleOnZoomChange = useCallback((e: SwiperCore) => {
        const { slides, isEnd, isBeginning, params } = e;
        if (isEnd || isBeginning) return;

        setPagination({
            hasNextPage: (params.slidesPerView || 4) < slides.length,
            hasPreviousPage: (params.slidesPerView || 4) < slides.length,
        });
    }, []);

    const handleOnReachEnd = useCallback((e: SwiperCore) => {
        const { slides, params } = e;

        setPagination({
            hasNextPage: false,
            hasPreviousPage: (params.slidesPerView || 4) < slides.length,
        });
    }, []);

    const handleOnReachBeginning = useCallback((e: SwiperCore) => {
        const { slides, params } = e;

        setPagination({
            hasNextPage: (params.slidesPerView || 4) < slides.length,
            hasPreviousPage: false,
        });
    }, []);

    const handleOnResize = useCallback((e: SwiperCore) => {
        if (!e) return;
        const { width } = e;
        const slidesPerView = getSlidesPerView(width);
        if (!e.params) return;
        e.params.slidesPerView = slidesPerView;
    }, []);

    const throttledOnResize = throttle(handleOnResize, 200);

    return (
        <CarouselContainer
            className="grid-carousel"
            spacing="md"
        >
            {title ? (
                <Title
                    {...title}
                    handleNext={handleNext}
                    handlePrev={handlePrev}
                    pagination={pagination}
                />
            ) : null}
            <Swiper
                ref={swiperRef}
                resizeObserver
                modules={[Virtual]}
                slidesPerView={4}
                spaceBetween={20}
                style={{ height: '100%', width: '100%' }}
                onBeforeInit={(swiper) => {
                    swiperRef.current = swiper;
                }}
                onBeforeResize={handleOnResize}
                onReachBeginning={handleOnReachBeginning}
                onReachEnd={handleOnReachEnd}
                onResize={throttledOnResize}
                onSlideChange={handleOnSlideChange}
                onZoomChange={handleOnZoomChange}
                {...swiperProps}
            >
                {slides.map((slideContent, index) => {
                    return (
                        <SwiperSlide
                            key={`${uniqueId}-${slideContent?.props?.data?.id}-${index}`}
                            virtualIndex={index}
                        >
                            {slideContent}
                        </SwiperSlide>
                    );
                })}
            </Swiper>
        </CarouselContainer>
    );
};

export const MemoizedSwiperGridCarousel = memo(
    function Carousel(props: SwiperGridCarouselProps) {
        return <SwiperGridCarousel {...props} />;
    },
    (oldProps, newProps) => {
        const uniqueIdIsEqual = oldProps.uniqueId === newProps.uniqueId;
        const dataIsEqual = oldProps.data === newProps.data;
        return uniqueIdIsEqual && dataIsEqual;
    },
);
