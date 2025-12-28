import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './lyrics.module.css';

import { queryKeys } from '/@/renderer/api/query-keys';
import { translateLyrics } from '/@/renderer/features/lyrics/api/lyric-translate';
import { lyricsQueries } from '/@/renderer/features/lyrics/api/lyrics-api';
import { openLyricsExportModal } from '/@/renderer/features/lyrics/components/lyrics-export-form';
import { LyricsActions } from '/@/renderer/features/lyrics/lyrics-actions';
import {
    SynchronizedLyrics,
    SynchronizedLyricsProps,
} from '/@/renderer/features/lyrics/synchronized-lyrics';
import {
    UnsynchronizedLyrics,
    UnsynchronizedLyricsProps,
} from '/@/renderer/features/lyrics/unsynchronized-lyrics';
import { openLyricsSettingsModal } from '/@/renderer/features/lyrics/utils/open-lyrics-settings-modal';
import { usePlayerEvents } from '/@/renderer/features/player/audio-player/hooks/use-player-events';
import { ComponentErrorBoundary } from '/@/renderer/features/shared/components/component-error-boundary';
import { queryClient } from '/@/renderer/lib/react-query';
import { useLyricsSettings, usePlayerSong } from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Center } from '/@/shared/components/center/center';
import { Group } from '/@/shared/components/group/group';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Text } from '/@/shared/components/text/text';
import {
    FullLyricsMetadata,
    LyricSource,
    LyricsOverride,
    StructuredLyric,
} from '/@/shared/types/domain-types';

type LyricsProps = {
    fadeOutNoLyricsMessage?: boolean;
    settingsKey?: string;
};

