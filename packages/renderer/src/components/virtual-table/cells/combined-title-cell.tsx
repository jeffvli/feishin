import React, { useMemo } from 'react';
import type { ICellRendererParams } from '@ag-grid-community/core';
import { motion } from 'framer-motion';
import { generatePath } from 'react-router';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import type { AlbumArtist, Artist } from '/@/api/types';
import { Text } from '/@/components/text';
import { AppRoute } from '/@/router/routes';
import { ServerType } from '/@/types';

const CellContainer = styled(motion.div)<{ height: number }>`
  display: grid;
  grid-auto-columns: 1fr;
  grid-template-areas: 'image info';
  grid-template-rows: 1fr;
  grid-template-columns: ${(props) => props.height}px minmax(0, 1fr);
  gap: 0.5rem;
  width: 100%;
  max-width: 100%;
  height: 100%;
`;

const ImageWrapper = styled.div`
  display: flex;
  grid-area: image;
  align-items: center;
  justify-content: center;
  height: 100%;
`;

const MetadataWrapper = styled.div`
  display: flex;
  flex-direction: column;
  grid-area: info;
  justify-content: center;
  width: 100%;
`;

const StyledImage = styled.img`
  object-fit: cover;
`;

export const CombinedTitleCell = ({ value, rowIndex, node }: ICellRendererParams) => {
  const artists = useMemo(() => {
    return value.type === ServerType.JELLYFIN ? value.artists : value.albumArtists;
  }, [value]);

  return (
    <CellContainer height={node.rowHeight || 40}>
      <ImageWrapper>
        <StyledImage
          alt="song-cover"
          height={(node.rowHeight || 40) - 10}
          loading="lazy"
          src={value.imageUrl}
          style={{}}
          width={(node.rowHeight || 40) - 10}
        />
      </ImageWrapper>
      <MetadataWrapper>
        <Text
          overflow="hidden"
          size="sm"
        >
          {value.name}
        </Text>
        <Text
          $secondary
          overflow="hidden"
          size="xs"
        >
          {artists?.length ? (
            artists.map((artist: Artist | AlbumArtist, index: number) => (
              <React.Fragment key={`queue-${rowIndex}-artist-${artist.id}`}>
                {index > 0 ? ', ' : null}
                <Text
                  $link
                  $secondary
                  component={Link}
                  overflow="hidden"
                  size="xs"
                  sx={{ width: 'fit-content' }}
                  to={generatePath(AppRoute.LIBRARY_ALBUMARTISTS_DETAIL, {
                    albumArtistId: artist.id,
                  })}
                >
                  {artist.name}
                </Text>
              </React.Fragment>
            ))
          ) : (
            <Text $secondary>—</Text>
          )}
        </Text>
      </MetadataWrapper>
    </CellContainer>
  );
};
