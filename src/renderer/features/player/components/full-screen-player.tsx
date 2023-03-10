import { useLayoutEffect, useRef } from 'react';
import { Group } from '@mantine/core';
import { useHotkeys } from '@mantine/hooks';
import { Variants, motion } from 'framer-motion';
import { RiArrowDownSLine, RiSettings3Line } from 'react-icons/ri';
import { useLocation } from 'react-router';
import styled from 'styled-components';
import { Button, Option, Popover, Switch, TableConfigDropdown } from '/@/renderer/components';
import {
  useCurrentSong,
  useFullScreenPlayerStore,
  useFullScreenPlayerStoreActions,
} from '/@/renderer/store';
import { useFastAverageColor } from '../../../hooks/use-fast-average-color';
import { FullScreenPlayerImage } from '/@/renderer/features/player/components/full-screen-player-image';
import { FullScreenPlayerQueue } from '/@/renderer/features/player/components/full-screen-player-queue';

const Container = styled(motion.div)`
  z-index: 100;
  display: flex;
  justify-content: center;
  padding: 2rem;
`;

const ResponsiveContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
  max-width: 2560px;
  margin-top: 70px;

  .full-screen-player-image {
    max-height: 30vh;
  }

  @media screen and (min-width: 1080px) {
    flex-direction: row;

    .full-screen-player-image {
      max-height: 100%;
    }
  }
`;

const BackgroundImageOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  z-index: -1;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, rgba(20, 21, 23, 40%), var(--main-bg));
`;

export const FullScreenPlayer = () => {
  const { dynamicBackground, expanded } = useFullScreenPlayerStore();
  const { setStore } = useFullScreenPlayerStoreActions();
  const handleToggleFullScreenPlayer = () => {
    setStore({ expanded: !expanded });
  };

  const location = useLocation();
  const isOpenedRef = useRef<boolean | null>(null);

  useHotkeys([['Escape', handleToggleFullScreenPlayer]]);

  useLayoutEffect(() => {
    if (isOpenedRef.current !== null) {
      setStore({ expanded: false });
    }

    isOpenedRef.current = true;
  }, [location, setStore]);

  const currentSong = useCurrentSong();

  const background = useFastAverageColor(currentSong?.imageUrl, true, 'dominant');

  const containerVariants: Variants = {
    closed: {
      height: 'calc(100vh - 90px)',
      position: 'absolute',
      top: '100vh',
      transition: {
        duration: 0.5,
        ease: 'easeInOut',
      },
      width: '100vw',
      y: -100,
    },
    open: {
      background: dynamicBackground ? background : 'var(--main-bg)',
      height: 'calc(100vh - 90px)',
      left: 0,
      position: 'absolute',
      top: 0,
      transition: {
        background: {
          duration: 1,
          ease: 'easeInOut',
        },
        delay: 0.1,
        duration: 0.5,
        ease: 'easeInOut',
      },
      width: '100vw',
      y: 0,
    },
  };

  return (
    <Container
      animate="open"
      exit="closed"
      initial="closed"
      variants={containerVariants}
    >
      <Group
        p="1rem"
        pos="absolute"
        sx={{
          left: 0,
          top: 0,
        }}
      >
        <Button
          tooltip={{ label: 'Minimize' }}
          variant="subtle"
          onClick={handleToggleFullScreenPlayer}
        >
          <RiArrowDownSLine size="2rem" />
        </Button>
        <Popover position="bottom-start">
          <Popover.Target>
            <Button
              tooltip={{ label: 'Configure' }}
              variant="subtle"
            >
              <RiSettings3Line size="1.5rem" />
            </Button>
          </Popover.Target>
          <Popover.Dropdown>
            <Option>
              <Option.Label>Dynamic Background</Option.Label>
              <Option.Control>
                <Switch
                  defaultChecked={dynamicBackground}
                  onChange={(e) =>
                    setStore({
                      dynamicBackground: e.target.checked,
                    })
                  }
                />
              </Option.Control>
            </Option>

            <TableConfigDropdown type="fullScreen" />
          </Popover.Dropdown>
        </Popover>
      </Group>
      {dynamicBackground && <BackgroundImageOverlay />}
      <ResponsiveContainer>
        <FullScreenPlayerImage />
        <FullScreenPlayerQueue />
      </ResponsiveContainer>
    </Container>
  );
};
