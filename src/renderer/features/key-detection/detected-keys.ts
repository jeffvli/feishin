import type { Song } from '/@/shared/types/domain-types';

import { getSongCamelotKey } from '/@/renderer/utils/camelot-key';

/** Camelot keys detected from the audio, by detected key id. */
export type DetectedKeys = Record<string, string>;

export type SongRef = Pick<Song, '_serverId' | 'id'>;

export const getDetectedKeyId = (song: SongRef) => `${song._serverId}:${song.id}`;

/** Camelot key from the song's key tag, falling back to the key detected on this device. */
export const resolveCamelotKey = (
    song: (Pick<Song, 'tags'> & SongRef) | undefined,
    keys: DetectedKeys,
): null | string =>
    song ? (getSongCamelotKey(song) ?? keys[getDetectedKeyId(song)] ?? null) : null;
