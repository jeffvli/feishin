import { ipcMain } from 'electron';
import Player from 'mpris-service';
import { RelatedArtist } from '../../../renderer/api/types';
import { PlayerRepeat, PlayerStatus, SongUpdate } from '../../../renderer/types';
import { getMainWindow } from '../../main';

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

mprisPlayer.on('volume', (vol: number) => {
    let volume = Math.round(vol * 100);

    if (volume > 100) {
        volume = 100;
    } else if (volume < 0) {
        volume = 0;
    }

    getMainWindow()?.webContents.send('request-volume', {
        volume,
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
    getMainWindow()?.webContents.send('request-position', {
        position: event.position / 1e6,
    });
});

mprisPlayer.on('seek', (event: number) => {
    getMainWindow()?.webContents.send('request-seek', {
        offset: event / 1e6,
    });
});

ipcMain.on('mpris-update-position', (_event, arg) => {
    mprisPlayer.getPosition = () => arg * 1e6;
});

ipcMain.on('mpris-update-seek', (_event, arg) => {
    mprisPlayer.seeked(arg * 1e6);
});

ipcMain.on('update-volume', (_event, volume) => {
    mprisPlayer.volume = Number(volume) / 100;
});

const REPEAT_TO_MPRIS: Record<PlayerRepeat, string> = {
    [PlayerRepeat.ALL]: 'Playlist',
    [PlayerRepeat.ONE]: 'Track',
    [PlayerRepeat.NONE]: 'None',
};

ipcMain.on('update-repeat', (_event, arg: PlayerRepeat) => {
    mprisPlayer.loopStatus = REPEAT_TO_MPRIS[arg];
});

ipcMain.on('update-shuffle', (_event, shuffle: boolean) => {
    mprisPlayer.shuffle = shuffle;
});

ipcMain.on('update-song', (_event, args: SongUpdate) => {
    const { song, status, repeat, shuffle } = args || {};

    try {
        mprisPlayer.playbackStatus = status === PlayerStatus.PLAYING ? 'Playing' : 'Paused';

        if (repeat) {
            mprisPlayer.loopStatus = REPEAT_TO_MPRIS[repeat];
        }

        if (shuffle) {
            mprisPlayer.shuffle = shuffle;
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
            'mpris:trackid': song.id
                ? mprisPlayer.objectPath(`track/${song.id?.replace('-', '')}`)
                : '',
            'xesam:album': song.album || null,
            'xesam:albumArtist': song.albumArtists?.length
                ? song.albumArtists.map((artist) => artist.name)
                : null,
            'xesam:artist': song.artists?.length ? song.artists.map((artist) => artist.name) : null,
            'xesam:discNumber': song.discNumber ? song.discNumber : null,
            'xesam:genre': song.genres?.length ? song.genres.map((genre: any) => genre.name) : null,
            'xesam:title': song.name || null,
            'xesam:trackNumber': song.trackNumber ? song.trackNumber : null,
            'xesam:useCount':
                song.playCount !== null && song.playCount !== undefined ? song.playCount : null,
        };
    } catch (err) {
        console.log(err);
    }
});

export { mprisPlayer };
