import { IpcRendererEvent } from 'electron';
import { PlayerData, PlayerState } from './store';
import { QueueSong } from '/@/renderer/api/types';

declare global {
  interface Window {
    electron: {
      browser: any;
      ipc: any;
      ipcRenderer: {
        APP_RESTART(): void;
        LYRIC_FETCH(data: QueueSong): void;
        LYRIC_GET(event: IpcRendererEvent, songName: string, source: string, lyric: string): void;
        PASSWORD_CLEAR(): void;
        PASSWORD_GET(server: string): Promise<string | null>;
        PASSWORD_REMOVE(server: string): void;
        PASSWORD_SET(password: string, server: string): Promise<boolean>;
        PLAYER_AUTO_NEXT(data: PlayerData): void;
        PLAYER_CURRENT_TIME(): void;
        PLAYER_GET_TIME(): number | undefined;
        PLAYER_MEDIA_KEYS_DISABLE(): void;
        PLAYER_MEDIA_KEYS_ENABLE(): void;
        PLAYER_MUTE(): void;
        PLAYER_NEXT(): void;
        PLAYER_PAUSE(): void;
        PLAYER_PLAY(): void;
        PLAYER_PREVIOUS(): void;
        PLAYER_RESTORE_DATA(): void;
        PLAYER_SAVE_QUEUE(data: PlayerState): void;
        PLAYER_SEEK(seconds: number): void;
        PLAYER_SEEK_TO(seconds: number): void;
        PLAYER_SET_QUEUE(data: PlayerData): void;
        PLAYER_SET_QUEUE_NEXT(data: PlayerData): void;
        PLAYER_STOP(): void;
        PLAYER_VOLUME(value: number): void;
        RENDERER_PLAYER_AUTO_NEXT(cb: (event: IpcRendererEvent, data: any) => void): void;
        RENDERER_PLAYER_CURRENT_TIME(cb: (event: IpcRendererEvent, data: any) => void): void;
        RENDERER_PLAYER_NEXT(cb: (event: IpcRendererEvent, data: any) => void): void;
        RENDERER_PLAYER_PAUSE(cb: (event: IpcRendererEvent, data: any) => void): void;
        RENDERER_PLAYER_PLAY(cb: (event: IpcRendererEvent, data: any) => void): void;
        RENDERER_PLAYER_PLAY_PAUSE(cb: (event: IpcRendererEvent, data: any) => void): void;
        RENDERER_PLAYER_PREVIOUS(cb: (event: IpcRendererEvent, data: any) => void): void;
        RENDERER_PLAYER_RESTORE_QUEUE(cb: (event: IpcRendererEvent, data: any) => void): void;
        RENDERER_PLAYER_SAVE_QUEUE(cb: (event: IpcRendererEvent, data: any) => void): void;
        RENDERER_PLAYER_STOP(cb: (event: IpcRendererEvent, data: any) => void): void;
        SETTINGS_GET(data: { property: string }): any;
        SETTINGS_SET(data: { property: string; value: any }): void;
        removeAllListeners(value: string): void;
        windowClose(): void;
        windowMaximize(): void;
        windowMinimize(): void;
        windowUnmaximize(): void;
      };
      localSettings: any;
      lyrics: any;
      mpris: any;
      mpvPlayer: any;
      mpvPlayerListener: any;
      utils: any;
    };
  }
}

export {};
