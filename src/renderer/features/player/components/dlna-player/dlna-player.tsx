import { useEffect } from 'react';

import { usePlayerActions, usePlayerSong, usePlayerStatus } from '/@/renderer/store';
import { PlayerStatus } from '/@/shared/types/types';

export const DlnaPlayer = () => {
    const song = usePlayerSong();
    const status = usePlayerStatus();
    const { mediaNext } = usePlayerActions();

    useEffect(() => {
        if (!song || status !== PlayerStatus.PLAYING) return;

        window.api.ipc.send('dlna-play', {
            metadata: {
                album: song.album,
                artist: song.artistName,
                title: song.name,
            },
            url: song.path,
        });
    }, [song, song?.id, status]);

    useEffect(() => {
        const unsubscribe = window.api.ipc.on('dlna-finished', () => {
            mediaNext();
        });
        return () => unsubscribe();
    }, [mediaNext]);

    return null;
};
