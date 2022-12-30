import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Group, Stack } from '@mantine/core';
import type { Variants } from 'framer-motion';
import { AnimatePresence, motion } from 'framer-motion';
import { RiArrowLeftSLine, RiArrowRightSLine } from 'react-icons/ri';
import { Button } from '/@/renderer/components/button';
import { AppRoute } from '/@/renderer/router/routes';
import type { CardRow } from '/@/renderer/types';
import { LibraryItem, Play } from '/@/renderer/types';
import styled from 'styled-components';
import { AlbumCard } from '/@/renderer/components/card';
import { useHandlePlayQueueAdd } from '/@/renderer/features/player/hooks/use-handle-playqueue-add';

interface GridCarouselProps {
  cardRows: CardRow<any>[];
  children: React.ReactElement;
  containerWidth: number;
  data: any[] | undefined;
  loading?: boolean;
  pagination?: {
    handleNextPage?: () => void;
    handlePreviousPage?: () => void;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
    itemsPerPage?: number;
  };
  uniqueId: string;
}

const GridCarouselContext = createContext<any>({});

const GridContainer = styled(motion.div)<{ height: number; itemsPerPage: number }>`
  display: grid;
  grid-auto-rows: 0;
  grid-gap: 18px;
  grid-template-rows: 1fr;
  grid-template-columns: repeat(${(props) => props.itemsPerPage || 4}, minmax(0, 1fr));
  height: ${(props) => props.height}px;
  overflow: hidden;
`;

const Wrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

const variants: Variants = {
  animate: (custom: { direction: number; loading: boolean }) => {
    return {
      opacity: custom.loading ? 0.5 : 1,
      scale: custom.loading ? 0.95 : 1,
      transition: {
        opacity: { duration: 0.2 },
        x: { damping: 30, stiffness: 300, type: 'spring' },
      },
      x: 0,
    };
  },
  exit: (custom: { direction: number; loading: boolean }) => {
    return {
      opacity: 0,
      transition: {
        opacity: { duration: 0.2 },
        x: { damping: 30, stiffness: 300, type: 'spring' },
      },
      x: custom.direction > 0 ? -1000 : 1000,
    };
  },
  initial: (custom: { direction: number; loading: boolean }) => {
    return {
      opacity: 0,
      x: custom.direction > 0 ? 1000 : -1000,
    };
  },
};

const Carousel = ({ data, cardRows }: any) => {
  const { loading, pagination, gridHeight, imageSize, direction, uniqueId } =
    useContext(GridCarouselContext);

  const handlePlayQueueAdd = useHandlePlayQueueAdd();

  return (
    <Wrapper>
      <AnimatePresence
        custom={{ direction, loading }}
        initial={false}
        mode="popLayout"
      >
        <GridContainer
          key={`carousel-${uniqueId}-${data[0]?.id}`}
          animate="animate"
          custom={{ direction, loading }}
          exit="exit"
          height={gridHeight}
          initial="initial"
          itemsPerPage={pagination.itemsPerPage}
          variants={variants}
        >
          {data?.map((item: any, index: number) => (
            <AlbumCard
              key={`card-${uniqueId}-${index}`}
              controls={{
                cardRows,
                itemType: LibraryItem.ALBUM,
                playButtonBehavior: Play.NOW,
                route: {
                  route: AppRoute.LIBRARY_ALBUMS_DETAIL,
                  slugs: [{ idProperty: 'id', slugProperty: 'albumId' }],
                },
              }}
              data={item}
              handlePlayQueueAdd={handlePlayQueueAdd}
              size={imageSize}
            />
          ))}
        </GridContainer>
      </AnimatePresence>
    </Wrapper>
  );
};

export const GridCarousel = ({
  data,
  loading,
  cardRows,
  pagination,
  children,
  containerWidth,
  uniqueId,
}: GridCarouselProps) => {
  const [direction, setDirection] = useState(0);

  const gridHeight = useMemo(
    () => (containerWidth * 1.2 - 36) / (pagination?.itemsPerPage || 4),
    [containerWidth, pagination?.itemsPerPage],
  );

  const imageSize = useMemo(() => gridHeight * 0.66, [gridHeight]);

  const providerValue = useMemo(
    () => ({
      cardRows,
      data,
      direction,
      gridHeight,
      imageSize,
      loading,
      pagination,
      setDirection,
      uniqueId,
    }),
    [cardRows, data, direction, gridHeight, imageSize, loading, pagination, uniqueId],
  );

  return (
    <GridCarouselContext.Provider value={providerValue}>
      <Stack>
        {children}
        {data && (
          <Carousel
            cardRows={cardRows}
            data={data}
          />
        )}
      </Stack>
    </GridCarouselContext.Provider>
  );
};

interface TitleProps {
  children?: React.ReactNode;
}

const Title = ({ children }: TitleProps) => {
  const { pagination, setDirection } = useContext(GridCarouselContext);

  const handleNextPage = useCallback(() => {
    setDirection(1);
    pagination?.handleNextPage?.();
  }, [pagination, setDirection]);

  const handlePreviousPage = useCallback(() => {
    setDirection(-1);
    pagination?.handlePreviousPage?.();
  }, [pagination, setDirection]);

  return (
    <Group position="apart">
      {children}
      <Group>
        <Button
          compact
          disabled={!pagination?.hasPreviousPage}
          variant="default"
          onClick={handlePreviousPage}
        >
          <RiArrowLeftSLine size={15} />
        </Button>
        <Button
          compact
          variant="default"
          onClick={handleNextPage}
        >
          <RiArrowRightSLine size={15} />
        </Button>
      </Group>
    </Group>
  );
};

GridCarousel.Title = Title;
GridCarousel.Carousel = Carousel;
