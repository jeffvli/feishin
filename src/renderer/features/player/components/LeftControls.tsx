import { LazyLoadImage as Image } from 'react-lazy-load-image-component';
import styled from 'styled-components';
import { Text } from 'renderer/components';
import { usePlayerStore } from 'renderer/store';
import { Font } from 'renderer/styles';

const LeftControlsContainer = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
`;

const ImageWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
`;

const MetadataStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  justify-content: center;
  width: 100%;
  overflow: hidden;
`;

export const LeftControls = () => {
  const song = usePlayerStore((state) => state.current.song);
  const title = song?.title;
  const artists = song?.artist?.map((artist) => artist?.title).join(', ');
  const album = song?.album;

  return (
    <LeftControlsContainer>
      <ImageWrapper>
        <Image height={60} src={song?.image} width={60} />
      </ImageWrapper>
      <MetadataStack>
        <Text
          font={Font.POPPINS}
          link={!!title}
          overflow="hidden"
          size="sm"
          to="/nowplaying"
          weight={500}
        >
          {title || '—'}
        </Text>
        <Text
          secondary
          font={Font.POPPINS}
          link={!!artists}
          overflow="hidden"
          size="sm"
          to="/nowplaying"
          weight={500}
        >
          {artists || '—'}
        </Text>
        <Text
          secondary
          font={Font.POPPINS}
          link={!!album}
          overflow="hidden"
          size="sm"
          to="/nowplaying"
          weight={500}
        >
          {album || '—'}
        </Text>
      </MetadataStack>
    </LeftControlsContainer>
  );
};
