import type { SynchronizedLyrics } from '/@/shared/types/domain-types';

import { useQuery } from '@tanstack/react-query';
import isElectron from 'is-electron';
import { useEffect, useMemo } from 'react';

import i18n from '/@/i18n/i18n';
import { queryKeys } from '/@/renderer/api/query-keys';
import { lyricsTranslationQuery } from '/@/renderer/features/lyrics/api/lyric-translate';
import {
    computeSelectedFromResult,
    getDisplayOffset,
    lyricsQueries,
    type LyricsQueryResult,
} from '/@/renderer/features/lyrics/api/lyrics-api';
import {
    getLyricLineText,
    getLyricsLayers,
    getOverlayLayerKey,
} from '/@/renderer/features/lyrics/api/lyrics-utils';
import {
    updateDesktopLyricsState,
    useDesktopLyricsState,
} from '/@/renderer/features/lyrics/desktop-lyrics.store';
import {
    useFuriganaLyrics,
    useRomajiLyrics,
} from '/@/renderer/features/lyrics/hooks/use-furigana-lyrics';
import { buildDesktopLyricsLines } from '/@/renderer/features/lyrics/utils/build-desktop-lyrics-lines';
import { updateLyricsOffset } from '/@/renderer/features/lyrics/utils/update-lyrics-offset';
import { useIsRadioActive } from '/@/renderer/features/radio/hooks/use-radio-player';
import { queryClient } from '/@/renderer/lib/react-query';
import {
    subscribeCurrentTrack,
    subscribePlayerProgress,
    useLanguage,
    useLyricsSettings,
    usePlayerSong,
    usePlayerStatus,
    usePlayerStoreBase,
} from '/@/renderer/store';
import { useTimestampStoreBase } from '/@/renderer/store/timestamp.store';
import { logger } from '/@/renderer/utils/logger';
import { useLocalStorage } from '/@/shared/hooks/use-local-storage';
import { PlayerStatus } from '/@/shared/types/types';
import { getDesktopLyricsTrackKey } from '/@/shared/utils/desktop-lyrics';

const api = isElectron() ? window.api.desktopLyrics : null;

