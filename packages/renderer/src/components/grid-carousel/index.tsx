import { createContext, useContext } from 'react';
import { Group, Stack } from '@mantine/core';
import { motion } from 'framer-motion';
import { RiArrowLeftSFill, RiArrowRightSFill } from 'react-icons/ri';
import { AlbumCard, Button } from '/@/components';
import { AppRoute } from '/@/router/routes';
import type { CardRow } from '/@/types';
import { LibraryItem, Play } from '/@/types';
import styled from 'styled-components';

interface GridCarouselProps {
  cardRows: CardRow[];
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
}

const GridCarouselContext = createContext<any>(null);

export const GridCarousel = ({
  data,
  loading,
  cardRows,
  pagination,
  children,
  containerWidth,
}: GridCarouselProps) => {
  const gridHeight = (containerWidth * 1.2 - 36) / (pagination?.itemsPerPage || 4);
  const imageSize = gridHeight * 0.66;
  const providerValue = { cardRows, data, gridHeight, imageSize, loading, pagination };

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

const GridContainer = styled.div<{ height: number; itemsPerPage: number }>`
  display: grid;
  grid-auto-rows: 0;
  grid-gap: 18px;
  grid-template-rows: 1fr;
  grid-template-columns: repeat(${(props) => props.itemsPerPage || 4}, minmax(0, 1fr));
  height: ${(props) => props.height}px;
`;

const Carousel = ({ data, cardRows }: any) => {
  const { loading, pagination, gridHeight, imageSize } = useContext(GridCarouselContext);

  return (
    <motion.div
      animate={{
        opacity: loading ? 0.5 : 1,
        scale: loading ? 0.95 : 1,
      }}
    >
      <GridContainer
        height={gridHeight}
        itemsPerPage={pagination.itemsPerPage}
      >
        {data?.map((item: any) => (
          <AlbumCard
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
            loading={loading}
            size={imageSize}
          />
        ))}
      </GridContainer>
    </motion.div>
  );
};

interface TitleProps {
  children?: React.ReactNode;
}

const Title = ({ children }: TitleProps) => {
  const { pagination } = useContext(GridCarouselContext);

  return (
    <Group position="apart">
      {children}
      <Group>
        <Button
          compact
          disabled={pagination?.hasPreviousPage === false}
          variant="default"
          onClick={pagination?.handlePreviousPage}
        >
          <RiArrowLeftSFill size={20} />
        </Button>
        <Button
          compact
          variant="default"
          onClick={pagination?.handleNextPage}
        >
          <RiArrowRightSFill size={20} />
        </Button>
      </Group>
    </Group>
  );
};

GridCarousel.Title = Title;
GridCarousel.Carousel = Carousel;
