import { SimilarSongsList } from '/@/renderer/features/similar-songs/components/similar-songs-list';
import { usePlayerSong } from '/@/renderer/store';

export const FullScreenSimilarSongs = () => {
    const currentSong = usePlayerSong();

    return currentSong?.id ? (
        <div style={{ height: '100%', width: '100%' }}>
            <SimilarSongsList fullScreen song={currentSong} />
        </div>
    ) : null;
};