export const Lyrics = ({ fadeOutNoLyricsMessage = true, settingsKey = 'default' }: LyricsProps) => {
    const currentSong = usePlayerSong();
    const {
        enableAutoTranslation,
        translationApiKey,
        translationApiProvider,
        translationTargetLanguage,
    } = useLyricsSettings();
    const { t } = useTranslation();
    const [index, setIndex] = useState(0);
    const [translatedLyrics, setTranslatedLyrics] = useState<null | string>(null);
    const [showTranslation, setShowTranslation] = useState(false);

    const { data, isInitialLoading } = useQuery(
        lyricsQueries.songLyrics(
            {
                query: { songId: currentSong?.id || '' },
                serverId: currentSong?._serverId || '',
            },
            currentSong,
        ),
    );

    const [override, setOverride] = useState<LyricsOverride | undefined>(undefined);

    const { data: overrideData, isInitialLoading: isOverrideLoading } = useQuery(
        lyricsQueries.songLyricsByRemoteId({
            options: {
                enabled: !!override,
            },
            query: {
                remoteSongId: override?.id,
                remoteSource: override?.source as LyricSource | undefined,
                song: currentSong,
            },
            serverId: currentSong?._serverId || '',
        }),
    );

    // Get the current song's offset from persisted lyrics, default to 0
    const currentOffsetMs = useMemo(() => {
        if (Array.isArray(data)) {
            if (data.length > 0) {
                const selectedLyric = data[Math.min(index, data.length - 1)];
                return selectedLyric.offsetMs ?? 0;
            }
        } else if (data?.offsetMs !== undefined) {
            return data.offsetMs;
        }
        return 0;
    }, [data, index]);

    const [lyrics, synced] = useMemo(() => {
        // If override data is available, use it
        if (override && overrideData) {
            const overrideLyrics: FullLyricsMetadata = {
                artist: override.artist,
                lyrics: overrideData,
                name: override.name,
                offsetMs: currentOffsetMs,
                remote: override.remote ?? true,
                source: override.source,
            };
            return [overrideLyrics, Array.isArray(overrideData)];
        }

        // Otherwise, use the regular data
        if (Array.isArray(data)) {
            if (data.length > 0) {
                const selectedLyric = data[Math.min(index, data.length - 1)];
                return [selectedLyric, selectedLyric.synced];
            }
        } else if (data?.lyrics) {
            return [data, Array.isArray(data.lyrics)];
        }

        return [undefined, false];
    }, [data, index, override, overrideData, currentOffsetMs]);

    const handleOnSearchOverride = useCallback((params: LyricsOverride) => {
        setOverride(params);
    }, []);

    // Persist override lyrics to cache with current offset
    useEffect(() => {
        if (override && overrideData && currentSong) {
            const persistedLyrics: FullLyricsMetadata = {
                artist: override.artist,
                lyrics: overrideData,
                name: override.name,
                offsetMs: currentOffsetMs,
                remote: override.remote ?? true,
                source: override.source,
            };

            queryClient.setQueryData(
                queryKeys.songs.lyrics(currentSong._serverId, { songId: currentSong.id }),
                persistedLyrics,
            );
        }
    }, [override, overrideData, currentSong, currentOffsetMs]);

    // Callback to update the song's persisted offset
    const handleUpdateOffset = useCallback(
        (offsetMs: number) => {
            if (!currentSong) return;

            queryClient.setQueryData(
                queryKeys.songs.lyrics(currentSong._serverId, { songId: currentSong.id }),
                (prev: FullLyricsMetadata | null | StructuredLyric[] | undefined) => {
                    if (!prev) return prev;

                    // Handle array of structured lyrics
                    if (Array.isArray(prev)) {
                        if (prev.length > 0) {
                            const selectedIndex = Math.min(index, prev.length - 1);
                            const updated = [...prev];
                            updated[selectedIndex] = {
                                ...updated[selectedIndex],
                                offsetMs,
                            };
                            return updated;
                        }
                        return prev;
                    }

                    // Handle single lyrics object
                    return {
                        ...prev,
                        offsetMs,
                    };
                },
            );
        },
        [currentSong, index],
    );

    // const handleOnResetLyric = useCallback(() => {
    //     setOverride(undefined);
    //     queryClient.invalidateQueries({
    //         exact: true,
    //         queryKey: queryKeys.songs.lyrics(currentSong?._serverId, { songId: currentSong?.id }),
    //     });
    // }, [currentSong?.id, currentSong?._serverId]);

    const handleOnRemoveLyric = useCallback(() => {
        setOverride(undefined);

        // Clear the main lyrics query cache
        queryClient.setQueryData(
            queryKeys.songs.lyrics(currentSong?._serverId, { songId: currentSong?.id }),
            (prev: FullLyricsMetadata | StructuredLyric[] | undefined) => {
                if (!prev) {
                    return undefined;
                }

                if (Array.isArray(prev)) {
                    return undefined;
                }

                return {
                    ...prev,
                    lyrics: '',
                };
            },
        );

        // Clear the override query cache if it exists
        if (override) {
            queryClient.removeQueries({
                queryKey: queryKeys.songs.lyricsByRemoteId({
                    remoteSongId: override.id,
                    remoteSource: override.source,
                }),
            });
        }
    }, [currentSong?.id, currentSong?._serverId, override]);

    const fetchTranslation = useCallback(async () => {
        if (!lyrics) return;
        const originalLyrics = Array.isArray(lyrics.lyrics)
            ? lyrics.lyrics.map(([, line]) => line).join('\n')
            : lyrics.lyrics;
        const TranslatedText: null | string = await translateLyrics(
            originalLyrics,
            translationApiKey,
            translationApiProvider,
            translationTargetLanguage,
        );
        setTranslatedLyrics(TranslatedText);
        setShowTranslation(true);
    }, [lyrics, translationApiKey, translationApiProvider, translationTargetLanguage]);

    const handleOnTranslateLyric = useCallback(async () => {
        if (translatedLyrics) {
            setShowTranslation(!showTranslation);
            return;
        }
        await fetchTranslation();
    }, [translatedLyrics, showTranslation, fetchTranslation]);

    usePlayerEvents(
        {
            onCurrentSongChange: () => {
                setOverride(undefined);
                setIndex(0);
                setShowTranslation(false);
                setTranslatedLyrics(null);
            },
        },
        [],
    );

    useEffect(() => {
        if (lyrics && !translatedLyrics && enableAutoTranslation) {
            fetchTranslation();
        }
    }, [lyrics, translatedLyrics, enableAutoTranslation, fetchTranslation]);

    const languages = useMemo(() => {
        if (Array.isArray(data)) {
            return data.map((lyric, idx) => ({ label: lyric.lang, value: idx.toString() }));
        } else if (data?.lyrics) {
            // xxx denotes undefined lyrics language. If it's a single lyric (from a remote source)
            // the language is most likely not available, so leave it undefined
            return [{ label: 'xxx', value: '0' }];
        }
        return [];
    }, [data]);

    const isLoadingLyrics = isInitialLoading || isOverrideLoading;

    const hasNoLyrics = !lyrics;
    const [shouldFadeOut, setShouldFadeOut] = useState(false);

    // Trigger fade out after a few seconds when no lyrics are found
    useEffect(() => {
        if (!fadeOutNoLyricsMessage) {
            setShouldFadeOut(false);
            return undefined;
        }

        if (!isLoadingLyrics && hasNoLyrics) {
            // Start fade out after 3 seconds (message visible for 3s, then 0.5s fade)
            const timer = setTimeout(() => {
                setShouldFadeOut(true);
            }, 3000);

            return () => clearTimeout(timer);
        }

        if (!hasNoLyrics) {
            setShouldFadeOut(false);
        }

        return undefined;
    }, [isLoadingLyrics, hasNoLyrics, fadeOutNoLyricsMessage]);

    const handleExportLyrics = useCallback(() => {
        if (lyrics) {
            openLyricsExportModal({ lyrics, offsetMs: currentOffsetMs, synced });
        }
    }, [currentOffsetMs, lyrics, synced]);

    const handleOpenSettings = () => {
        openLyricsSettingsModal(settingsKey);
    };

    return (
        <ComponentErrorBoundary>
            <div className={styles.lyricsContainer}>
                <ActionIcon
                    className={styles.settingsIcon}
                    icon="settings2"
                    iconProps={{ size: 'lg' }}
                    onClick={handleOpenSettings}
                    pos="absolute"
                    right={0}
                    top={0}
                    variant="subtle"
                />
                {isLoadingLyrics ? (
                    <Spinner container />
                ) : (
                    <AnimatePresence mode="sync">
                        {hasNoLyrics ? (
                            <Center w="100%">
                                <motion.div
                                    animate={{ opacity: shouldFadeOut ? 0 : 1 }}
                                    initial={{ opacity: 1 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <Group>
                                        <Text fw={500} isMuted isNoSelect>
                                            {t('page.fullscreenPlayer.noLyrics', {
                                                postProcess: 'sentenceCase',
                                            })}
                                        </Text>
                                    </Group>
                                </motion.div>
                            </Center>
                        ) : (
                            <motion.div
                                animate={{ opacity: 1 }}
                                className={styles.scrollContainer}
                                initial={{ opacity: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                {synced ? (
                                    <SynchronizedLyrics
                                        {...(lyrics as SynchronizedLyricsProps)}
                                        offsetMs={currentOffsetMs}
                                        settingsKey={settingsKey}
                                        translatedLyrics={showTranslation ? translatedLyrics : null}
                                    />
                                ) : (
                                    <UnsynchronizedLyrics
                                        {...(lyrics as UnsynchronizedLyricsProps)}
                                        settingsKey={settingsKey}
                                        translatedLyrics={showTranslation ? translatedLyrics : null}
                                    />
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
                <div className={styles.actionsContainer}>
                    <LyricsActions
                        index={index}
                        languages={languages}
                        offsetMs={currentOffsetMs}
                        onExportLyrics={handleExportLyrics}
                        onRemoveLyric={handleOnRemoveLyric}
                        onSearchOverride={handleOnSearchOverride}
                        onTranslateLyric={
                            translationApiProvider && translationApiKey
                                ? handleOnTranslateLyric
                                : undefined
                        }
                        onUpdateOffset={handleUpdateOffset}
                        setIndex={setIndex}
                        settingsKey={settingsKey}
                    />
                </div>
            </div>
        </ComponentErrorBoundary>
    );
};
