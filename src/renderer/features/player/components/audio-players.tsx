import { MpvPlayer } from '/@/renderer/features/player/audio-player/mpv-player';
import { WebPlayer } from '/@/renderer/features/player/audio-player/web-player';
import { usePlaybackType } from '/@/renderer/store';
import { PlayerType } from '/@/shared/types/types';

export const AudioPlayers = () => {
    const playbackType = usePlaybackType();

    return (
        <>
            {playbackType === PlayerType.WEB && <WebPlayer />}
            {playbackType === PlayerType.LOCAL && <MpvPlayer />}
        </>
    );
};
