import { useLayoutEffect, useRef } from 'react';
import { Box, Center, Flex, Grid, Group, MediaQuery, Stack } from '@mantine/core';
import { useResizeObserver } from '@mantine/hooks';
import { Variants, motion, AnimatePresence } from 'framer-motion';
import { HiOutlineQueueList } from 'react-icons/hi2';
import {
  RiArrowDownSLine,
  RiFileMusicLine,
  RiFileTextLine,
  RiInformationFill,
  RiSettings3Line,
} from 'react-icons/ri';
import { useLocation } from 'react-router';
import styled from 'styled-components';
import {
  Button,
  DropdownMenu,
  Switch,
  TableConfigDropdown,
  Text,
  TextTitle,
} from '/@/renderer/components';
import {
  useAppStoreActions,
  useCurrentSong,
  useFullScreenPlayer,
  useFullScreenPlayerStore,
  useFullScreenPlayerStoreActions,
} from '/@/renderer/store';
import { useFastAverageColor } from '../../../hooks/use-fast-average-color';
import { PlayQueue } from '/@/renderer/features/now-playing';
import { useContainerQuery } from '/@/renderer/hooks';

const FullScreenPlayerContainer = styled(motion.div)`
  z-index: 100;
  display: flex;
  justify-content: center;
  padding: 2rem;
`;

const QueueContainer = styled.div`
  display: flex;
  height: 100%;

  .ag-theme-alpine-dark {
    --ag-header-background-color: rgba(0, 0, 0, 0%) !important;
    --ag-background-color: rgba(0, 0, 0, 0%) !important;
    --ag-odd-row-background-color: rgba(0, 0, 0, 0%) !important;
  }

  .ag-header {
    display: none !important;
  }
`;

