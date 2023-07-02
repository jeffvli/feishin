import { Play } from '/@/renderer/types';

export const PLAY_TYPES = [
    {
        label: 'Play',
        play: Play.NOW,
    },
    {
        label: 'Add to queue',
        play: Play.LAST,
    },
    {
        label: 'Add to queue next',
        play: Play.NEXT,
    },
];
