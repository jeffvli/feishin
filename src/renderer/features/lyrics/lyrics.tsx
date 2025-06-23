import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';

import styles from './lyrics.module.css';

import { queryKeys } from '/@/renderer/api/query-keys';
import { ErrorFallback } from '/@/renderer/features/action-required';
import { LyricsActions } from '/@/renderer/features/lyrics/lyrics-actions';
import {
    useSongLyricsByRemoteId,
    useSongLyricsBySong,
} from '/@/renderer/features/lyrics/queries/lyric-query';
import { translateLyrics } from '/@/renderer/features/lyrics/queries/lyric-translate';
import {
    SynchronizedLyrics,
    SynchronizedLyricsProps,
} from '/@/renderer/features/lyrics/synchronized-lyrics';
import {
    UnsynchronizedLyrics,
    UnsynchronizedLyricsProps,
} from '/@/renderer/features/lyrics/unsynchronized-lyrics';
import { queryClient } from '/@/renderer/lib/react-query';
import { useCurrentSong, useLyricsSettings, usePlayerStore } from '/@/renderer/store';
import { Center } from '/@/shared/components/center/center';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Text } from '/@/shared/components/text/text';
import { FullLyricsMetadata, LyricSource, LyricsOverride } from '/@/shared/types/domain-types';

export const Lyrics = () => {
    const currentSong = useCurrentSong();
    const lyricsSettings = useLyricsSettings();
    const { t } = useTranslation();
    const [index, setIndex] = useState(0);
    const [translatedLyrics, setTranslatedLyrics] = useState<null | string>(null);
    const [showTranslation, setShowTranslation] = useState(false);

    const { data, isInitialLoading } = useSongLyricsBySong(
        {
            query: { songId: currentSong?.id || '' },
            serverId: currentSong?.serverId || '',
        },
        currentSong,
    );

    const [override, setOverride] = useState<LyricsOverride | undefined>(undefined);

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

    const handleOnTranslateLyric = useCallback(async () => {
        if (translatedLyrics) {
            setShowTranslation(!showTranslation);
            return;
        }
        if (!lyrics) return;
        const originalLyrics = Array.isArray(lyrics.lyrics)
            ? lyrics.lyrics.map(([, line]) => line).join('\n')
            : lyrics.lyrics;
        const { translationApiKey, translationApiProvider, translationTargetLanguage } =
            lyricsSettings;
        const TranslatedText: null | string = await translateLyrics(
            originalLyrics,
            translationApiKey,
            translationApiProvider,
            translationTargetLanguage,
        );
        setTranslatedLyrics(TranslatedText);
        setShowTranslation(true);
    }, [lyrics, lyricsSettings, translatedLyrics, showTranslation]);

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
            <div className={styles.lyricsContainer}>
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
                                    <Icon icon="info" />
                                    <Text>
                                        {t('page.fullscreenPlayer.noLyrics', {
                                            postProcess: 'sentenceCase',
                                        })}
                                    </Text>
                                </Group>
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
                                        translatedLyrics={showTranslation ? translatedLyrics : null}
                                    />
                                ) : (
                                    <UnsynchronizedLyrics
                                        {...(lyrics as UnsynchronizedLyricsProps)}
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
                        onRemoveLyric={handleOnRemoveLyric}
                        onResetLyric={handleOnResetLyric}
                        onSearchOverride={handleOnSearchOverride}
                        onTranslateLyric={handleOnTranslateLyric}
                        setIndex={setIndex}
                    />
                </div>
            </div>
        </ErrorBoundary>
    );
};
