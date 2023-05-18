import { useCallback, ReactNode, useRef, useState, isValidElement } from 'react';
import { Box, Group } from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import { AnimatePresence } from 'framer-motion';
import { RiArrowLeftSLine, RiArrowRightSLine } from 'react-icons/ri';
import { Virtual, SwiperOptions } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Swiper as SwiperCore } from 'swiper/types';
import { PosterCard } from '/@/renderer/components/card/poster-card';
import { Album, AlbumArtist, Artist, LibraryItem, RelatedArtist } from '/@/renderer/api/types';
import { CardRoute, CardRow } from '/@/renderer/types';
import { TextTitle } from '/@/renderer/components/text-title';
import { Button } from '/@/renderer/components/button';
import { usePlayButtonBehavior } from '/@/renderer/store';
import { useCreateFavorite, useDeleteFavorite } from '/@/renderer/features/shared';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { MotionStack } from '/@/renderer/components/motion';
import 'swiper/css';

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

interface SwiperGridCarouselProps {
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

const variants = {
  hidden: {
    opacity: 0,
  },
  show: {
    opacity: 1,
  },
};

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
  const { ref, width } = useElementSize();
  const swiperRef = useRef<SwiperCore | any>(null);
  const playButtonBehavior = usePlayButtonBehavior();
  const handlePlayQueueAdd = usePlayQueueAdd();

  const slidesPerView = width > 1500 ? 9 : width > 1200 ? 6 : width > 768 ? 5 : width > 600 ? 3 : 2;

  const [pagination, setPagination] = useState({
    hasNextPage: (data?.length || 0) > Math.round(slidesPerView),
    hasPreviousPage: false,
  });

  const createFavoriteMutation = useCreateFavorite({});
  const deleteFavoriteMutation = useDeleteFavorite({});

  const handleFavorite = useCallback(
    (options: { id: string[]; isFavorite: boolean; itemType: LibraryItem; serverId: string }) => {
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

  const slides = data
    ? data.map((el) => (
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
      ))
    : Array.from(Array(10).keys()).map((el) => (
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

  const handleNext = useCallback(() => {
    const activeIndex = swiperRef?.current?.activeIndex || 0;
    const slidesPerView = Math.round(Number(swiperProps?.slidesPerView || 5));
    swiperRef?.current?.slideTo(activeIndex + slidesPerView);
  }, [swiperProps?.slidesPerView]);

  const handlePrev = useCallback(() => {
    const activeIndex = swiperRef?.current?.activeIndex || 0;
    const slidesPerView = Math.round(Number(swiperProps?.slidesPerView || 5));
    swiperRef?.current?.slideTo(activeIndex - slidesPerView);
  }, [swiperProps?.slidesPerView]);

  const handleOnSlideChange = useCallback(
    (e: SwiperCore) => {
      const { slides, isEnd, isBeginning } = e;
      if (isEnd || isBeginning) return;

      setPagination({
        hasNextPage: slidesPerView < slides.length,
        hasPreviousPage: slidesPerView < slides.length,
      });
    },
    [slidesPerView],
  );

  const handleOnZoomChange = useCallback(
    (e: SwiperCore) => {
      const { slides, isEnd, isBeginning } = e;
      if (isEnd || isBeginning) return;

      setPagination({
        hasNextPage: slidesPerView < slides.length,
        hasPreviousPage: slidesPerView < slides.length,
      });
    },
    [slidesPerView],
  );

  const handleOnReachEnd = useCallback(
    (e: SwiperCore) => {
      const { slides } = e;

      setPagination({
        hasNextPage: false,
        hasPreviousPage: slidesPerView < slides.length,
      });
    },
    [slidesPerView],
  );

  const handleOnReachBeginning = useCallback(
    (e: SwiperCore) => {
      const { slides } = e;

      setPagination({
        hasNextPage: slidesPerView < slides.length,
        hasPreviousPage: false,
      });
    },
    [slidesPerView],
  );

  return (
    <AnimatePresence
      initial
      mode="sync"
    >
      <Box
        ref={ref}
        className="grid-carousel"
      >
        {width ? (
          <MotionStack
            animate="show"
            initial="hidden"
            spacing="md"
            variants={variants}
          >
            {title && (
              <Title
                {...title}
                handleNext={handleNext}
                handlePrev={handlePrev}
                pagination={pagination}
              />
            )}
            <Swiper
              ref={swiperRef}
              modules={[Virtual]}
              slidesPerView={swiperProps?.slidesPerView || slidesPerView || 5}
              spaceBetween={20}
              style={{ height: '100%', width: '100%' }}
              onBeforeInit={(swiper) => {
                swiperRef.current = swiper;
              }}
              onReachBeginning={handleOnReachBeginning}
              onReachEnd={handleOnReachEnd}
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
          </MotionStack>
        ) : null}
      </Box>
    </AnimatePresence>
  );
};
