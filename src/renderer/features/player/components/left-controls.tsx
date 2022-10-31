import styled from '@emotion/styled';
import { Group } from '@mantine/core';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { RiArrowUpSLine } from 'react-icons/ri';
import { Link } from 'react-router-dom';
import { Button, Text } from '@/renderer/components';
import { AppRoute } from '@/renderer/router/routes';
import { useAppStore, usePlayerStore } from '@/renderer/store';
import { fadeIn, Font } from '@/renderer/styles';

const LeftControlsContainer = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  margin-left: 1rem;
`;

const ImageWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 1rem 1rem 0;
`;

const MetadataStack = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  justify-content: center;
  width: 100%;
  overflow: hidden;
`;

const Image = styled(motion(Link))<{ url: string }>`
  ${fadeIn};
  width: 60px;
  height: 60px;
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
      <LayoutGroup>
        <AnimatePresence exitBeforeEnter={false} initial={false}>
          {!hideImage && (
            <ImageWrapper>
              <Image
                key="playerbar-image"
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                initial={{ opacity: 0, x: -50 }}
                to={AppRoute.NOW_PLAYING}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                url={song?.imageUrl}
              >
                <Group position="right">
                  <Button
                    compact
                    variant="subtle"
                    onClick={(e) => {
                      e.preventDefault();
                      setSidebar({ image: true });
                    }}
                  >
                    <RiArrowUpSLine color="white" size={20} />
                  </Button>
                </Group>
              </Image>
            </ImageWrapper>
          )}
        </AnimatePresence>
        <MetadataStack layout>
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
      </LayoutGroup>
    </LeftControlsContainer>
  );
};
