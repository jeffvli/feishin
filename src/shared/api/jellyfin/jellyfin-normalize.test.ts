import { afterEach, describe, expect, it, vi } from 'vitest';

import { jfNormalize } from '/@/shared/api/jellyfin/jellyfin-normalize';
import { ServerListItem, ServerType } from '/@/shared/types/types';

type RawSong = Parameters<typeof jfNormalize.song>[0];

const server = { id: 'server-1' } as ServerListItem;

// Only the fields the normalizer reads; the full schema (media sources/streams) is large
const rawSong = {
    Album: 'Album',
    AlbumArtist: 'Album Artist',
    AlbumArtists: [{ Id: 'aa-1', Name: 'Album Artist' }],
    AlbumId: 'al-1',
    AlbumPrimaryImageTag: 'album-tag',
    ArtistItems: [
        { Id: 'ar-1', Name: 'First' },
        { Id: 'ar-2', Name: 'Second' },
    ],
    DateCreated: '2024-01-02T03:04:05Z',
    GenreItems: [{ Id: 'g-1', Name: 'Rock' }],
    Id: 'song-1',
    ImageBlurHashes: { Primary: { 'song-tag': 'blur' } },
    ImageTags: { Primary: 'song-tag' },
    IndexNumber: 4,
    MediaSources: [
        {
            Container: 'flac',
            MediaStreams: [
                { Codec: 'mjpeg', Type: 'EmbeddedImage' },
                {
                    BitDepth: 24,
                    BitRate: 921_999,
                    Channels: 2,
                    Codec: 'flac',
                    SampleRate: 96000,
                    Type: 'Audio',
                },
            ],
            Path: '/music/song.flac',
            Size: 12345,
        },
    ],
    Name: 'Title',
    ParentIndexNumber: 2,
    PremiereDate: '2001-05-03T00:00:00.0000000Z',
    ProductionYear: 2001,
    RunTimeTicks: 2_150_000_000,
    Type: 'Audio',
};

const normalize = (overrides: Record<string, unknown> = {}) =>
    jfNormalize.song({ ...rawSong, ...overrides } as unknown as RawSong, server);

describe('jfNormalize.song', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('maps core fields', () => {
        expect(normalize()).toMatchObject({
            _serverId: 'server-1',
            _serverType: ServerType.JELLYFIN,
            album: 'Album',
            albumArtistName: 'Album Artist',
            albumId: 'al-1',
            blurHash: 'blur',
            discNumber: 2,
            duration: 215_000,
            id: 'song-1',
            imageId: 'song-1',
            isResumable: false,
            name: 'Title',
            sortName: 'Title',
            trackNumber: 4,
        });
    });

    it('reads file info from the first audio stream of the first media source', () => {
        expect(normalize()).toMatchObject({
            bitDepth: 24,
            bitRate: 921,
            channels: 2,
            codec: 'flac',
            container: 'flac',
            path: '/music/song.flac',
            sampleRate: 96000,
            size: 12345,
        });
    });

    it('falls back to empty file info without media sources', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        expect(normalize({ MediaSources: [] })).toMatchObject({
            bitDepth: null,
            bitRate: 0,
            codec: null,
            container: null,
            path: '',
            size: 0,
        });
        expect(warn).toHaveBeenCalled();
    });

    it('joins track artists and falls back to album artists', () => {
        const song = normalize();
        expect(song.artistName).toBe('First, Second');
        expect(song.artists.map((a) => a.id)).toEqual(['ar-1', 'ar-2']);

        const noArtists = normalize({ ArtistItems: [] });
        expect(noArtists.artistName).toBe('');
        expect(noArtists.artists.map((a) => a.id)).toEqual(['aa-1']);
    });

    it('uses a dummy album id when the song has no album', () => {
        expect(normalize({ AlbumId: undefined }).albumId).toBe('dummy/song-1');
    });

    it('defaults the disc number to 1', () => {
        expect(normalize({ ParentIndexNumber: 0 }).discNumber).toBe(1);
    });

    it('uses the album image when the song has none', () => {
        expect(normalize({ ImageTags: {} }).imageId).toBe('al-1');
        expect(normalize({ AlbumId: undefined, ImageTags: {} }).imageId).toBeNull();
    });

    describe('dates', () => {
        it('takes the date from PremiereDate', () => {
            expect(normalize()).toMatchObject({
                date: '2001-05-03',
                releaseDate: '2001-05-03',
                releaseYear: 2001,
                year: 2001,
            });
        });

        it('falls back to ProductionYear', () => {
            expect(normalize({ PremiereDate: undefined, ProductionYear: 1999 })).toMatchObject({
                date: '1999',
                releaseDate: '1999',
                releaseYear: 1999,
            });
        });

        it('returns nulls without any date information', () => {
            expect(normalize({ PremiereDate: undefined, ProductionYear: 0 })).toMatchObject({
                date: null,
                releaseDate: null,
                releaseYear: null,
            });
        });
    });

    describe('gain', () => {
        it('is null without normalization data', () => {
            expect(normalize().gain).toBeNull();
        });

        it('prefers NormalizationGain for the track', () => {
            expect(
                normalize({ AlbumNormalizationGain: -5, LUFS: -10, NormalizationGain: -6 }).gain,
            ).toEqual({ album: -5, track: -6 });
        });

        it('derives the track gain from LUFS against a -18 target', () => {
            expect(normalize({ LUFS: -10 }).gain).toEqual({ album: undefined, track: -8 });
        });
    });

    it('maps user data', () => {
        expect(
            normalize({
                UserData: { IsFavorite: true, PlaybackPositionTicks: 50_000, PlayCount: 3 },
            }),
        ).toMatchObject({ playCount: 3, resumePositionMs: 5, userFavorite: true });
    });
});
