import isElectron from 'is-electron';
import { PlayerState } from 'renderer/store';
import {
  CrossfadeStyle,
  PlaybackStyle,
  PlaybackType,
  PlayerRepeat,
} from 'types';

export interface WebSettings {
  player: PlayerSettings;
}

export type PlayerSettings = PlayerState['settings'];

const DEFAULT_SETTINGS: WebSettings = {
  player: {
    crossfadeDuration: 5,
    crossfadeStyle: CrossfadeStyle.EqualPower,
    muted: false,
    repeat: PlayerRepeat.All,
    shuffle: false,
    style: PlaybackStyle.Gapless,
    type: isElectron() ? PlaybackType.Local : PlaybackType.Web,
    volume: 0.5,
  },
};

export const useDefaultSettings = () => {
  const currentSettings = localStorage.getItem('settings');

  if (currentSettings) {
    return JSON.parse(currentSettings);
  }

  return localStorage.setItem('settings', JSON.stringify(DEFAULT_SETTINGS));
};
