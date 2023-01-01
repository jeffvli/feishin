import { Center, Group } from '@mantine/core';
import { useMergedRef } from '@mantine/hooks';
import { forwardRef } from 'react';
import { RiAlbumFill } from 'react-icons/ri';
import { useParams } from 'react-router';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Text, TextTitle } from '/@/renderer/components';
import { usePlaylistDetail } from '/@/renderer/features/playlists/queries/playlist-detail-query';
import { PlayButton } from '/@/renderer/features/shared';
import { useContainerQuery } from '/@/renderer/hooks';
import { AppRoute } from '/@/renderer/router/routes';

const HeaderContainer = styled.div`
  position: relative;
  display: grid;
  grid-auto-columns: 1fr;
  grid-template-areas: 'image info';
  grid-template-rows: 1fr;
  grid-template-columns: 250px minmax(0, 1fr);
  gap: 0.5rem;
  width: 100%;
  max-width: 100%;
  height: 30vh;
  min-height: 340px;
  max-height: 500px;
  padding: 5rem 2rem 2rem;
`;

const CoverImageWrapper = styled.div`
  z-index: 15;
  display: flex;
  grid-area: image;
  align-items: flex-end;
  justify-content: center;
  height: 100%;
  filter: drop-shadow(0 0 8px rgb(0, 0, 0, 50%));
`;

const MetadataWrapper = styled.div`
  z-index: 15;
  display: flex;
  flex-direction: column;
  grid-area: info;
  justify-content: flex-end;
  width: 100%;
`;

const StyledImage = styled.img`
  object-fit: cover;
`;

const BackgroundImage = styled.div<{ background: string }>`
  position: absolute;
  top: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  background: ${(props) => props.background};
`;

const BackgroundImageOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, rgba(25, 26, 28, 5%), var(--main-bg)), var(--background-noise);
`;

interface PlaylistDetailHeaderProps {
  background: string;
  imageUrl?: string;
}

export const PlaylistDetailHeader = forwardRef(
  ({ background, imageUrl }: PlaylistDetailHeaderProps, ref) => {
    const { playlistId } = useParams() as { playlistId: string };
    const detailQuery = usePlaylistDetail({ id: playlistId });
    const cq = useContainerQuery();

    const mergedRef = useMergedRef(ref, cq.ref);

    const titleSize = cq.isXl
      ? '6rem'
      : cq.isLg
      ? '5.5rem'
      : cq.isMd
      ? '4.5rem'
      : cq.isSm
      ? '3.5rem'
      : '2rem';

    return (
      <>
        <HeaderContainer ref={mergedRef}>
          <BackgroundImage background={background} />
          <BackgroundImageOverlay />
          <CoverImageWrapper>
            {imageUrl ? (
              <StyledImage
                alt="cover"
                height={225}
                src={imageUrl}
                width={225}
              />
            ) : (
              <Center
                sx={{
                  background: 'var(--placeholder-bg)',
                  borderRadius: 'var(--card-default-radius)',
                  height: `${225}px`,
                  width: `${225}px`,
                }}
              >
                <RiAlbumFill
                  color="var(--placeholder-fg)"
                  size={35}
                />
              </Center>
            )}
          </CoverImageWrapper>
          <MetadataWrapper>
            <Group>
              <Text
                $link
                component={Link}
                fw="600"
                sx={{ textTransform: 'uppercase' }}
                to={AppRoute.LIBRARY_ALBUMS}
              >
                Playlist
              </Text>
            </Group>
            <TextTitle
              fw="900"
              lh="1"
              mb="0.12em"
              mt=".08em"
              sx={{ fontSize: titleSize }}
            >
              {detailQuery?.data?.name}
            </TextTitle>
            <Group
              py="1rem"
              spacing="xs"
            >
              <PlayButton />
            </Group>
          </MetadataWrapper>
        </HeaderContainer>
      </>
    );
  },
);
