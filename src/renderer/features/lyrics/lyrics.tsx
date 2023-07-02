import { useCallback, useEffect, useState } from 'react';
import { Center, Group } from '@mantine/core';
import { AnimatePresence, motion } from 'framer-motion';
import { ErrorBoundary } from 'react-error-boundary';
import { RiInformationFill } from 'react-icons/ri';
import styled from 'styled-components';
import { useSongLyricsByRemoteId, useSongLyricsBySong } from './queries/lyric-query';
import { SynchronizedLyrics } from './synchronized-lyrics';
import { Spinner, TextTitle } from '/@/renderer/components';
import { ErrorFallback } from '/@/renderer/features/action-required';
import { UnsynchronizedLyrics } from '/@/renderer/features/lyrics/unsynchronized-lyrics';
import { getServerById, useCurrentSong, usePlayerStore } from '/@/renderer/store';
import {
    FullLyricsMetadata,
    LyricsOverride,
    SynchronizedLyricMetadata,
    UnsynchronizedLyricMetadata,
} from '/@/renderer/api/types';
import { LyricsActions } from '/@/renderer/features/lyrics/lyrics-actions';

const ActionsContainer = styled.div`
    position: absolute;
    bottom: 0;
    left: 0;
    z-index: 50;
    display: flex;
    gap: 0.5rem;
    align-items: center;
    justify-content: center;
    width: 100%;
    opacity: 0;
    transition: opacity 0.2s ease-in-out;

    &:hover {
        opacity: 1 !important;
    }

    &:focus-within {
        opacity: 1 !important;
    }
`;

const LyricsContainer = styled.div`
    position: relative;
    display: flex;
    width: 100%;
    height: 100%;

    &:hover {
        ${ActionsContainer} {
            opacity: 0.6;
        }
    }
`;

const ScrollContainer = styled(motion.div)`
    position: relative;
    z-index: 1;
    width: 100%;
    height: 100%;
    text-align: center;

    mask-image: linear-gradient(
        180deg,
        transparent 5%,
        rgba(0, 0, 0, 100%) 20%,
        rgba(0, 0, 0, 100%) 85%,
        transparent 95%
    );

    &.mantine-ScrollArea-root {
        width: 100%;
        height: 100%;
    }

    & .mantine-ScrollArea-viewport {
        height: 100% !important;
    }

    & .mantine-ScrollArea-viewport > div {
        height: 100%;
    }
`;

function isSynchronized(
    data: Partial<FullLyricsMetadata> | undefined,
): data is SynchronizedLyricMetadata {
    // Type magic. The only difference between Synchronized and Unsynchhronized is
    // the datatype of lyrics. This makes Typescript happier later...
    if (!data) return false;
    return Array.isArray(data.lyrics);
}

export const Lyrics = () => {
    const currentSong = useCurrentSong();
    const currentServer = getServerById(currentSong?.serverId);

    const [clear, setClear] = useState(false);

    const { data, isInitialLoading } = useSongLyricsBySong(
        {
            query: { songId: currentSong?.id || '' },
            serverId: currentServer?.id,
        },
        currentSong,
    );

    const [override, setOverride] = useState<LyricsOverride | undefined>(undefined);

    const handleOnSearchOverride = useCallback((params: LyricsOverride) => {
        setOverride(params);
        setClear(false);
    }, []);

    const { data: overrideLyrics, isInitialLoading: isOverrideLoading } = useSongLyricsByRemoteId({
        options: {
            enabled: !!override,
        },
        query: {
            remoteSongId: override?.id,
            remoteSource: override?.source,
        },
        serverId: currentServer?.id,
    });

    useEffect(() => {
        const unsubSongChange = usePlayerStore.subscribe(
            (state) => state.current.song,
            () => {
                setOverride(undefined);
                setClear(false);
            },
            { equalityFn: (a, b) => a?.id === b?.id },
        );

        return () => {
            unsubSongChange();
        };
    }, []);

    const isLoadingLyrics = isInitialLoading || isOverrideLoading;

    const hasNoLyrics = (!data?.lyrics && !overrideLyrics) || clear;

    const lyricsMetadata:
        | Partial<SynchronizedLyricMetadata>
        | Partial<UnsynchronizedLyricMetadata>
        | undefined = overrideLyrics
        ? {
              artist: override?.artist,
              lyrics: overrideLyrics,
              name: override?.name,
              remote: true,
              source: override?.source,
          }
        : data;

    const isSynchronizedLyrics = isSynchronized(lyricsMetadata);

    return (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
            <LyricsContainer>
                {isLoadingLyrics ? (
                    <Spinner
                        container
                        size={25}
                    />
                ) : (
                    <AnimatePresence mode="sync">
                        {hasNoLyrics ? (
                            <Center w="100%">
                                <Group>
                                    <RiInformationFill size="2rem" />
                                    <TextTitle
                                        order={3}
                                        weight={700}
                                    >
                                        No lyrics found
                                    </TextTitle>
                                </Group>
                            </Center>
                        ) : (
                            <ScrollContainer
                                animate={{ opacity: 1 }}
                                initial={{ opacity: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                {isSynchronizedLyrics ? (
                                    <SynchronizedLyrics {...lyricsMetadata} />
                                ) : (
                                    <UnsynchronizedLyrics
                                        {...(lyricsMetadata as UnsynchronizedLyricMetadata)}
                                    />
                                )}
                            </ScrollContainer>
                        )}
                    </AnimatePresence>
                )}
                <ActionsContainer>
                    <LyricsActions
                        onRemoveLyric={() => setClear(true)}
                        onSearchOverride={handleOnSearchOverride}
                    />
                </ActionsContainer>
            </LyricsContainer>
        </ErrorBoundary>
    );
};
