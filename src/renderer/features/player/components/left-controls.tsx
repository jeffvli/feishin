import styled from '@emotion/styled';
import { Group } from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';
import { RiArrowUpSLine } from 'react-icons/ri';
import { Button, Text } from '@/renderer/components';
import { useAppStore, usePlayerStore } from '@/renderer/store';
import { Font } from '@/renderer/styles';

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

const Image = styled(motion.div)<{ url: string }>`
  width: 70px;
  height: 70px;
  background-image: url(${(props) => props.url});
  background-repeat: no-repeat;
  background-size: cover;

  button {
    display: none;
  }

  &:hover button {
    display: block;
  }
`;

export const LeftControls = () => {
  const hideImage = useAppStore((state) => state.sidebar.image);
  const setSidebar = useAppStore((state) => state.setSidebar);
  const song = usePlayerStore((state) => state.current.song);
  const title = song?.name;
  const artists = song?.artists?.map((artist) => artist?.name).join(', ');
  const album = song?.album;

  return (
    <LeftControlsContainer>
      <ImageWrapper>
        <AnimatePresence>
          {!hideImage && (
            <Image
              key="playerbar-image"
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, y: 50 }}
              initial={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              url={song?.imageUrl}
            >
              <Group position="right">
                <Button
                  compact
                  variant="subtle"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSidebar({ image: true });
                  }}
                >
                  <RiArrowUpSLine color="white" size={20} />
                </Button>
              </Group>
            </Image>
          )}
        </AnimatePresence>
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
          {album?.name || '—'}
        </Text>
      </MetadataStack>
    </LeftControlsContainer>
  );
};
