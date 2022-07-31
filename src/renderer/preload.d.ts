import { IpcRendererEvent } from 'electron';
import { PlayerData } from './store';

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        PLAYER_AUTO_NEXT(data: PlayerData): void;
        PLAYER_CURRENT_TIME(): void;
        PLAYER_MUTE(): void;
        PLAYER_NEXT(): void;
        PLAYER_PAUSE(): void;
        PLAYER_PLAY(): void;
        PLAYER_PREVIOUS(): void;
        PLAYER_SEEK(seconds: number): void;
        PLAYER_SEEK_TO(seconds: number): void;
        PLAYER_SET_QUEUE(data: PlayerData): void;
        PLAYER_SET_QUEUE_NEXT(data: PlayerData): void;
        PLAYER_STOP(): void;
        PLAYER_VOLUME(value: number): void;
        RENDERER_PLAYER_AUTO_NEXT(
          cb: (event: IpcRendererEvent, data: any) => void
        ): void;
        RENDERER_PLAYER_CURRENT_TIME(
          cb: (event: IpcRendererEvent, data: any) => void
        ): void;
        RENDERER_PLAYER_PAUSE(
          cb: (event: IpcRendererEvent, data: any) => void
        ): void;
        RENDERER_PLAYER_PLAY(
          cb: (event: IpcRendererEvent, data: any) => void
        ): void;
        RENDERER_PLAYER_STOP(
          cb: (event: IpcRendererEvent, data: any) => void
        ): void;
        windowClose(): void;
        windowMaximize(): void;
        windowMinimize(): void;
        windowUnmaximize(): void;
      };
    };
  }
}

export {};
