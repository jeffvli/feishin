import { Center } from '@mantine/core';
import { RiAlbumFill } from 'react-icons/ri';
import { generatePath } from 'react-router';
import { Link } from 'react-router-dom';
import { SimpleImg } from 'react-simple-img';
import type { ListChildComponentProps } from 'react-window';
import styled from 'styled-components';
import { Skeleton } from '/@/renderer/components/skeleton';
import type { CardRow, CardRoute, Play, PlayQueueAddOptions } from '/@/renderer/types';
import { GridCardControls } from '/@/renderer/components/virtual-grid/grid-card/grid-card-controls';
import { Album, Artist, AlbumArtist, LibraryItem } from '/@/renderer/api/types';
import { CardRows } from '/@/renderer/components/card';

const CardWrapper = styled.div<{
  itemGap: number;
  itemHeight: number;
  itemWidth: number;
}>`
  flex: ${({ itemWidth }) => `0 0 ${itemWidth}px`};
  width: ${({ itemWidth }) => `${itemWidth}px`};
  height: ${({ itemHeight, itemGap }) => `${itemHeight - itemGap}px`};
  margin: ${({ itemGap }) => `0 ${itemGap / 2}px`};
  user-select: none;
  pointer-events: auto; // https://github.com/bvaughn/react-window/issues/128#issuecomment-460166682

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
  background: var(--card-poster-bg);
  border-radius: var(--card-poster-radius);

  &:hover {
    background: var(--card-poster-bg-hover);
  }
`;

const ImageSection = styled.div`
  position: relative;
  width: 100%;
  border-radius: var(--card-poster-radius);

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

interface ImageProps {
  height: number;
  isLoading?: boolean;
}

const Image = styled(SimpleImg)<ImageProps>`
  border: 0;
  border-radius: var(--card-poster-radius);

  img {
    object-fit: cover;
  }
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

export const PosterCard = ({
  listChildProps,
  data,
  columnIndex,
  controls,
  sizes,
}: BaseGridCardProps) => {
  if (data) {
    return (
      <CardWrapper
        key={`card-${columnIndex}-${listChildProps.index}`}
        itemGap={sizes.itemGap}
        itemHeight={sizes.itemHeight}
        itemWidth={sizes.itemWidth}
      >
        <StyledCard>
          <Link
            tabIndex={0}
            to={generatePath(
              controls.route.route,
              controls.route.slugs?.reduce((acc, slug) => {
                return {
                  ...acc,
                  [slug.slugProperty]: data[slug.idProperty],
                };
              }, {}),
            )}
          >
            <ImageSection style={{ height: `${sizes.itemWidth}px` }}>
              {data?.imageUrl ? (
                <Image
                  animationDuration={0.3}
                  height={sizes.itemWidth}
                  importance="auto"
                  placeholder={data?.imagePlaceholderUrl || 'var(--card-default-bg)'}
                  src={data?.imageUrl}
                  width={sizes.itemWidth}
                />
              ) : (
                <Center
                  sx={{
                    background: 'var(--placeholder-bg)',
                    borderRadius: 'var(--card-poster-radius)',
                    height: '100%',
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
                  handlePlayQueueAdd={controls.handlePlayQueueAdd}
                  itemData={data}
                  itemType={controls.itemType}
                />
              </ControlsContainer>
            </ImageSection>
          </Link>
          <DetailSection>
            <CardRows
              data={data}
              rows={controls.cardRows}
            />
          </DetailSection>
        </StyledCard>
      </CardWrapper>
    );
  }

  return (
    <CardWrapper
      key={`card-${columnIndex}-${listChildProps.index}`}
      itemGap={sizes.itemGap}
      itemHeight={sizes.itemHeight}
      itemWidth={sizes.itemWidth}
    >
      <StyledCard>
        <Skeleton
          visible
          radius="sm"
        >
          <ImageSection style={{ height: `${sizes.itemWidth}px` }} />
        </Skeleton>
        <DetailSection>
          {controls.cardRows.map((row: CardRow<Album | Artist | AlbumArtist>, index: number) => (
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
