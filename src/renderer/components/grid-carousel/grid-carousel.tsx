import throttle from 'lodash/throttle';
import {
    isValidElement,
    memo,
    ReactNode,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { SwiperOptions, Virtual } from 'swiper';
import 'swiper/css';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Swiper as SwiperCore } from 'swiper/types';

import { PosterCard } from '/@/renderer/components/card/poster-card';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { useCreateFavorite, useDeleteFavorite } from '/@/renderer/features/shared';
import { usePlayButtonBehavior } from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Stack } from '/@/shared/components/stack/stack';
import { TextTitle } from '/@/shared/components/text-title/text-title';
import {
    Album,
    AlbumArtist,
    Artist,
    LibraryItem,
    RelatedArtist,
} from '/@/shared/types/domain-types';
import { CardRoute, CardRow } from '/@/shared/types/types';

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

interface TitleProps {
    handleNext?: () => void;
    handlePrev?: () => void;
    label?: ReactNode | string;
    pagination: {
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

const Title = ({ handleNext, handlePrev, label, pagination }: TitleProps) => {
    return (
        <Group justify="space-between">
            {isValidElement(label) ? (
                label
            ) : (
                <TextTitle
                    order={3}
                    weight={700}
                >
                    {label}
                </TextTitle>
            )}

            <Group gap="sm">
                <Button
                    disabled={!pagination.hasPreviousPage}
                    onClick={handlePrev}
                    size="compact-md"
                    variant="subtle"
                >
                    <Icon icon="arrowLeftS" />
                </Button>
                <Button
                    disabled={!pagination.hasNextPage}
                    onClick={handleNext}
                    size="compact-md"
                    variant="subtle"
                >
                    <Icon icon="arrowRightS" />
                </Button>
            </Group>
        </Group>
    );
};

export interface SwiperGridCarouselProps {
    cardRows: CardRow<Album>[] | CardRow<AlbumArtist>[] | CardRow<Artist>[];
    data: Album[] | AlbumArtist[] | Artist[] | RelatedArtist[] | undefined;
    isLoading?: boolean;
    itemType: LibraryItem;
    route: CardRoute;
    swiperProps?: SwiperOptions;
    title?: {
        children?: ReactNode;
        hasPagination?: boolean;
        icon?: ReactNode;
        label: ReactNode | string;
    };
    uniqueId: string;
}

export const SwiperGridCarousel = ({
    cardRows,
    data,
    isLoading,
    itemType,
    route,
    swiperProps,
    title,
    uniqueId,
}: SwiperGridCarouselProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const swiperRef = useRef<any | SwiperCore>(null);
    const playButtonBehavior = usePlayButtonBehavior();
    const handlePlayQueueAdd = usePlayQueueAdd();
    const [slideCount, setSlideCount] = useState(4);

    useEffect(() => {
        swiperRef.current?.slideTo(0, 0);
    }, [data]);

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
            const { id, isFavorite, itemType, serverId } = options;
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
                key={`${uniqueId}-${el.id}`}
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
        const slidesPerView = Math.round(Number(swiperProps?.slidesPerView || slideCount));
        swiperRef?.current?.slideTo(activeIndex + slidesPerView);
    }, [slideCount, swiperProps?.slidesPerView]);

    const handlePrev = useCallback(() => {
        const activeIndex = swiperRef?.current?.activeIndex || 0;
        const slidesPerView = Math.round(Number(swiperProps?.slidesPerView || slideCount));
        swiperRef?.current?.slideTo(activeIndex - slidesPerView);
    }, [slideCount, swiperProps?.slidesPerView]);

    const handleOnSlideChange = useCallback((e: SwiperCore) => {
        const { isBeginning, isEnd, params, slides } = e;
        if (isEnd || isBeginning) return;

        const slideCount = (params.slidesPerView as number | undefined) || 4;
        setPagination({
            hasNextPage: slideCount < slides.length,
            hasPreviousPage: slideCount < slides.length,
        });
    }, []);

    const handleOnZoomChange = useCallback((e: SwiperCore) => {
        const { isBeginning, isEnd, params, slides } = e;
        if (isEnd || isBeginning) return;

        const slideCount = (params.slidesPerView as number | undefined) || 4;
        setPagination({
            hasNextPage: slideCount < slides.length,
            hasPreviousPage: slideCount < slides.length,
        });
    }, []);

    const handleOnReachEnd = useCallback((e: SwiperCore) => {
        const { params, slides } = e;

        const slideCount = (params.slidesPerView as number | undefined) || 4;
        setPagination({
            hasNextPage: false,
            hasPreviousPage: slideCount < slides.length,
        });
    }, []);

    const handleOnReachBeginning = useCallback((e: SwiperCore) => {
        const { params, slides } = e;

        const slideCount = (params.slidesPerView as number | undefined) || 4;
        setPagination({
            hasNextPage: slideCount < slides.length,
            hasPreviousPage: false,
        });
    }, []);

    useLayoutEffect(() => {
        const handleResize = () => {
            // Use the container div ref and not swiper width, as this value is more accurate
            const width = containerRef.current?.clientWidth;
            const { activeIndex, params, slides } =
                (swiperRef.current as SwiperCore | undefined) ?? {};

            if (width) {
                const slidesPerView = getSlidesPerView(width);
                setSlideCount(slidesPerView);
            }

            if (activeIndex !== undefined && slides && params?.slidesPerView) {
                const slideCount = (params.slidesPerView as number | undefined) || 4;
                setPagination({
                    hasNextPage: activeIndex + slideCount < slides.length,
                    hasPreviousPage: activeIndex > 0,
                });
            }
        };

        handleResize();

        const throttledResize = throttle(handleResize, 200);
        window.addEventListener('resize', throttledResize);

        return () => {
            window.removeEventListener('resize', throttledResize);
        };
    }, []);

    return (
        <Stack
            className="grid-carousel"
            gap="md"
            ref={containerRef as any}
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
                modules={[Virtual]}
                onBeforeInit={(swiper) => {
                    swiperRef.current = swiper;
                }}
                onReachBeginning={handleOnReachBeginning}
                onReachEnd={handleOnReachEnd}
                onSlideChange={handleOnSlideChange}
                onZoomChange={handleOnZoomChange}
                ref={swiperRef}
                resizeObserver
                slidesPerView={slideCount}
                spaceBetween={20}
                style={{ height: '100%', width: '100%' }}
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
        </Stack>
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