export const useDesktopLyrics = () => {
    const open = useDesktopLyricsState((state) => state.open);
    const song = usePlayerSong();
    const status = usePlayerStatus();
    const isRadioActive = useIsRadioActive();
    const {
        delayMs,
        enableAutoTranslation,
        enableFurigana,
        enableRomaji,
        preferLocalLyrics,
        translationApiKey,
        translationApiProvider,
        translationTargetLanguage,
    } = useLyricsSettings();
    const [visibleOverlayKeys] = useLocalStorage<string[]>({
        defaultValue: [],
        key: 'lyrics:visible-overlay-layers:default',
    });
    const language = useLanguage();
    const trackKey = getDesktopLyricsTrackKey(song);
    const { data } = useQuery(
        lyricsQueries.songLyrics(
            {
                options: { enabled: !!api && open && !!song && !isRadioActive },
                query: { songId: song?.id ?? '' },
                serverId: song?._serverId ?? '',
            },
            song,
        ),
    );

    const selected = useMemo(
        () =>
            data
                ? computeSelectedFromResult(data, preferLocalLyrics, data.selectedStructuredIndex)
                : null,
        [data, preferLocalLyrics],
    );
    const lyrics = selected?.selected;
    const rawLyrics =
        selected?.selectedSynced && Array.isArray(lyrics?.lyrics) ? lyrics.lyrics : null;
    const active = !!api && open && !isRadioActive && !!rawLyrics?.length;
    const { data: furiganaLyrics } = useFuriganaLyrics(rawLyrics, active && !!enableFurigana);
    const { data: romajiLyrics } = useRomajiLyrics(rawLyrics, active && !!enableRomaji);
    const originalText = rawLyrics?.map(getLyricLineText).join('\n') ?? '';
    const { data: translatedLyrics } = useQuery({
        ...lyricsTranslationQuery(
            originalText,
            translationApiKey,
            translationApiProvider,
            translationTargetLanguage,
        ),
        enabled: active && !!enableAutoTranslation,
    });
    const layers = useMemo(
        () =>
            Array.isArray(data?.local)
                ? getLyricsLayers(data.local).overlayLayers.filter((layer) =>
                      visibleOverlayKeys.includes(getOverlayLayerKey(layer)),
                  )
                : [],
        [data, visibleOverlayKeys],
    );
    const pronunciation = layers.find((layer) => layer.synced && layer.kind === 'pronunciation');
    const translation = layers.find((layer) => layer.synced && layer.kind === 'translation');

    useEffect(() => {
        if (!api) return;
        return api.onOffset(({ offsetMs, trackKey: requestedTrack }) => {
            const currentSong = usePlayerStoreBase.getState().getCurrentSong();
            if (!currentSong || requestedTrack !== getDesktopLyricsTrackKey(currentSong)) return;
            const key = queryKeys.songs.lyrics(currentSong._serverId, { songId: currentSong.id });
            queryClient.setQueryData<LyricsQueryResult>(key, (previous) =>
                updateLyricsOffset(previous, previous?.selectedStructuredIndex ?? 0, offsetMs),
            );
        });
    }, []);

    useEffect(() => {
        if (!api) {
            return;
        }
        const unsubscribe = api.onState(updateDesktopLyricsState);
        void api
            .restore({
                close: i18n.t('desktopLyrics.close'),
                title: i18n.t('desktopLyrics.title'),
                unlock: i18n.t('desktopLyrics.unlock'),
            })
            .then(updateDesktopLyricsState)
            .catch((error) => logger.error('Failed to restore desktop lyrics state', { error }));
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (!api || !open) {
            return;
        }
        const unsubscribeTrack = subscribeCurrentTrack(({ song: nextSong }) => {
            // Clear synchronously on track changes, before an old query or React effect can publish.
            api.publish({
                durationMs: Math.max(0, (nextSong?.duration ?? 0) * 1000),
                language: i18n.language,
                lines: [],
                offsetMs: 0,
                playing: usePlayerStoreBase.getState().player.status === PlayerStatus.PLAYING,
                timestamp: 0,
                title: nextSong?.name ?? '',
                trackKey: getDesktopLyricsTrackKey(nextSong),
            });
        });
        const unsubscribeTime = subscribePlayerProgress(({ timestamp }) => {
            api.publishTime(
                getDesktopLyricsTrackKey(usePlayerStoreBase.getState().getCurrentSong()),
                timestamp,
            );
        });
        return () => {
            unsubscribeTrack();
            unsubscribeTime();
        };
    }, [open]);

    useEffect(() => {
        if (
            !api ||
            !open ||
            trackKey !== getDesktopLyricsTrackKey(usePlayerStoreBase.getState().getCurrentSong())
        ) {
            return;
        }
        api.publish({
            durationMs: Math.max(0, (song?.duration ?? 0) * 1000),
            language,
            ...(active && rawLyrics
                ? buildDesktopLyricsLines({
                      furiganaLyrics:
                          enableFurigana && Array.isArray(furiganaLyrics)
                              ? (furiganaLyrics as SynchronizedLyrics)
                              : undefined,
                      lyrics: rawLyrics,
                      pronunciationOverlay: pronunciation?.synced
                          ? pronunciation.lyrics
                          : undefined,
                      romajiLyrics:
                          enableRomaji && Array.isArray(romajiLyrics)
                              ? (romajiLyrics as SynchronizedLyrics)
                              : undefined,
                      translatedLyrics,
                      translationOverlay: translation?.synced ? translation.lyrics : undefined,
                  })
                : { lines: [] }),
            offsetMs: data
                ? getDisplayOffset(
                      lyrics ?? null,
                      data.selectedOffsetMs,
                      data.selectedStructuredIndex,
                      data.local,
                      delayMs,
                  )
                : delayMs,
            playing: status === PlayerStatus.PLAYING,
            timestamp: useTimestampStoreBase.getState().timestamp,
            title: isRadioActive ? '' : (song?.name ?? ''),
            trackKey,
        });
    }, [
        active,
        data,
        delayMs,
        enableFurigana,
        enableRomaji,
        furiganaLyrics,
        isRadioActive,
        language,
        lyrics,
        open,
        pronunciation,
        rawLyrics,
        romajiLyrics,
        song,
        status,
        trackKey,
        translatedLyrics,
        translation,
    ]);
};
