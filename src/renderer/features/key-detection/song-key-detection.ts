import { useEffect } from 'react';

import i18n from '/@/i18n/i18n';
import { api } from '/@/renderer/api';
import { resolveCamelotKey } from '/@/renderer/features/key-detection/detected-keys';
import { KeyDetectionQueue } from '/@/renderer/features/key-detection/key-detection-queue';
import { useDetectedKeyStore } from '/@/renderer/features/key-detection/store/detected-key.store';
import { useAutoDetectSongKeys, useSettingsStore } from '/@/renderer/store';
import { detectAudioCamelotKey, KEY_DETECTION_SAMPLE_RATE } from '/@/renderer/utils/key-detection';
import { logger } from '/@/renderer/utils/logger';
import { toast } from '/@/shared/components/toast/toast';
import { Album, Song } from '/@/shared/types/domain-types';

const fetchSongAudio = async (song: Song) => {
    // The analysis only looks below 2 kHz, so a low bitrate transcode is enough
    const url = await api.controller.getStreamUrl({
        apiClientProps: { serverId: song._serverId },
        query: { bitrate: 128, format: 'mp3', id: song.id, transcode: true },
    });

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Stream request failed with status ${response.status}`);
    }

    // Decoding through an offline context resamples to its rate
    return new OfflineAudioContext(1, 1, KEY_DETECTION_SAMPLE_RATE).decodeAudioData(
        await response.arrayBuffer(),
    );
};

const queue = new KeyDetectionQueue<Song>({
    detect: async (song) => detectAudioCamelotKey(await fetchSongAudio(song)),
    isAutoDetectEnabled: () => Boolean(useSettingsStore.getState().general.autoDetectSongKeys),
    onDetected: (song, key) => useDetectedKeyStore.getState().setKey(song, key),
    onFailed: (song, error) => logger.error('Key detection failed', { error, songId: song.id }),
});

/** Detects the key of every song without one, with toasts for the start and the result. */
export const detectSongKeys = (songs: Song[]) => {
    const { keys } = useDetectedKeyStore.getState();
    const pending = songs.filter((song) => !resolveCamelotKey(song, keys));

    if (pending.length === 0) {
        toast.info({ message: i18n.t('page.contextMenu.detectKeyNothingToDo') });
        return;
    }

    toast.info({ message: i18n.t('page.contextMenu.detectKeyStarted', { count: pending.length }) });
    queue.enqueueBatch(pending, {
        detected: (count) =>
            toast.success({ message: i18n.t('page.contextMenu.detectKeyFinished', { count }) }),
        failed: (count) =>
            toast.warn({ message: i18n.t('page.contextMenu.detectKeyFailed', { count }) }),
    });
};

/** Detects the key of every song of the albums. */
export const detectAlbumKeys = (serverId: string, albumIds: string[]) =>
    Promise.all(
        albumIds.map((id) =>
            api.controller.getAlbumDetail({ apiClientProps: { serverId }, query: { id } }),
        ),
    )
        .then((albums: Album[]) => detectSongKeys(albums.flatMap((album) => album.songs ?? [])))
        .catch((error) => {
            logger.error('Failed to load album songs for key detection', { error });
            toast.error({ message: i18n.t('error.genericError') });
        });

/**
 * Camelot key of the song, from its key tag or detected on this device.
 * With automatic detection on, a song shown without one is queued for detection.
 */
export const useSongCamelotKey = (song?: Song) => {
    const autoDetect = useAutoDetectSongKeys();
    const key = useDetectedKeyStore((state) => resolveCamelotKey(song, state.keys));

    useEffect(() => {
        if (autoDetect) {
            queue.requestAutomatic(song, key);
        }
    }, [autoDetect, key, song]);

    return key;
};
