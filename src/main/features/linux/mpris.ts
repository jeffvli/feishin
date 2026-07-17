import { ipcMain } from 'electron';
import Player from 'mpris-service';

import { getMainWindow } from '/@/main/index';
import { MPV_VOLUME_MAX_CEILING } from '/@/shared/constants/volume';
import { QueueSong } from '/@/shared/types/domain-types';
import { PlayerRepeat, PlayerStatus } from '/@/shared/types/types';

const mprisPlayer = Player({
    identity: 'Feishin',
    maximumRate: 1.0,
    minimumRate: 1.0,
    name: 'Feishin',
    rate: 1.0,
    supportedInterfaces: ['player'],
    supportedMimeTypes: ['audio/mpeg', 'application/ogg'],
    supportedUriSchemes: ['file'],
});

mprisPlayer.on('quit', () => {
    process.exit();
});

const hasData = (): boolean => {
    return mprisPlayer.metadata && !!mprisPlayer.metadata['mpris:length'];
};

mprisPlayer.on('stop', () => {
    getMainWindow()?.webContents.send('renderer-player-stop');
    mprisPlayer.playbackStatus = 'Paused';
});

mprisPlayer.on('pause', () => {
    if (!hasData()) return;
    getMainWindow()?.webContents.send('renderer-player-pause');
    mprisPlayer.playbackStatus = 'Paused';
});

mprisPlayer.on('play', () => {
    if (!hasData()) return;
    getMainWindow()?.webContents.send('renderer-player-play');
    mprisPlayer.playbackStatus = 'Playing';
});

mprisPlayer.on('playpause', () => {
    if (!hasData()) return;
    getMainWindow()?.webContents.send('renderer-player-play-pause');
    if (mprisPlayer.playbackStatus !== 'Playing') {
        mprisPlayer.playbackStatus = 'Playing';
    } else {
        mprisPlayer.playbackStatus = 'Paused';
    }
});

mprisPlayer.on('next', () => {
    if (!hasData()) return;
    getMainWindow()?.webContents.send('renderer-player-next');

    if (mprisPlayer.playbackStatus !== 'Playing') {
        mprisPlayer.playbackStatus = 'Playing';
    }
});

mprisPlayer.on('previous', () => {
    if (!hasData()) return;
    getMainWindow()?.webContents.send('renderer-player-previous');

    if (mprisPlayer.playbackStatus !== 'Playing') {
        mprisPlayer.playbackStatus = Player.PLAYBACK_STATUS_PLAYING;
    }
});

// The renderer clamps to the active backend's maximum (mpv's --volume-max when
// mpv is selected), since that range is derived from settings the renderer owns.
// Only a sanity range is enforced here.
mprisPlayer.on('volume', (vol: number) => {
    const volume = Math.min(MPV_VOLUME_MAX_CEILING, Math.max(0, Math.round(vol * 100)));

    getMainWindow()?.webContents.send('request-volume', {
        volume,
    });

    mprisPlayer.volume = volume / 100;
});

mprisPlayer.on('shuffle', (event: boolean) => {
    getMainWindow()?.webContents.send('mpris-request-toggle-shuffle', { shuffle: event });
    mprisPlayer.shuffle = event;
});

mprisPlayer.on('loopStatus', (event: string) => {
    getMainWindow()?.webContents.send('mpris-request-toggle-repeat', { repeat: event });
    mprisPlayer.loopStatus = event;
});

mprisPlayer.on('position', (event: any) => {
    getMainWindow()?.webContents.send('request-position', {
        position: event.position / 1e6,
    });
});

mprisPlayer.on('seek', (event: number) => {
    getMainWindow()?.webContents.send('request-seek', {
        offset: event / 1e6,
    });
});

mprisPlayer.on('raise', () => {
    getMainWindow()?.show();
});

ipcMain.on('update-position', (_event, arg: number) => {
    mprisPlayer.getPosition = () => arg * 1e6;
});

ipcMain.on('update-seek', (_event, arg) => {
    mprisPlayer.seeked(arg * 1e6);
});

ipcMain.on('update-volume', (_event, volume) => {
    mprisPlayer.volume = Number(volume) / 100;
});

ipcMain.on('update-playback', (_event, status: PlayerStatus) => {
    mprisPlayer.playbackStatus =
        status === PlayerStatus.PLAYING
            ? 'Playing'
            : status === PlayerStatus.STOPPED
              ? 'Stopped'
              : 'Paused';
});

const REPEAT_TO_MPRIS: Record<PlayerRepeat, string> = {
    [PlayerRepeat.ALL]: 'Playlist',
    [PlayerRepeat.NONE]: 'None',
    [PlayerRepeat.ONE]: 'Track',
};

ipcMain.on('update-repeat', (_event, arg: PlayerRepeat) => {
    mprisPlayer.loopStatus = REPEAT_TO_MPRIS[arg];
});

ipcMain.on('update-shuffle', (_event, shuffle: boolean) => {
    mprisPlayer.shuffle = shuffle;
});

ipcMain.on(
    'update-song',
    (_event, song: QueueSong | undefined, imageUrl: null | string | undefined) => {
        try {
            if (!song?.id) {
                mprisPlayer.metadata = {};
                return;
            }

            // If the served id is an empty string, this is a radio
            // Use a limited subset of the fields
            if (song._serverId === '') {
                // The id as passed in from use-mpris is radio- plus the radio ID
                // If there are spaces or some other characters, this causes MPRIS to error and
                // disconnect the bus. To prevent this, just use a fake track/radio
                mprisPlayer.metadata = {
                    'mpris:trackid': mprisPlayer.objectPath(`track/radio`),
                    'xesam:album': song.album || null,
                    'xesam:artist': song.artists?.length
                        ? song.artists.map((artist) => artist.name)
                        : null,
                    'xesam:title': song.name || null,
                };
                return;
            }

            mprisPlayer.metadata = {
                'mpris:artUrl': imageUrl || null,
                'mpris:length': song.duration ? Math.round((song.duration || 0) * 1e3) : null,
                'mpris:trackid': song.id
                    ? mprisPlayer.objectPath(`track/${song.id?.replace('-', '')}`)
                    : '',
                'xesam:album': song.album || null,
                'xesam:albumArtist': song.albumArtists?.length
                    ? song.albumArtists.map((artist) => artist.name)
                    : null,
                'xesam:artist': song.artists?.length
                    ? song.artists.map((artist) => artist.name)
                    : null,
                'xesam:audioBpm': song.bpm,
                // Comment is a `list of strings` type
                'xesam:comment': song.comment ? [song.comment] : null,
                'xesam:contentCreated': song.releaseDate,
                'xesam:discNumber': song.discNumber ? song.discNumber : null,
                'xesam:genre': song.genres?.length
                    ? song.genres.map((genre: any) => genre.name)
                    : null,
                'xesam:lastUsed': song.lastPlayedAt,
                'xesam:title': song.name || null,
                'xesam:trackNumber': song.trackNumber ? song.trackNumber : null,
                'xesam:useCount':
                    song.playCount !== null && song.playCount !== undefined ? song.playCount : null,
                // User ratings are only on Navidrome/Subsonic and are on a scale of 1-5
                'xesam:userRating': song.userRating ? song.userRating / 5 : null,
            };
        } catch (err) {
            console.error(err);
        }
    },
);

export { mprisPlayer };
