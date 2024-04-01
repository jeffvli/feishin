import { app } from 'electron';

class NowPlayingManager {
  setNowPlaying(
    albumTitle: string | null,
    albumTrackCount: number,
    albumTrackNumber: number,
    artist: string | null,
    artwork: any, // Electron.NativeImage | null,
    composer: string | null,
    discCount: number,
    discNumber: number,
    genre: string | null,
    mediaType: string | null,
    persistentID: string | null,
    playbackDuration: number,
    title: string | null
  ): void;
}

const nowPlayingManagerPath =  pathJoin(app.getAppPath(), 'build', 'Release', 'NowPlayingManager.node');
const nowPlayingManager : NowPlayingManager = process.dlopen(nowPlayingManagerPath, 'NowPlayingManager');

console.log(nowPlayingManager);

export default nowPlayingManager


function pathJoin(...args: string[]): string {
  return args.join('/');
}
