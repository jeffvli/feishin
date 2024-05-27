import type { QueueSong } from '/@/renderer/api/types';
import type { PlayerRepeat, PlayerStatus, SongState } from '/@/renderer/types';

export interface SongUpdateSocket extends Omit<SongState, 'song'> {
    song?: QueueSong | null;
}

export interface ServerError {
    data: string;
    event: 'error';
}

export interface ServerFavorite {
    data: { favorite: boolean; id: string };
    event: 'favorite';
}

export interface ServerPlayStatus {
    data: PlayerStatus;
    event: 'playback';
}

export interface ServerProxy {
    data: string;
    event: 'proxy';
}

export interface ServerRating {
    data: { id: string; rating: number };
    event: 'rating';
}

export interface ServerRepeat {
    data: PlayerRepeat;
    event: 'repeat';
}

export interface ServerShuffle {
    data: boolean;
    event: 'shuffle';
}

export interface ServerSong {
    data: QueueSong | null;
    event: 'song';
}

export interface ServerState {
    data: SongState;
    event: 'state';
}

export interface ServerVolume {
    data: number;
    event: 'volume';
}

export type ServerEvent =
    | ServerError
    | ServerFavorite
    | ServerPlayStatus
    | ServerRating
    | ServerRepeat
    | ServerShuffle
    | ServerSong
    | ServerState
    | ServerProxy
    | ServerVolume;

export interface ClientSimpleEvent {
    event: 'next' | 'pause' | 'play' | 'previous' | 'proxy' | 'repeat' | 'shuffle';
}

export interface ClientFavorite {
    event: 'favorite';
    favorite: boolean;
    id: string;
}

export interface ClientRating {
    event: 'rating';
    id: string;
    rating: number;
}

export interface ClientVolume {
    event: 'volume';
    volume: number;
}

export interface ClientAuth {
    event: 'authenticate';
    header: string;
}

export type ClientEvent =
    | ClientAuth
    | ClientSimpleEvent
    | ClientFavorite
    | ClientRating
    | ClientVolume;
