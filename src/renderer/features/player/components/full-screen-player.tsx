import { useLayoutEffect, useMemo, useRef } from 'react';
import { Box, Center, Flex, Grid, Group, Stack } from '@mantine/core';
import { useHotkeys, useResizeObserver } from '@mantine/hooks';
import { Variants, motion, AnimatePresence } from 'framer-motion';
import { HiOutlineQueueList } from 'react-icons/hi2';
import {
  RiArrowDownSLine,
  RiFileMusicLine,
  RiFileTextLine,
  RiInformationFill,
  RiSettings3Line,
} from 'react-icons/ri';
import { useLocation, generatePath } from 'react-router';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import {
  Badge,
  Button,
  Option,
  Popover,
  Switch,
  TableConfigDropdown,
  Text,
  TextTitle,
} from '/@/renderer/components';
import {
  useCurrentSong,
  useFullScreenPlayerStore,
  useFullScreenPlayerStoreActions,
} from '/@/renderer/store';
import { useFastAverageColor } from '../../../hooks/use-fast-average-color';
import { PlayQueue } from '/@/renderer/features/now-playing';
import { useContainerQuery } from '/@/renderer/hooks';
import { AppRoute } from '/@/renderer/router/routes';

const FullScreenPlayerContainer = styled(motion.div)`
  z-index: 100;
  display: flex;
  justify-content: center;
  padding: 2rem;
`;

const QueueContainer = styled.div`
  position: relative;
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
  const { dynamicBackground, activeTab, expanded } = useFullScreenPlayerStore();
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

  const size = useMemo(() => {
    const width = rect?.width * (cq.isMd ? 0.7 : 0.5);
    const height = rect?.height * (cq.isMd ? 0.7 : 0.5);

    const min = Math.min(width, height);
    return min;
  }, [cq.isMd, rect?.height, rect?.width]);

  return (
    <FullScreenPlayerContainer
      ref={cq.ref}
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
      <Flex
        direction="column"
        h="100%"
        justify="center"
        maw="2560px"
        w="100%"
      >
        <>
          <Grid
            h="100%"
            p="3rem"
          >
            <Grid.Col
              ref={resizeRef}
              md={6}
              sm={12}
            >
              <Flex
                align="center"
                h="100%"
                justify="center"
                sx={{
                  img: {
                    maxHeight: '100%',
                    maxWidth: '100%',
                  },
                }}
              >
                <Stack
                  maw={`${size}px`}
                  spacing="sm"
                >
                  <AnimatePresence
                    initial={false}
                    mode="wait"
                  >
                    <Image
                      key={imageKey}
                      animate="open"
                      draggable={false}
                      exit="closed"
                      height={size}
                      initial="closed"
                      src={scaledImageUrl}
                      variants={imageVariants}
                      width={size}
                    />
                  </AnimatePresence>
                  <TextTitle
                    align="center"
                    order={1}
                    overflow="hidden"
                    w="100%"
                    weight={900}
                  >
                    {currentSong?.name}
                  </TextTitle>
                  <TextTitle
                    $link
                    align="center"
                    component={Link}
                    order={2}
                    overflow="hidden"
                    to={generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, {
                      albumId: currentSong?.albumId || '',
                    })}
                    w="100%"
                    weight={600}
                  >
                    {currentSong?.album}{' '}
                  </TextTitle>
                  {currentSong?.artists?.map((artist, index) => (
                    <TextTitle
                      key={`fs-artist-${artist.id}`}
                      align="center"
                      order={4}
                    >
                      {index > 0 && (
                        <Text
                          sx={{
                            display: 'inline-block',
                            padding: '0 0.5rem',
                          }}
                        >
                          •
                        </Text>
                      )}
                      <Text
                        $link
                        component={Link}
                        to={generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL, {
                          albumArtistId: artist.id,
                        })}
                        weight={600}
                      >
                        {artist.name}
                      </Text>
                    </TextTitle>
                  ))}
                  <Group position="center">
                    {currentSong?.container && (
                      <Badge size="lg">
                        {currentSong?.container} {currentSong?.bitRate}
                      </Badge>
                    )}
                    {currentSong?.releaseYear && (
                      <Badge size="lg">{currentSong?.releaseYear}</Badge>
                    )}
                  </Group>
                </Stack>
              </Flex>
            </Grid.Col>
            <Grid.Col
              md={6}
              sm={12}
            >
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
      </Flex>
    </FullScreenPlayerContainer>
  );
};
