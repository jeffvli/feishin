import { QueueSong } from '/@/shared/types/domain-types';
import { Play, PlayerRepeat, PlayerStatus, SongState } from '/@/shared/types/types';

// The subset of ClientEvent that gets an `operation-ack` back once the
// desktop has actually applied it — every one of these mutates the queue
// (or a playlist) as a side effect with no other feedback path, unlike the
// browsing *-request events (which already answer with their own *-response)
// or the simple playback controls (whose effect is visible immediately in
// the pushed player state). Without an ack, a phone tapping "Next" twice in
// a row has no way to know the first tap landed before firing the second.
export type AckableClientEvent =
    | ClientAddToPlaylist
    | ClientClearQueue
    | ClientPlayAlbum
    | ClientPlayPlaylist
    | ClientPlayTrack
    | ClientPlayTrackRadio;

export interface ClientAddToPlaylist {
    event: 'add-to-playlist';
    playlistId: string;
    // Present on every ack-tracked send (see AckableClientEvent) — echoed
    // back on the matching `operation-ack`, so the sender can tell its own
    // in-flight request apart from any other client's traffic.
    requestId?: string;
    songId: string;
}

export interface ClientAlbumsRequest extends RemoteListRequest {
    event: 'albums-request';
}

export interface ClientAuth {
    event: 'authenticate';
    header: string;
}

export interface ClientClearQueue {
    event: 'clear-queue';
    requestId?: string;
}

export type ClientEvent =
    | ClientAddToPlaylist
    | ClientAlbumsRequest
    | ClientAuth
    | ClientClearQueue
    | ClientFavorite
    | ClientPlayAlbum
    | ClientPlaylistsRequest
    | ClientPlayPlaylist
    | ClientPlayRadio
    | ClientPlayTrack
    | ClientPlayTrackRadio
    | ClientPosition
    | ClientQueueJump
    | ClientRadioRequest
    | ClientRating
    | ClientRemoveFromQueue
    | ClientReorderQueue
    | ClientSimpleEvent
    | ClientTracksRequest
    | ClientVolume;

export interface ClientFavorite {
    event: 'favorite';
    favorite: boolean;
    id: string;
}

export interface ClientPlayAlbum {
    event: 'play-album';
    id: string;
    playType?: Play;
    requestId?: string;
}

export interface ClientPlaylistsRequest extends RemoteListRequest {
    event: 'playlists-request';
}

export interface ClientPlayPlaylist {
    event: 'play-playlist';
    id: string;
    playType?: Play;
    requestId?: string;
}

export interface ClientPlayRadio {
    event: 'play-radio';
    id: string;
}

export interface ClientPlayTrack {
    event: 'play-track';
    id: string;
    playType?: Play;
    requestId?: string;
}

export interface ClientPlayTrackRadio {
    event: 'play-track-radio';
    id: string;
    playType: Play;
    requestId?: string;
}

export interface ClientPosition {
    event: 'position';
    position: number;
}

export interface ClientQueueJump {
    event: 'queue-jump';
    uniqueId: string;
}

export interface ClientRadioRequest extends RemoteListRequest {
    event: 'radio-request';
}

export interface ClientRating {
    event: 'rating';
    id: string;
    rating: number;
}

export interface ClientRemoveFromQueue {
    event: 'remove-from-queue';
    uniqueId: string;
}

export interface ClientReorderQueue {
    edge: 'bottom' | 'top';
    event: 'reorder-queue';
    targetUniqueId: string;
    uniqueId: string;
}

export interface ClientSimpleEvent {
    event: 'next' | 'pause' | 'play' | 'previous' | 'proxy' | 'repeat' | 'shuffle';
}

export interface ClientTracksRequest extends RemoteListRequest {
    event: 'tracks-request';
}
export interface ClientVolume {
    event: 'volume';
    volume: number;
}

