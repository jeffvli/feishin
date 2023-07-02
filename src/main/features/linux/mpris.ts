import { ipcMain } from 'electron';
import Player from 'mpris-service';
import { QueueSong, RelatedArtist } from '../../../renderer/api/types';
import { getMainWindow } from '../../main';
import { PlayerRepeat, PlayerShuffle, PlayerStatus } from '/@/renderer/types';

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

mprisPlayer.on('stop', () => {
    getMainWindow()?.webContents.send('renderer-player-stop');
    mprisPlayer.playbackStatus = 'Paused';
});

mprisPlayer.on('pause', () => {
    getMainWindow()?.webContents.send('renderer-player-pause');
    mprisPlayer.playbackStatus = 'Paused';
});

mprisPlayer.on('play', () => {
    getMainWindow()?.webContents.send('renderer-player-play');
    mprisPlayer.playbackStatus = 'Playing';
});

mprisPlayer.on('playpause', () => {
    getMainWindow()?.webContents.send('renderer-player-play-pause');
    if (mprisPlayer.playbackStatus !== 'Playing') {
        mprisPlayer.playbackStatus = 'Playing';
    } else {
        mprisPlayer.playbackStatus = 'Paused';
    }
});

mprisPlayer.on('next', () => {
    getMainWindow()?.webContents.send('renderer-player-next');

    if (mprisPlayer.playbackStatus !== 'Playing') {
        mprisPlayer.playbackStatus = 'Playing';
    }
});

mprisPlayer.on('previous', () => {
    getMainWindow()?.webContents.send('renderer-player-previous');

    if (mprisPlayer.playbackStatus !== 'Playing') {
        mprisPlayer.playbackStatus = Player.PLAYBACK_STATUS_PLAYING;
    }
});

mprisPlayer.on('volume', (event: any) => {
    getMainWindow()?.webContents.send('mpris-request-volume', {
        volume: event,
    });
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
    getMainWindow()?.webContents.send('mpris-request-position', {
        position: event.position / 1e6,
    });
});

mprisPlayer.on('seek', (event: number) => {
    getMainWindow()?.webContents.send('mpris-request-seek', {
        offset: event / 1e6,
    });
});

ipcMain.on('mpris-update-position', (_event, arg) => {
    mprisPlayer.getPosition = () => arg * 1e6;
});

ipcMain.on('mpris-update-seek', (_event, arg) => {
    mprisPlayer.seeked(arg * 1e6);
});

ipcMain.on('mpris-update-volume', (_event, arg) => {
    mprisPlayer.volume = Number(arg);
});

ipcMain.on('mpris-update-repeat', (_event, arg) => {
    mprisPlayer.loopStatus = arg;
});

ipcMain.on('mpris-update-shuffle', (_event, arg) => {
    mprisPlayer.shuffle = arg;
});

ipcMain.on(
    'mpris-update-song',
    (
        _event,
        args: {
            currentTime: number;
            repeat: PlayerRepeat;
            shuffle: PlayerShuffle;
            song: QueueSong;
            status: PlayerStatus;
        },
    ) => {
        const { song, status, repeat, shuffle } = args || {};

        try {
            mprisPlayer.playbackStatus = status;

            if (repeat) {
                mprisPlayer.loopStatus =
                    repeat === 'all' ? 'Playlist' : repeat === 'one' ? 'Track' : 'None';
            }

            if (shuffle) {
                mprisPlayer.shuffle = shuffle !== 'none';
            }

            if (!song) return;

            const upsizedImageUrl = song.imageUrl
                ? song.imageUrl
                      ?.replace(/&size=\d+/, '&size=300')
                      .replace(/\?width=\d+/, '?width=300')
                      .replace(/&height=\d+/, '&height=300')
                : null;

            mprisPlayer.metadata = {
                'mpris:artUrl': upsizedImageUrl,
                'mpris:length': song.duration ? Math.round((song.duration || 0) * 1e6) : null,
                'mpris:trackid': song?.id
                    ? mprisPlayer.objectPath(`track/${song.id?.replace('-', '')}`)
                    : '',
                'xesam:album': song.album || null,
                'xesam:albumArtist': song.albumArtists?.length ? song.albumArtists[0].name : null,
                'xesam:artist':
                    song.artists?.length !== 0
                        ? song.artists?.map((artist: RelatedArtist) => artist.name)
                        : null,
                'xesam:discNumber': song.discNumber ? song.discNumber : null,
                'xesam:genre': song.genres?.length
                    ? song.genres.map((genre: any) => genre.name)
                    : null,
                'xesam:title': song.name || null,
                'xesam:trackNumber': song.trackNumber ? song.trackNumber : null,
                'xesam:useCount':
                    song.playCount !== null && song.playCount !== undefined ? song.playCount : null,
            };
        } catch (err) {
            console.log(err);
        }
    },
);
