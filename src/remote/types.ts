import type { QueueSong } from '/@/renderer/api/types';
import type { SongUpdate } from '/@/renderer/types';

export interface SongUpdateSocket extends Omit<SongUpdate, 'song'> {
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

export interface ServerProxy {
  data: string;
  event: 'proxy';
}

export interface ServerRating {
  data: { id: string; rating: number };
  event: 'rating';
}

export interface ServerSong {
  data: SongUpdateSocket;
  event: 'song';
}

export type ServerEvent = ServerError | ServerFavorite | ServerRating | ServerSong | ServerProxy;

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

export type ClientEvent = ClientSimpleEvent | ClientFavorite | ClientRating | ClientVolume;
