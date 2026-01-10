import type { Album, AlbumArtist, Song } from '/@/shared/types/domain-types';

import dayjs from 'dayjs';
import 'dayjs/locale/ar';
import 'dayjs/locale/ca';
import 'dayjs/locale/cs';
import 'dayjs/locale/de';
import 'dayjs/locale/en';
import 'dayjs/locale/es';
import 'dayjs/locale/eu';
import 'dayjs/locale/fa';
import 'dayjs/locale/fi';
import 'dayjs/locale/fr';
import 'dayjs/locale/hu';
import 'dayjs/locale/id';
import 'dayjs/locale/it';
import 'dayjs/locale/ja';
import 'dayjs/locale/ko';
import 'dayjs/locale/nb';
import 'dayjs/locale/nl';
import 'dayjs/locale/pl';
import 'dayjs/locale/pt';
import 'dayjs/locale/pt-br';
import 'dayjs/locale/ru';
import 'dayjs/locale/sl';
import 'dayjs/locale/sr';
import 'dayjs/locale/sv';
import 'dayjs/locale/ta';
import 'dayjs/locale/tr';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/zh-tw';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import formatDuration from 'format-duration';

import i18n from '/@/i18n/i18n';
import { Rating } from '/@/shared/components/rating/rating';

dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(localizedFormat);

const getDayjsLocale = (i18nLang: string): string => {
    const localeMap: Record<string, string> = {
        ar: 'ar',
        ca: 'ca',
        cs: 'cs',
        de: 'de',
        en: 'en',
        es: 'es',
        eu: 'eu',
        fa: 'fa',
        fi: 'fi',
        fr: 'fr',
        hu: 'hu',
        id: 'id',
        it: 'it',
        ja: 'ja',
        ko: 'ko',
        'nb-NO': 'nb',
        nl: 'nl',
        pl: 'pl',
        pt: 'pt',
        'pt-BR': 'pt-br',
        ru: 'ru',
        sl: 'sl',
        sr: 'sr',
        sv: 'sv',
        ta: 'ta',
        tr: 'tr',
        'zh-Hans': 'zh-cn',
        'zh-Hant': 'zh-tw',
    };

    return localeMap[i18nLang] || 'en';
};

const updateDayjsLocale = () => {
    const dayjsLocale = getDayjsLocale(i18n.language);
    dayjs.locale(dayjsLocale);
};

// Set initial locale
updateDayjsLocale();

// Listen for i18n language changes
i18n.on('languageChanged', updateDayjsLocale);

export const formatDateAbsolute = (key: null | string) => (key ? dayjs(key).format('ll') : '');

export const formatDateAbsoluteUTC = (key: null | string) =>
    key ? dayjs.utc(key).format('ll') : '';

export const formatHrDateTime = (key: null | string) => (key ? dayjs(key).format('lll') : '');

export const formatDateRelative = (key: null | string) => (key ? dayjs(key).fromNow() : '');

export const formatDurationString = (duration: number) => {
    const rawDuration = formatDuration(duration, { leading: false }).split(':');

    const formattedDuration = rawDuration.map((part) => {
        // Remove leading zero
        return part.replace(/^0/, '');
    });

    let string: string = '';

    switch (rawDuration.length) {
        case 1:
            string = `${formattedDuration[0]}${i18n.t('datetime.secondShort')}`;
            break;
        case 2:
            string = `${formattedDuration[0]}${i18n.t('datetime.minuteShort')} ${formattedDuration[1]}${i18n.t('datetime.secondShort')}`;
            break;
        case 3:
            string = `${formattedDuration[0]}${i18n.t('datetime.hourShort')} ${formattedDuration[1]}${i18n.t('datetime.minuteShort')} ${formattedDuration[2]}${i18n.t('datetime.secondShort')}`;
            break;
        case 4:
            string = `${formattedDuration[0]}${i18n.t('datetime.dayShort')} ${formattedDuration[1]}${i18n.t('datetime.hourShort')} ${formattedDuration[2]}${i18n.t('datetime.minuteShort')} ${formattedDuration[3]}${i18n.t('datetime.secondShort')}`;
            break;
    }

    return string;
};

export const formatDurationStringShort = (duration: number) => {
    const rawDuration = formatDuration(duration).split(':');

    if (rawDuration.length === 4) {
        return `${rawDuration[0]}${i18n.t('datetime.dayShort')} ${rawDuration[1]}${i18n.t('datetime.hourShort')}`;
    } else if (rawDuration.length === 3) {
        return `${rawDuration[0]}${i18n.t('datetime.hourShort')} ${rawDuration[1]}${i18n.t('datetime.minuteShort')}`;
    } else if (rawDuration.length === 2) {
        return `${rawDuration[0]}${i18n.t('datetime.minuteShort')} ${rawDuration[1]}${i18n.t('datetime.secondShort')}`;
    } else if (rawDuration.length === 1) {
        return `${rawDuration[0]}${i18n.t('datetime.secondShort')}`;
    }

    return rawDuration;
};

export const formatRating = (item: Album | AlbumArtist | Song) =>
    item.userRating !== null ? <Rating readOnly value={item.userRating} /> : null;

const SIZES = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];

export const formatSizeString = (size?: number): string => {
    let count = 0;
    let finalSize = size ?? 0;
    while (finalSize > 1024) {
        finalSize /= 1024;
        count += 1;
    }

    return `${finalSize.toFixed(2)} ${SIZES[count]}`;
};