const Image = styled(motion.img)`
  object-fit: cover;
  border-radius: 5px;
  box-shadow: 2px 2px 10px 2px rgba(0, 0, 0, 40%);
  transition: box-shadow 0.2s ease-in-out;
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

const ActiveTabIndicator = styled(motion.div)`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--main-fg);
`;

export const FullScreenPlayer = () => {
  const { setFullScreenPlayer } = useAppStoreActions();
  const { dynamicBackground, activeTab } = useFullScreenPlayerStore();
  const { setStore } = useFullScreenPlayerStoreActions();
  const fullScreenPlayer = useFullScreenPlayer();
  const handleToggleFullScreenPlayer = () => {
    setFullScreenPlayer({ expanded: !fullScreenPlayer.expanded });
  };

  const location = useLocation();
  const isOpenedRef = useRef<boolean | null>(null);

  useLayoutEffect(() => {
    if (isOpenedRef.current !== null) {
      setFullScreenPlayer({ expanded: false });
    }

    isOpenedRef.current = true;
  }, [location, setFullScreenPlayer]);

  const currentSong = useCurrentSong();
  const scaledImageUrl = currentSong?.imageUrl
    ?.replace(/&size=\d+/, '&size=800')
    .replace(/\?width=\d+/, '?width=800')
    .replace(/&height=\d+/, '&height=800');

  const background = useFastAverageColor(currentSong?.imageUrl, true, 'dominant');
  const imageKey = `image-${background}`;

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

  const imageVariants: Variants = {
    closed: {},
    open: {
      opacity: 1,
      transition: {
        duration: 1,
        ease: 'easeInOut',
      },
    },
  };

  const headerItems = [
    {
      active: activeTab === 'queue',
      icon: <RiFileMusicLine size="1.5rem" />,
      label: 'Up Next',
      onClick: () => setStore({ activeTab: 'queue' }),
    },
    {
      active: activeTab === 'related',
      icon: <HiOutlineQueueList size="1.5rem" />,
      label: 'Related',
      onClick: () => setStore({ activeTab: 'related' }),
    },
    {
      active: activeTab === 'lyrics',
      icon: <RiFileTextLine size="1.5rem" />,
      label: 'Lyrics',
      onClick: () => setStore({ activeTab: 'lyrics' }),
    },
  ];

  const cq = useContainerQuery({ md: 960 });
  const [resizeRef, rect] = useResizeObserver();

  return (
    <FullScreenPlayerContainer
      ref={cq.ref}
      animate="open"
      exit="closed"
      initial="closed"
      variants={containerVariants}
    >
      <BackgroundImageOverlay />
      <Flex
        direction="column"
        h="100%"
        justify="center"
        maw="2560px"
        w="100%"
      >
        <Group>
          <Button
            tooltip={{ label: 'Minimize' }}
            variant="subtle"
            onClick={handleToggleFullScreenPlayer}
          >
            <RiArrowDownSLine size="2rem" />
          </Button>
          <DropdownMenu position="bottom-start">
            <DropdownMenu.Target>
              <Button
                tooltip={{ label: 'Configure' }}
                variant="subtle"
              >
                <RiSettings3Line size="1.5rem" />
              </Button>
            </DropdownMenu.Target>
            <DropdownMenu.Dropdown>
              <DropdownMenu.Item closeMenuOnClick={false}>
                <Switch
                  defaultChecked={dynamicBackground}
                  label="Dynamic background"
                  onChange={(e) =>
                    setStore({
                      dynamicBackground: e.target.checked,
                    })
                  }
                />
              </DropdownMenu.Item>
              <TableConfigDropdown type="fullScreen" />
            </DropdownMenu.Dropdown>
          </DropdownMenu>
        </Group>
        {cq.isMd ? (
          <>
            <Grid
              h="100%"
              p="3rem"
            >
              <Grid.Col
                ref={resizeRef}
                span={6}
              >
                <Flex
                  align="center"
                  h="100%"
                  justify="center"
                  sx={{
                    img: {
                      maxHeight: '100%',
                      maxWidth: '100%',
                      minHeight: '300px',
                    },
                  }}
                >
                  <Stack>
                    <AnimatePresence
                      initial={false}
                      mode="wait"
                    >
                      <Image
                        key={imageKey}
                        animate="open"
                        exit="closed"
                        height={rect?.width * 0.8}
                        initial="closed"
                        src={scaledImageUrl}
                        variants={imageVariants}
                        width={rect?.width * 0.8}
                      />
                    </AnimatePresence>
                  </Stack>
                </Flex>
              </Grid.Col>
              <Grid.Col span={6}>
                <Stack h="100%">
                  <Group
                    grow
                    align="center"
                    position="center"
                  >
                    {headerItems.map((item) => (
                      <Box pos="relative">
                        <Button
                          fullWidth
                          uppercase
                          fw="600"
                          pos="relative"
                          size="lg"
                          sx={{
                            alignItems: 'center',
                            color: item.active
                              ? 'var(--main-fg) !important'
                              : 'var(--main-fg-secondary) !important',
                            letterSpacing: '1px',
                          }}
                          variant="subtle"
                          onClick={item.onClick}
                        >
                          {item.label}
                        </Button>
                        {item.active ? <ActiveTabIndicator layoutId="underline" /> : null}
                      </Box>
                    ))}
                  </Group>
                  {activeTab === 'queue' ? (
                    <QueueContainer>
                      <PlayQueue type="fullScreen" />
                    </QueueContainer>
                  ) : activeTab === 'related' ? (
                    <Center>
                      <Group>
                        <RiInformationFill size="2rem" />
                        <TextTitle
                          order={3}
                          weight={700}
                        >
                          COMING SOON
                        </TextTitle>
                      </Group>
                    </Center>
                  ) : activeTab === 'lyrics' ? (
                    <Center>
                      <Group>
                        <RiInformationFill size="2rem" />
                        <TextTitle
                          order={3}
                          weight={700}
                        >
                          COMING SOON
                        </TextTitle>
                      </Group>
                    </Center>
                  ) : null}
                </Stack>
              </Grid.Col>
            </Grid>
          </>
        ) : (
          <></>
        )}
      </Flex>
    </FullScreenPlayerContainer>
  );
};
