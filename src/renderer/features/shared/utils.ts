import i18n from '/@/i18n/i18n';
import { Play } from '/@/renderer/types';

export const PLAY_TYPES = [
    {
        label: i18n.t('player.play', { postProcess: 'sentenceCase' }),
        play: Play.NOW,
    },
    {
        label: i18n.t('player.addLast', { postProcess: 'sentenceCase' }),
        play: Play.LAST,
    },
    {
        label: i18n.t('player.addNext', { postProcess: 'sentenceCase' }),
        play: Play.NEXT,
    },
];
