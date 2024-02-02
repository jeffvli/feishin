import { useCallback, useEffect, useMemo, useState } from 'react';
import { Center, Group } from '@mantine/core';
import { AnimatePresence, motion } from 'framer-motion';
import { ErrorBoundary } from 'react-error-boundary';
import { RiInformationFill } from 'react-icons/ri';
import styled from 'styled-components';
import { useSongLyricsByRemoteId, useSongLyricsBySong } from './queries/lyric-query';
import { SynchronizedLyrics, SynchronizedLyricsProps } from './synchronized-lyrics';
import { Select, Spinner, TextTitle } from '/@/renderer/components';
import { ErrorFallback } from '/@/renderer/features/action-required';
import {
    UnsynchronizedLyrics,
    UnsynchronizedLyricsProps,
} from '/@/renderer/features/lyrics/unsynchronized-lyrics';
import { useCurrentSong, usePlayerStore } from '/@/renderer/store';
import { FullLyricsMetadata, LyricSource, LyricsOverride } from '/@/renderer/api/types';
import { LyricsActions } from '/@/renderer/features/lyrics/lyrics-actions';
import { queryKeys } from '/@/renderer/api/query-keys';
import { queryClient } from '/@/renderer/lib/react-query';

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
        rgb(0 0 0 / 100%) 20%,
        rgb(0 0 0 / 100%) 85%,
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

export const Lyrics = () => {
    const currentSong = useCurrentSong();
    const [index, setIndex] = useState(0);

    const { data, isInitialLoading } = useSongLyricsBySong(
        {
            query: { songId: currentSong?.id || '' },
            serverId: currentSong?.serverId || '',
        },
        currentSong,
    );

    const [override, setOverride] = useState<LyricsOverride | undefined>(undefined);

    const handleOnSearchOverride = useCallback((params: LyricsOverride) => {
        setOverride(params);
    }, []);

    const handleOnResetLyric = useCallback(() => {
        queryClient.invalidateQueries({
            exact: true,
            queryKey: queryKeys.songs.lyrics(currentSong?.serverId, { songId: currentSong?.id }),
        });
    }, [currentSong?.id, currentSong?.serverId]);

    const handleOnRemoveLyric = useCallback(() => {
        queryClient.setQueryData(
            queryKeys.songs.lyrics(currentSong?.serverId, { songId: currentSong?.id }),
            (prev: FullLyricsMetadata | undefined) => {
                if (!prev) {
                    return undefined;
                }

                return {
                    ...prev,
                    lyrics: '',
                };
            },
        );
    }, [currentSong?.id, currentSong?.serverId]);

    const { isInitialLoading: isOverrideLoading } = useSongLyricsByRemoteId({
        options: {
            enabled: !!override,
        },
        query: {
            remoteSongId: override?.id,
            remoteSource: override?.source as LyricSource | undefined,
            song: currentSong,
        },
        serverId: currentSong?.serverId,
    });

    useEffect(() => {
        const unsubSongChange = usePlayerStore.subscribe(
            (state) => state.current.song,
            () => {
                setOverride(undefined);
                setIndex(0);
            },
            { equalityFn: (a, b) => a?.id === b?.id },
        );

        return () => {
            unsubSongChange();
        };
    }, []);

    const [lyrics, synced] = useMemo(() => {
        if (Array.isArray(data)) {
            if (data.length > 0) {
                const selectedLyric = data[Math.min(index, data.length)];
                return [selectedLyric, selectedLyric.synced];
            }
        } else if (data?.lyrics) {
            return [data, Array.isArray(data.lyrics)];
        }

        return [undefined, false];
    }, [data, index]);

    const languages = useMemo(() => {
        if (Array.isArray(data)) {
            return data.map((lyric, idx) => ({ label: lyric.lang, value: idx.toString() }));
        }
        return [];
    }, [data]);

    const isLoadingLyrics = isInitialLoading || isOverrideLoading;

    const hasNoLyrics = !lyrics;

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
                                {synced ? (
                                    <SynchronizedLyrics {...(lyrics as SynchronizedLyricsProps)} />
                                ) : (
                                    <UnsynchronizedLyrics
                                        {...(lyrics as UnsynchronizedLyricsProps)}
                                    />
                                )}
                            </ScrollContainer>
                        )}
                    </AnimatePresence>
                )}
                <ActionsContainer>
                    {languages.length > 1 && (
                        <Select
                            clearable={false}
                            data={languages}
                            style={{ bottom: 50, position: 'absolute' }}
                            value={index.toString()}
                            onChange={(value) => setIndex(parseInt(value!, 10))}
                        />
                    )}

                    <LyricsActions
                        onRemoveLyric={handleOnRemoveLyric}
                        onResetLyric={handleOnResetLyric}
                        onSearchOverride={handleOnSearchOverride}
                    />
                </ActionsContainer>
            </LyricsContainer>
        </ErrorBoundary>
    );
};
