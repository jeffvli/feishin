import { useLayoutEffect, useRef } from 'react';
import { Group } from '@mantine/core';
import { useHotkeys } from '@mantine/hooks';
import { Variants, motion } from 'framer-motion';
import { RiArrowDownSLine, RiSettings3Line } from 'react-icons/ri';
import { useLocation } from 'react-router';
import styled from 'styled-components';
import { Button, Option, Popover, Switch } from '/@/renderer/components';
import {
  useCurrentSong,
  useFullScreenPlayerStore,
  useFullScreenPlayerStoreActions,
  useWindowSettings,
} from '/@/renderer/store';
import { useFastAverageColor } from '../../../hooks/use-fast-average-color';
import { FullScreenPlayerImage } from '/@/renderer/features/player/components/full-screen-player-image';
import { FullScreenPlayerQueue } from '/@/renderer/features/player/components/full-screen-player-queue';
import { TableConfigDropdown } from '/@/renderer/components/virtual-table';
import { Platform } from '/@/renderer/types';

const Container = styled(motion.div)`
  z-index: 200;
  display: flex;
  justify-content: center;
  padding: 2rem;
`;

const ResponsiveContainer = styled.div`
  display: grid;
  grid-template-rows: minmax(0, 1fr);
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 2rem 2rem;
  width: 100%;
  max-width: 2560px;
  margin-top: 5rem;

  @media screen and (max-width: 768px) {
    flex-direction: row;
    grid-template-rows: minmax(0, 1fr) minmax(0, 1fr);
    grid-template-columns: minmax(0, 1fr);
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

const Controls = () => {
  const { dynamicBackground, expanded } = useFullScreenPlayerStore();
  const { setStore } = useFullScreenPlayerStoreActions();

  const handleToggleFullScreenPlayer = () => {
    setStore({ expanded: !expanded });
  };

  useHotkeys([['Escape', handleToggleFullScreenPlayer]]);

  return (
    <>
      <Group
        p="1rem"
        pos="absolute"
        spacing="sm"
        sx={{
          left: 0,
          top: 10,
        }}
      >
        <Button
          compact
          size="sm"
          tooltip={{ label: 'Minimize' }}
          variant="subtle"
          onClick={handleToggleFullScreenPlayer}
        >
          <RiArrowDownSLine size="2rem" />
        </Button>
        <Popover position="bottom-start">
          <Popover.Target>
            <Button
              compact
              size="sm"
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
    </>
  );
};

const containerVariants: Variants = {
  closed: (custom) => {
    const { windowBarStyle } = custom;
    return {
      height:
        windowBarStyle === Platform.WINDOWS || windowBarStyle === Platform.MACOS
          ? 'calc(100vh - 120px)'
          : 'calc(100vh - 90px)',
      position: 'absolute',
      top: '100vh',
      transition: {
        duration: 0.5,
        ease: 'easeInOut',
      },
      width: '100vw',
      y: -100,
    };
  },
  open: (custom) => {
    const { dynamicBackground, background, windowBarStyle } = custom;
    return {
      background: dynamicBackground ? background : 'var(--main-bg)',
      height:
        windowBarStyle === Platform.WINDOWS || windowBarStyle === Platform.MACOS
          ? 'calc(100vh - 120px)'
          : 'calc(100vh - 90px)',
      left: 0,
      position: 'absolute',
      top: 0,
      transition: {
        background: {
          duration: 0.5,
          ease: 'easeInOut',
        },
        delay: 0.1,
        duration: 0.5,
        ease: 'easeInOut',
      },
      width: '100vw',
      y: 0,
    };
  },
};

export const FullScreenPlayer = () => {
  const { dynamicBackground } = useFullScreenPlayerStore();
  const { setStore } = useFullScreenPlayerStoreActions();
  const { windowBarStyle } = useWindowSettings();

  const location = useLocation();
  const isOpenedRef = useRef<boolean | null>(null);

  useLayoutEffect(() => {
    if (isOpenedRef.current !== null) {
      setStore({ expanded: false });
    }

    isOpenedRef.current = true;
  }, [location, setStore]);

  const currentSong = useCurrentSong();
  const background = useFastAverageColor(currentSong?.imageUrl, true, 'dominant');

  return (
    <Container
      animate="open"
      custom={{ background, dynamicBackground, windowBarStyle }}
      exit="closed"
      initial="closed"
      variants={containerVariants}
    >
      <Controls />
      {dynamicBackground && <BackgroundImageOverlay />}
      <ResponsiveContainer>
        <FullScreenPlayerImage />
        <FullScreenPlayerQueue />
      </ResponsiveContainer>
    </Container>
  );
};
