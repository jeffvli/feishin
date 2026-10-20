import { api } from '/@/renderer/api';
import { isBlockedSong, useSourStore } from '/@/renderer/features/sour/store/sour.store';
import { getServerById, useAuthStore } from '/@/renderer/store';
import { addToQueueByData, usePlayerStoreBase } from '/@/renderer/store/player.store';
import { toast } from '/@/shared/components/toast/toast';
import { Played, type RandomSongListQuery, type Song } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

// Quick mixes: one click and something fitting plays (the command palette, Home and the phone menu)
const serverId = () => useAuthStore.getState().currentServer?.id || '';

const playMix = async (
    name: string,
    query: Omit<RandomSongListQuery, 'played'> & { played?: Played },
) => {
    const id = serverId();
    if (!id || !getServerById(id)) return toast.error({ message: 'Pick a music server first' });
    const res = await api.controller
        .getRandomSongList({
            apiClientProps: { serverId: id },
            query: { limit: 60, played: Played.All, ...query },
        })
        .catch(() => null);
    const songs = (res?.items ?? []).filter((s: Song) => !isBlockedSong(s));
    if (!songs.length) return toast.info({ message: `Nothing for ${name} yet` });
    await addToQueueByData(Play.NOW, songs);
    toast.success({ message: `${name}: ${songs.length} songs` });
    return undefined;
};

const current = () => {
    const player = usePlayerStoreBase.getState();
    return player.getQueue().items[player.player.index];
};

export const quickMixes = {
    // the current song's decade
    decade: () => {
        const year = current()?.releaseYear;
        if (!year) return toast.info({ message: 'Play something with a year first' });
        const from = Math.floor(year / 10) * 10;
        return playMix(`The ${String(from).slice(2)}s`, { maxYear: from + 9, minYear: from });
    },
    // the current song's genre
    genre: () => {
        const genre = current()?.genres?.[0]?.name;
        if (!genre) return toast.info({ message: 'Play something with a genre first' });
        return playMix(`More ${genre}`, { genre });
    },
    // songs you've never played
    neverHeard: () => playMix('Never heard', { played: Played.Never }),
    // songs you've played before
    oldFavorites: () => playMix('Old favorites', { played: Played.Played }),
};

// the same song twice in the queue: keep the first one (the playing song always stays)
export const removeQueueDuplicates = () => {
    const player = usePlayerStoreBase.getState();
    const items = player.getQueue().items;
    const playing = items[player.player.index];
    const seen = new Set<string>();
    if (playing) seen.add(playing.id);
    const extra = items.filter((s) => {
        if (s === playing) return false;
        if (seen.has(s.id)) return true;
        seen.add(s.id);
        return false;
    });
    if (!extra.length) return toast.info({ message: 'No duplicates in the queue' });
    player.clearSelected(extra);
    toast.success({ message: `Removed ${extra.length} duplicate${extra.length === 1 ? '' : 's'}` });
    return undefined;
};

// "Song - Artist" on the clipboard, to paste anywhere
export const copyNowPlaying = () => {
    const song = current();
    if (!song) return toast.info({ message: 'Nothing is playing' });
    navigator.clipboard
        .writeText(`${song.name} - ${song.artistName}`)
        .then(() => toast.success({ message: 'Copied what is playing' }))
        .catch(() => toast.error({ message: 'Could not copy' }));
    return undefined;
};

export const toggleClassicLook = () => {
    const { look, setLook } = useSourStore.getState();
    const ui = look.ui === 'classic' ? 'new' : 'classic';
    setLook({ ui });
    toast.info({ message: ui === 'classic' ? 'Classic look (v0.7)' : 'New look (v0.8)' });
};
