import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { toGroupSong } from '/@/renderer/features/group-play/api/group-play-api';
import { type GroupSong } from '/@/renderer/features/group-play/store/group-play.store';
import { useHermesUrl } from '/@/renderer/features/hermes-video/store/hermes-video.store';
import { sourApi } from '/@/renderer/features/sour/api/sour-api';
import { useSourStore } from '/@/renderer/features/sour/store/sour.store';
import { ContextMenu } from '/@/shared/components/context-menu/context-menu';
import { toast } from '/@/shared/components/toast/toast';
import { type Album, type AlbumArtist, type Artist, type Song } from '/@/shared/types/domain-types';

// Adds songs, albums or artists to the favourites on your profile (skipping ones already there).
const AddFavoritesItem = ({ entries }: { entries: GroupSong[] }) => {
    const url = useHermesUrl();
    const me = useSourStore((state) => state.me);
    const queryClient = useQueryClient();

    const onSelect = useCallback(async () => {
        if (!url || !me) return;
        try {
            const profile = await sourApi.profile(url, me.id);
            const have = new Set(profile.favorites.map((f) => f.id));
            const added = entries.filter((entry) => !have.has(entry.id));
            await sourApi.update(url, me, { favorites: [...profile.favorites, ...added] });
            queryClient.invalidateQueries({ queryKey: ['sour-profiles', url] });
            toast.success({
                message: added.length ? 'Added to your profile' : 'Already on your profile',
            });
        } catch (error) {
            toast.error({ message: (error as Error).message });
        }
    }, [entries, me, queryClient, url]);

    if (!url || !me || !entries.length) return null;

    return (
        <ContextMenu.Item leftIcon="favorite" onSelect={onSelect}>
            Add to my profile
        </ContextMenu.Item>
    );
};

// Song right-click menu
export const AddToProfileAction = ({ songs }: { songs: Song[] }) => (
    <AddFavoritesItem entries={songs.map(toGroupSong)} />
);

// Album right-click menu
export const AddAlbumToProfileAction = ({ albums }: { albums: Album[] }) => (
    <AddFavoritesItem
        entries={albums.map((a) => ({
            album: a.name,
            artist: a.albumArtistName,
            duration: 0,
            id: `album:${a.id}`,
            imageId: a.imageId,
            title: a.name,
        }))}
    />
);

// Artist right-click menu
export const AddArtistToProfileAction = ({ artists }: { artists: (AlbumArtist | Artist)[] }) => (
    <AddFavoritesItem
        entries={artists.map((a) => ({
            album: '',
            artist: a.name,
            duration: 0,
            id: `artist:${a.id}`,
            imageId: a.imageId,
            title: a.name,
        }))}
    />
);

// Song right-click menu: never let Auto DJ add this song's artist for you.
export const BlockArtistAction = ({ songs }: { songs: Song[] }) => {
    const block = useSourStore((state) => state.block);
    const song = songs[0];

    const onSelect = useCallback(() => {
        if (!song) return;
        const artist = song.artists?.[0];
        const name = artist?.name || song.artistName;
        if (!name) return;
        block({ id: artist?.id || null, name });
        toast.info({ message: `Auto DJ won't play ${name} for you` });
    }, [block, song]);

    if (songs.length !== 1 || !song?.artistName) return null;

    return (
        <ContextMenu.Item leftIcon="x" onSelect={onSelect}>
            Block artist from Auto DJ
        </ContextMenu.Item>
    );
};
