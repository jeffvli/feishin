import { Center, Stack } from '@mantine/core';
import { RiAlbumFill, RiPlayListFill, RiUserVoiceFill } from 'react-icons/ri';
import { generatePath, useNavigate } from 'react-router-dom';
import { SimpleImg } from 'react-simple-img';
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

const PosterCardContainer = styled.div<{ $isHidden?: boolean }>`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  margin: 1rem;
  overflow: hidden;
  opacity: ${({ $isHidden }) => ($isHidden ? 0 : 1)};
  pointer-events: auto;

  .card-controls {
    opacity: 0;
  }
`;

const LinkContainer = styled.div`
  cursor: pointer;
`;

const ImageContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  aspect-ratio: 1/1;
  overflow: hidden;
  background: var(--card-default-bg);
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

  &:hover {
    &::before {
      opacity: 0.5;
    }
  }

  &:hover .card-controls {
    opacity: 1;
  }
`;

const Image = styled(SimpleImg)`
  width: 100%;
  max-width: 100%;
  height: 100%;
  max-height: 100%;
  border: 0;

  img {
    height: 100%;
    object-fit: cover;
  }
`;

const DetailContainer = styled.div`
  margin-top: 0.5rem;
`;

export const PosterCard = ({
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

    let Placeholder = RiAlbumFill;

    switch (controls.itemType) {
      case LibraryItem.ALBUM:
        Placeholder = RiAlbumFill;
        break;
      case LibraryItem.ARTIST:
        Placeholder = RiUserVoiceFill;
        break;
      case LibraryItem.ALBUM_ARTIST:
        Placeholder = RiUserVoiceFill;
        break;
      case LibraryItem.PLAYLIST:
        Placeholder = RiPlayListFill;
        break;
      default:
        Placeholder = RiAlbumFill;
        break;
    }

    return (
      <PosterCardContainer key={`card-${columnIndex}-${listChildProps.index}`}>
        <LinkContainer onClick={() => navigate(path)}>
          <ImageContainer>
            {data?.imageUrl ? (
              <Image
                importance="auto"
                placeholder={data?.imagePlaceholderUrl || 'var(--card-default-bg)'}
                src={data?.imageUrl}
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
                <Placeholder
                  color="var(--placeholder-fg)"
                  size={35}
                />
              </Center>
            )}
            <GridCardControls
              handleFavorite={controls.handleFavorite}
              handlePlayQueueAdd={controls.handlePlayQueueAdd}
              itemData={data}
              itemType={controls.itemType}
            />
          </ImageContainer>
        </LinkContainer>
        <DetailContainer>
          <CardRows
            data={data}
            rows={controls.cardRows}
          />
        </DetailContainer>
      </PosterCardContainer>
    );
  }

  return (
    <PosterCardContainer
      key={`card-${columnIndex}-${listChildProps.index}`}
      $isHidden={isHidden}
    >
      <Skeleton
        visible
        radius="sm"
      >
        <ImageContainer />
      </Skeleton>
      <DetailContainer>
        <Stack spacing="sm">
          {controls.cardRows.map((row) => (
            <Skeleton
              key={row.arrayProperty}
              visible
              height={14}
              radius="sm"
            />
          ))}
        </Stack>
      </DetailContainer>
    </PosterCardContainer>
  );
};
