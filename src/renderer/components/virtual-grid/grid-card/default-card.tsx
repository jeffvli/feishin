import { generatePath, useNavigate } from 'react-router-dom';
import { ListChildComponentProps } from 'react-window';
import styled from 'styled-components';
import { Album, AlbumArtist, Artist, LibraryItem } from '/@/renderer/api/types';
import { CardRows } from '/@/renderer/components/card';
import { Skeleton } from '/@/renderer/components/skeleton';
import { GridCardControls } from '/@/renderer/components/virtual-grid/grid-card/grid-card-controls';
import { CardRow, PlayQueueAddOptions, Play, CardRoute } from '/@/renderer/types';

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
  isHidden?: boolean;
  listChildProps: Omit<ListChildComponentProps, 'data' | 'style'>;
}

const DefaultCardContainer = styled.div<{ $isHidden?: boolean }>`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: calc(100% - 2rem);
  margin: 0.5rem;
  overflow: hidden;
  background: var(--card-default-bg);
  border-radius: var(--card-default-radius);
  cursor: pointer;
  opacity: ${({ $isHidden }) => ($isHidden ? 0 : 1)};
  pointer-events: auto;

  &:hover {
    background: var(--card-default-bg-hover);
  }
`;

const InnerCardContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 1rem;
  overflow: hidden;

  .card-controls {
    opacity: 0;
  }

  &:hover .card-controls {
    opacity: 1;
  }

  &:hover * {
    &::before {
      opacity: 0.5;
    }
  }
`;

const ImageContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  height: 100%;
  aspect-ratio: 1/1;
  overflow: hidden;
  background: var(--placeholder-bg);
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
  width: 100%;
  max-width: 100%;
  height: auto;
  object-fit: contain;
  border: 0;
`;

const DetailContainer = styled.div`
  margin-top: 0.5rem;
`;

export const DefaultCard = ({
  listChildProps,
  data,
  columnIndex,
  controls,
  isHidden,
}: BaseGridCardProps) => {
  const navigate = useNavigate();

  if (data) {
    const path = generatePath(
      controls.route.route,
      controls.route.slugs?.reduce((acc, slug) => {
        return {
          ...acc,
          [slug.slugProperty]: data[slug.idProperty],
        };
      }, {}),
    );

    return (
      <DefaultCardContainer
        key={`card-${columnIndex}-${listChildProps.index}`}
        onClick={() => navigate(path)}
      >
        <InnerCardContainer>
          <ImageContainer>
            <Image
              placeholder={data?.imagePlaceholderUrl || 'var(--placeholder-bg)'}
              src={data?.imageUrl}
            />
            <GridCardControls
              handleFavorite={controls.handleFavorite}
              handlePlayQueueAdd={controls.handlePlayQueueAdd}
              itemData={data}
              itemType={controls.itemType}
            />
          </ImageContainer>
          <DetailContainer>
            <CardRows
              data={data}
              rows={controls.cardRows}
            />
          </DetailContainer>
        </InnerCardContainer>
      </DefaultCardContainer>
    );
  }

  return (
    <DefaultCardContainer
      key={`card-${columnIndex}-${listChildProps.index}`}
      $isHidden={isHidden}
    >
      <InnerCardContainer>
        <ImageContainer>
          <Skeleton
            visible
            radius="sm"
          />
        </ImageContainer>
      </InnerCardContainer>
    </DefaultCardContainer>
  );
};
