import { Group, Center } from '@mantine/core';
import { motion } from 'framer-motion';
import { HiOutlineQueueList } from 'react-icons/hi2';
import { RiFileMusicLine, RiFileTextLine, RiInformationFill } from 'react-icons/ri';
import styled from 'styled-components';
import { Button, TextTitle } from '/@/renderer/components';
import { PlayQueue } from '/@/renderer/features/now-playing';
import {
  useFullScreenPlayerStore,
  useFullScreenPlayerStoreActions,
} from '/@/renderer/store/full-screen-player.store';
import { Lyrics } from '/@/renderer/features/lyrics/lyrics';

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

const ActiveTabIndicator = styled(motion.div)`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--main-fg);
`;

const HeaderItemWrapper = styled.div`
  position: relative;
  z-index: 2;
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  grid-template-columns: 1fr;
`;

export const FullScreenPlayerQueue = () => {
  const { activeTab } = useFullScreenPlayerStore();
  const { setStore } = useFullScreenPlayerStoreActions();

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

  return (
    <GridContainer className="full-screen-player-queue-container">
      <Group
        grow
        align="center"
        position="center"
      >
        {headerItems.map((item) => (
          <HeaderItemWrapper key={`tab-${item.label}`}>
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
          </HeaderItemWrapper>
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
        <Lyrics />
      ) : null}
    </GridContainer>
  );
};
