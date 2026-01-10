import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useLyricsSettings, usePlayerSong, useSettingsStore } from '/@/renderer/store';
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
        preferLocalLyrics,
        translationApiKey,
        translationApiProvider,
        translationTargetLanguage,
    } = useLyricsSettings();
    const { t } = useTranslation();
    const [index, setIndex] = useState(0);
    const [translatedLyrics, setTranslatedLyrics] = useState<null | string>(null);
    const [showTranslation, setShowTranslation] = useState(false);
    const [pendingSongId, setPendingSongId] = useState<string | undefined>(currentSong?.id);
    const lyricsFetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const previousSongIdRef = useRef<string | undefined>(currentSong?.id);

    // Use a timeout to prevent fetching lyrics when switching songs quickly
    useEffect(() => {
        const currentSongId = currentSong?.id;
        const previousSongId = previousSongIdRef.current;

        if (currentSongId === previousSongId) {
            return;
        }

        previousSongIdRef.current = currentSongId;

        setPendingSongId(undefined);

        if (!currentSongId) {
            return;
        }

        clearTimeout(lyricsFetchTimeoutRef.current);

        lyricsFetchTimeoutRef.current = setTimeout(() => {
            setPendingSongId(currentSongId);
        }, 500);

        return () => {
            clearTimeout(lyricsFetchTimeoutRef.current);
        };
    }, [currentSong?.id]);

    const { data, isInitialLoading } = useQuery(
        lyricsQueries.songLyrics(
            {
                options: {
                    enabled: !!pendingSongId && pendingSongId === currentSong?.id,
                },
                query: { songId: currentSong?.id || '' },
                serverId: currentSong?._serverId || '',
            },
            currentSong,
        ),
    );

    const [override, setOverride] = useState<LyricsOverride | undefined>(undefined);
    const [autoRemoteLyrics, setAutoRemoteLyrics] = useState<FullLyricsMetadata | null>(null);
    const clearedOverrideRef = useRef<string | undefined>(undefined);

    // Fetch remote lyrics automatically (but not if we've explicitly cleared the override)
    const { data: remoteLyricsData, isInitialLoading: isRemoteLyricsLoading } = useQuery(
        lyricsQueries.remoteLyrics(
            {
                options: {
                    enabled:
                        !!pendingSongId &&
                        pendingSongId === currentSong?.id &&
                        !override &&
                        clearedOverrideRef.current !== currentSong?.id &&
                        useSettingsStore.getState().lyrics.fetch,
                },
                query: { songId: currentSong?.id || '' },
                serverId: currentSong?._serverId || '',
            },
            currentSong,
        ),
    );

    // Automatically set remote lyrics as override when fetched
    // Only auto-apply if preferLocalLyrics is disabled OR if local lyrics are not available
    useEffect(() => {
        // Don't auto-set if we've explicitly cleared the override for this song
        if (
            remoteLyricsData &&
            !override &&
            currentSong &&
            clearedOverrideRef.current !== currentSong.id
        ) {
            // If preferLocalLyrics is enabled, wait for local lyrics to finish loading
            if (preferLocalLyrics && isInitialLoading) {
                return;
            }

            // Check if local lyrics are available
            const hasLocalLyrics =
                (Array.isArray(data) && data.length > 0) ||
                (data && !Array.isArray(data) && data.lyrics);

            // Only auto-apply remote lyrics if:
            // 1. preferLocalLyrics is disabled, OR
            // 2. preferLocalLyrics is enabled but no local lyrics are available
            if (!preferLocalLyrics || !hasLocalLyrics) {
                // Store the remote lyrics data directly (it already contains the lyrics)
                setAutoRemoteLyrics(remoteLyricsData);
            } else {
                // Clear auto remote lyrics if local lyrics are preferred and available
                setAutoRemoteLyrics(null);
            }
        } else if (!remoteLyricsData || override) {
            // Clear auto remote lyrics if override is set or remote lyrics are cleared
            setAutoRemoteLyrics(null);
        }
    }, [remoteLyricsData, override, currentSong, preferLocalLyrics, data, isInitialLoading]);

    const { data: overrideData, isInitialLoading: isOverrideLoading } = useQuery(
        lyricsQueries.songLyricsByRemoteId({
            options: {
                enabled: !!override && !!override.id,
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
        // If override data is available, use it (manual override always takes priority)
        if (override && overrideData && override.id) {
            const overrideLyrics: FullLyricsMetadata = {
                artist: override.artist,
                lyrics: overrideData,
                name: override.name,
                offsetMs: currentOffsetMs,
                remote: override.remote ?? true,
                source: override.source,
            };
            return [overrideLyrics, Array.isArray(overrideData), 'override'] as const;
        }

        // Check if local lyrics are available
        const hasLocalLyrics =
            (Array.isArray(data) && data.length > 0) ||
            (data && !Array.isArray(data) && data.lyrics);

        // If preferLocalLyrics is enabled and local lyrics are available, prioritize them
        if (preferLocalLyrics && hasLocalLyrics) {
            if (Array.isArray(data)) {
                const selectedLyric = data[Math.min(index, data.length - 1)];
                return [selectedLyric, selectedLyric.synced, 'server'] as const;
            } else if (data?.lyrics) {
                return [data, Array.isArray(data.lyrics), 'server'] as const;
            }
        }

        // If auto-fetched remote lyrics are available, use them
        // (This will only be set if preferLocalLyrics is disabled OR no local lyrics exist)
        if (autoRemoteLyrics) {
            return [autoRemoteLyrics, Array.isArray(autoRemoteLyrics.lyrics), 'override'] as const;
        }

        // Otherwise, use the server-side lyrics data
        if (Array.isArray(data)) {
            if (data.length > 0) {
                const selectedLyric = data[Math.min(index, data.length - 1)];
                return [selectedLyric, selectedLyric.synced, 'server'] as const;
            }
        } else if (data?.lyrics) {
            return [data, Array.isArray(data.lyrics), 'server'] as const;
        }

        return [undefined, false, 'server'] as const;
    }, [data, index, override, overrideData, autoRemoteLyrics, currentOffsetMs, preferLocalLyrics]);

    const handleOnSearchOverride = useCallback((params: LyricsOverride) => {
        setOverride(params);
    }, []);

    // Persist override lyrics to cache with current offset
    useEffect(() => {
        if (override && overrideData && currentSong && override.id) {
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

    const handleOnRemoveLyric = useCallback(async () => {
        if (!currentSong) return;

        const currentOverride = override;
        clearedOverrideRef.current = currentSong.id;

        // Clear the override state and auto remote lyrics
        setOverride(undefined);
        setAutoRemoteLyrics(null);

        // Clear the override query cache if it exists
        if (currentOverride?.id) {
            queryClient.removeQueries({
                queryKey: queryKeys.songs.lyricsByRemoteId({
                    remoteSongId: currentOverride.id,
                    remoteSource: currentOverride.source,
                }),
            });
        }

        // Clear the remote lyrics cache
        queryClient.removeQueries({
            queryKey: queryKeys.songs.remoteLyrics(currentSong._serverId, {
                songId: currentSong.id,
            }),
        });

        // Clear the server lyrics cache so it refetches from server
        const serverLyricsQueryKey = queryKeys.songs.serverLyrics(currentSong._serverId, {
            songId: currentSong.id,
        });
        queryClient.removeQueries({
            queryKey: serverLyricsQueryKey,
        });

        // Remove the main lyrics query cache
        const lyricsQueryKey = queryKeys.songs.lyrics(currentSong._serverId, {
            songId: currentSong.id,
        });
        queryClient.removeQueries({
            exact: true,
            queryKey: lyricsQueryKey,
        });

        // Refetch server lyrics first, then song lyrics to ensure fresh data from server
        await queryClient.refetchQueries({
            queryKey: serverLyricsQueryKey,
        });
        await queryClient.refetchQueries({
            queryKey: lyricsQueryKey,
        });
    }, [currentSong, override]);

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
                setAutoRemoteLyrics(null);
                clearedOverrideRef.current = undefined;
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

    const shouldShowRemoteLoading = useMemo(() => {
        if (!isRemoteLyricsLoading) {
            return false;
        }

        // If preferLocalLyrics is disabled, always show remote loading
        if (!preferLocalLyrics) {
            return true;
        }

        // If preferLocalLyrics is enabled, only show remote loading if:
        // - Local lyrics have finished loading (!isInitialLoading)
        // - No local lyrics are available
        if (isInitialLoading) return false;

        // Check if local lyrics are available
        const hasLocalLyrics =
            (Array.isArray(data) && data.length > 0) ||
            (data && !Array.isArray(data) && data.lyrics);

        // Show remote loading only if no local lyrics are available
        return !hasLocalLyrics;
    }, [isRemoteLyricsLoading, preferLocalLyrics, data, isInitialLoading]);

    const isLoadingLyrics = isInitialLoading || isOverrideLoading || shouldShowRemoteLoading;

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
                        hasLyrics={!!lyrics}
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
