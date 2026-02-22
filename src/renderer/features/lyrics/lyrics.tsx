import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './lyrics.module.css';

import { queryKeys } from '/@/renderer/api/query-keys';
import { translateLyrics } from '/@/renderer/features/lyrics/api/lyric-translate';
import {
    computeSelectedFromResult,
    getDisplayOffset,
    lyricsQueries,
    type LyricsQueryResult,
} from '/@/renderer/features/lyrics/api/lyrics-api';
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
import { LyricsOverride } from '/@/shared/types/domain-types';

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
    const [index, setIndexState] = useState(0);
    const [translatedLyrics, setTranslatedLyrics] = useState<null | string>(null);
    const [showTranslation, setShowTranslation] = useState(false);
    const [pendingSongId, setPendingSongId] = useState<string | undefined>(currentSong?.id);
    const lyricsFetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const previousSongIdRef = useRef<string | undefined>(currentSong?.id);

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

    const lyricsKey = useMemo(() => {
        if (!currentSong?._serverId || !currentSong?.id) return null;
        return queryKeys.songs.lyrics(currentSong._serverId, { songId: currentSong.id });
    }, [currentSong]);

    const { data, isLoading } = useQuery(
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

    const indexToUse = data?.selectedStructuredIndex ?? index;
    useEffect(() => {
        if (data != null) setIndexState(data.selectedStructuredIndex);
    }, [data]);

    const { selected: lyrics, selectedSynced: synced } = useMemo(() => {
        if (!data) return { selected: null, selectedSynced: false };
        return computeSelectedFromResult(data, preferLocalLyrics, indexToUse);
    }, [data, indexToUse, preferLocalLyrics]);

    const currentOffsetMs = useMemo(() => {
        if (!data) return 0;
        return getDisplayOffset(lyrics, data.selectedOffsetMs, indexToUse, data.local);
    }, [data, indexToUse, lyrics]);

    const handleOnSearchOverride = useCallback(
        (params: LyricsOverride) => {
            if (!lyricsKey) return;
            queryClient.setQueryData<LyricsQueryResult>(lyricsKey, (prev) =>
                prev ? { ...prev, overrideSelection: params } : prev,
            );
            queryClient.invalidateQueries({ queryKey: lyricsKey });
        },
        [lyricsKey],
    );

    const handleUpdateOffset = useCallback(
        (offsetMs: number) => {
            if (!currentSong || !lyricsKey) return;

            queryClient.setQueryData<LyricsQueryResult>(lyricsKey, (prev) => {
                if (!prev) return prev;
                const updated = { ...prev, selectedOffsetMs: offsetMs };
                if (Array.isArray(prev.local) && prev.local.length > 0) {
                    const idx = Math.min(indexToUse, prev.local.length - 1);
                    updated.local = [...prev.local];
                    updated.local[idx] = {
                        ...updated.local[idx],
                        offsetMs,
                    };
                }
                return updated;
            });
        },
        [currentSong, indexToUse, lyricsKey],
    );

    const setIndex = useCallback(
        (newIndex: number) => {
            setIndexState(newIndex);
            if (!lyricsKey || !data) return;
            const { selected: nextSelected, selectedSynced: nextSynced } =
                computeSelectedFromResult(data, preferLocalLyrics, newIndex);
            const nextOffset = getDisplayOffset(
                nextSelected,
                data.selectedOffsetMs,
                newIndex,
                data.local,
            );
            queryClient.setQueryData<LyricsQueryResult>(lyricsKey, (prev) =>
                prev
                    ? {
                          ...prev,
                          selected: nextSelected,
                          selectedOffsetMs: nextOffset,
                          selectedStructuredIndex: newIndex,
                          selectedSynced: nextSynced,
                      }
                    : prev,
            );
        },
        [data, lyricsKey, preferLocalLyrics],
    );

    const handleOnRemoveLyric = useCallback(async () => {
        if (!currentSong || !lyricsKey) return;

        queryClient.setQueryData<LyricsQueryResult>(lyricsKey, (prev) =>
            prev
                ? {
                      ...prev,
                      overrideData: null,
                      overrideSelection: null,
                      remoteAuto: null,
                      suppressRemoteAuto: true,
                  }
                : prev,
        );
        await queryClient.invalidateQueries({ queryKey: lyricsKey });
    }, [currentSong, lyricsKey]);

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
                setIndexState(0);
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
        const local = data?.local;
        if (Array.isArray(local)) {
            return local.map((lyric, idx) => ({ label: lyric.lang, value: idx.toString() }));
        }
        if (local && !Array.isArray(local) && 'lyrics' in local) {
            return [{ label: 'xxx', value: '0' }];
        }
        return [];
    }, [data?.local]);

    const isLoadingLyrics = isLoading;
    const hasNoLyrics = !lyrics;
    const [shouldFadeOut, setShouldFadeOut] = useState(false);

    useEffect(() => {
        if (!fadeOutNoLyricsMessage) {
            setShouldFadeOut(false);
            return undefined;
        }

        if (!isLoadingLyrics && hasNoLyrics) {
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
                        index={indexToUse}
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
