import isElectron from 'is-electron';
import {
  CrossfadeStyle,
  PlaybackStyle,
  PlaybackType,
  PlayerRepeat,
} from '../../../../types';
import { PlayerState } from '../../../store';

export interface WebSettings {
  player: PlayerSettings;
}

export type PlayerSettings = PlayerState['settings'];

const DEFAULT_SETTINGS: WebSettings = {
  player: {
    crossfadeDuration: 5,
    crossfadeStyle: CrossfadeStyle.EQUALPOWER,
    muted: false,
    repeat: PlayerRepeat.ALL,
    shuffle: false,
    style: PlaybackStyle.GAPLESS,
    type: isElectron() ? PlaybackType.LOCAL : PlaybackType.WEB,
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