export interface RemoteAlbumItem {
    albumArtistName: string;
    duration: null | number;
    id: string;
    imageUrl: null | string;
    name: string;
    releaseYear: null | number;
    songCount: null | number;
}

export interface RemoteListRequest {
    limit?: number;
    requestId: string;
    searchTerm?: string;
    startIndex?: number;
}

export interface RemotePlaylistItem {
    duration: null | number;
    id: string;
    imageUrl: null | string;
    name: string;
    songCount: null | number;
}

export interface RemoteQueueItem {
    album: null | string;
    artistName: string;
    duration: number;
    id: string;
    imageUrl: null | string;
    name: string;
    uniqueId: string;
}

export interface RemoteRadioItem {
    homepageUrl: null | string;
    id: string;
    imageUrl: null | string;
    name: string;
}

// Trimmed, phone-specific shapes — deliberately not the full Song/Playlist/
// InternetRadioStation/QueueSong domain types, which carry dozens of fields
// the phone list rows don't need.
export interface RemoteTrackItem {
    album: null | string;
    artistName: string;
    duration: number;
    id: string;
    imageUrl: null | string;
    name: string;
}

export interface ServerAccentColor {
    data: { dark: string; light: string };
    event: 'accent-color';
}

export interface ServerAlbumsResponse {
    data: { hasMore: boolean; items: RemoteAlbumItem[]; requestId: string };
    event: 'albums-response';
}

export interface ServerConfirmQueueChangesSetting {
    data: boolean;
    event: 'confirm-queue-changes-setting';
}

export interface ServerError {
    data: string;
    event: 'error';
}

export type ServerEvent =
    | ServerAccentColor
    | ServerAlbumsResponse
    | ServerConfirmQueueChangesSetting
    | ServerError
    | ServerFavorite
    | ServerOperationAck
    | ServerPlaylistsResponse
    | ServerPlayStatus
    | ServerPosition
    | ServerProxy
    | ServerQueueState
    | ServerRadioResponse
    | ServerRadioStatus
    | ServerRating
    | ServerRepeat
    | ServerShuffle
    | ServerSong
    | ServerState
    | ServerTracksResponse
    | ServerVolume;

export interface ServerFavorite {
    data: { favorite: boolean; id: string };
    event: 'favorite';
}

// Answers an AckableClientEvent's `requestId` once the desktop has actually
// applied it — sent to that one client only (like the *-response events),
// never broadcast. `error` unset means it succeeded.
export interface ServerOperationAck {
    data: { error?: string; requestId: string };
    event: 'operation-ack';
}

export interface ServerPlaylistsResponse {
    data: { hasMore: boolean; items: RemotePlaylistItem[]; requestId: string };
    event: 'playlists-response';
}

export interface ServerPlayStatus {
    data: PlayerStatus;
    event: 'playback';
}

export interface ServerPosition {
    data: number;
    event: 'position';
}

export interface ServerProxy {
    data: string;
    event: 'proxy';
}

// Cached + broadcast, not request/response — the queue is live desktop-driven
// state, not a one-shot query.
export interface ServerQueueState {
    data: { currentUniqueId: null | string; items: RemoteQueueItem[] };
    event: 'queue-state';
}

export interface ServerRadioResponse {
    data: { hasMore: boolean; items: RemoteRadioItem[]; requestId: string };
    event: 'radio-response';
}

export interface ServerRadioStatus {
    data: { imageUrl: null | string; isActive: true; stationName: string } | { isActive: false };
    event: 'radio-status';
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
    data: null | QueueSong;
    event: 'song';
}

export interface ServerState {
    data: SongState;
    event: 'state';
}

export interface ServerTracksResponse {
    data: { hasMore: boolean; items: RemoteTrackItem[]; requestId: string };
    event: 'tracks-response';
}

export interface ServerVolume {
    data: number;
    event: 'volume';
}

export interface SongUpdateSocket extends Omit<SongState, 'song'> {
    position?: number;
    song?: null | QueueSong;
}
