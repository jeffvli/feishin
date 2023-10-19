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
import { Visualizer } from '/@/renderer/features/player/components/visualizer';
import { useMemo } from 'react';
import { usePlaybackSettings } from '/@/renderer/store';
import { PlaybackType } from '/@/renderer/types';

const QueueContainer = styled.div`
    position: relative;
    display: flex;
    height: 100%;

    .ag-theme-alpine-dark {
        --ag-header-background-color: rgb(0 0 0 / 0%) !important;
        --ag-background-color: rgb(0 0 0 / 0%) !important;
        --ag-odd-row-background-color: rgb(0 0 0 / 0%) !important;
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

interface TransparendGridContainerProps {
    opacity: number;
}

const GridContainer = styled.div<TransparendGridContainerProps>`
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    grid-template-columns: 1fr;
    padding: 1rem;
    background: rgb(var(--main-bg-transparent), ${({ opacity }) => opacity}%);
    border-radius: 5px;
`;

export const FullScreenPlayerQueue = () => {
    const { activeTab, opacity } = useFullScreenPlayerStore();
    const { setStore } = useFullScreenPlayerStoreActions();
    const { type } = usePlaybackSettings();

    const headerItems = useMemo(() => {
        const items = [
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

        if (type === PlaybackType.WEB) {
            items.push({
                active: activeTab === 'visualizer',
                icon: <RiFileTextLine size="1.5rem" />,
                label: 'Visualizer',
                onClick: () => setStore({ activeTab: 'visualizer' }),
            });
        }

        return items;
    }, [activeTab, setStore, type]);

    return (
        <GridContainer
            className="full-screen-player-queue-container"
            opacity={opacity}
        >
            <Group
                grow
                align="center"
                className="full-screen-player-queue-header"
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
            ) : activeTab === 'visualizer' && type === PlaybackType.WEB ? (
                <Visualizer />
            ) : null}
        </GridContainer>
    );
};
