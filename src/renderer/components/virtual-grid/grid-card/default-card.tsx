import { Center } from '@mantine/core';
import { RiAlbumFill } from 'react-icons/ri';
import { generatePath, useNavigate } from 'react-router';
import type { ListChildComponentProps } from 'react-window';
import styled from 'styled-components';
import type { CardRow, CardRoute, Play, PlayQueueAddOptions } from '/@/renderer/types';
import { Skeleton } from '/@/renderer/components/skeleton';
import { GridCardControls } from '/@/renderer/components/virtual-grid/grid-card/grid-card-controls';
import { Album, AlbumArtist, Artist, LibraryItem } from '/@/renderer/api/types';
import { CardRows } from '/@/renderer/components/card';

const CardWrapper = styled.div<{
  itemGap: number;
  itemHeight: number;
  itemWidth: number;
  link?: boolean;
}>`
  flex: ${({ itemWidth }) => `0 0 ${itemWidth - 12}px`};
  width: ${({ itemWidth }) => `${itemWidth}px`};
  height: ${({ itemHeight, itemGap }) => `${itemHeight - 12 - itemGap}px`};
  margin: ${({ itemGap }) => `0 ${itemGap / 2}px`};
  padding: 12px 12px 0;
  background: var(--card-default-bg);
  border-radius: var(--card-default-radius);
  cursor: ${({ link }) => link && 'pointer'};
  transition: border 0.2s ease-in-out, background 0.2s ease-in-out;
  user-select: none;
  pointer-events: auto; // https://github.com/bvaughn/react-window/issues/128#issuecomment-460166682

  &:hover {
    background: var(--card-default-bg-hover);
  }

  &:hover div {
    opacity: 1;
  }

  &:hover * {
    &::before {
      opacity: 0.5;
    }
  }

  &:focus-visible {
    outline: 1px solid #fff;
  }
`;

const StyledCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  height: 100%;
  padding: 0;
  border-radius: var(--card-default-radius);
`;

const ImageSection = styled.div<{ size?: number }>`
  position: relative;
  width: ${({ size }) => size && `${size - 24}px`};
  height: ${({ size }) => size && `${size - 24}px`};
  border-radius: var(--card-default-radius);

  &::before {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
    width: 100%;
    height: 100%;
    background: linear-gradient(0deg, rgba(0, 0, 0, 100%) 35%, rgba(0, 0, 0, 0%) 100%);
    opacity: 0;
    transition: all 0.2s ease-in-out;
    content: '';
    user-select: none;
  }
`;

const Image = styled.img`
  object-fit: cover;
  border-radius: var(--card-default-radius);
  box-shadow: 2px 2px 10px 2px rgba(0, 0, 0, 20%);
`;

const ControlsContainer = styled.div`
  position: absolute;
  bottom: 0;
  z-index: 50;
  width: 100%;
  opacity: 0;
  transition: all 0.2s ease-in-out;
`;

const DetailSection = styled.div`
  display: flex;
  flex-direction: column;
`;

interface BaseGridCardProps {
  columnIndex: number;
  controls: {
    cardRows: CardRow<Album | AlbumArtist | Artist>[];
    handleFavorite: (options: { id: string[]; isFavorite: boolean; itemType: LibraryItem }) => void;
    handlePlayQueueAdd: (options: PlayQueueAddOptions) => void;
    itemType: LibraryItem;
    playButtonBehavior: Play;
    route: CardRoute;
  };
  data: any;
  listChildProps: Omit<ListChildComponentProps, 'data' | 'style'>;
  sizes: {
    itemGap: number;
    itemHeight: number;
    itemWidth: number;
  };
}

export const DefaultCard = ({
  listChildProps,
  data,
  columnIndex,
  controls,
  sizes,
}: BaseGridCardProps) => {
  const navigate = useNavigate();
  const { index } = listChildProps;
  const { itemGap, itemHeight, itemWidth } = sizes;
  const { itemType, cardRows, route, handlePlayQueueAdd } = controls;

  const cardSize = itemWidth - 24;

  if (data) {
    return (
      <CardWrapper
        key={`card-${columnIndex}-${index}`}
        link
        itemGap={itemGap}
        itemHeight={itemHeight}
        itemWidth={itemWidth}
        onClick={() =>
          navigate(
            generatePath(
              route.route,
              route.slugs?.reduce((acc, slug) => {
                return {
                  ...acc,
                  [slug.slugProperty]: data[slug.idProperty],
                };
              }, {}),
            ),
          )
        }
      >
        <StyledCard>
          <ImageSection size={itemWidth}>
            {data?.imageUrl ? (
              <Image
                height={cardSize}
                placeholder={data?.imagePlaceholderUrl || 'var(--card-default-bg)'}
                src={data?.imageUrl}
                width={cardSize}
              />
            ) : (
              <Center
                sx={{
                  background: 'var(--placeholder-bg)',
                  borderRadius: 'var(--card-default-radius)',
                  height: '100%',
                  width: '100%',
                }}
              >
                <RiAlbumFill
                  color="var(--placeholder-fg)"
                  size={35}
                />
              </Center>
            )}
            <ControlsContainer>
              <GridCardControls
                handleFavorite={controls.handleFavorite}
                handlePlayQueueAdd={handlePlayQueueAdd}
                itemData={data}
                itemType={itemType}
              />
            </ControlsContainer>
          </ImageSection>
          <DetailSection>
            <CardRows
              data={data}
              rows={cardRows}
            />
          </DetailSection>
        </StyledCard>
      </CardWrapper>
    );
  }

  return (
    <CardWrapper
      key={`card-${columnIndex}-${index}`}
      itemGap={itemGap}
      itemHeight={itemHeight}
      itemWidth={itemWidth + 12}
    >
      <StyledCard>
        <Skeleton
          visible
          radius="sm"
        >
          <ImageSection size={itemWidth} />
        </Skeleton>
        <DetailSection>
          {cardRows.map((row: CardRow<Album | Artist | AlbumArtist>, index: number) => (
            <Skeleton
              key={`row-${row.property}-${columnIndex}`}
              height={20}
              my={2}
              radius="md"
              visible={!data}
              width={!data ? (index > 0 ? '50%' : '90%') : '100%'}
            />
          ))}
        </DetailSection>
      </StyledCard>
    </CardWrapper>
  );
};
