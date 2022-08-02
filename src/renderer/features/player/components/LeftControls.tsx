import styled from 'styled-components';
import { Text } from '../../../components';
import { usePlayerStore } from '../../../store';
import { Font } from '../../../styles';

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
  const title = song?.name;
  const artists = song?.artists?.map((artist) => artist?.name).join(', ');
  const album = song?.album;

  return (
    <LeftControlsContainer>
      <ImageWrapper>
        <img alt="img" height={60} src={song?.imageUrl} width={60} />
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
