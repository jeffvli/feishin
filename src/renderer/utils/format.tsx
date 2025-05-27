import type { Album, AlbumArtist, Song } from '/@/shared/types/domain-types';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import formatDuration from 'format-duration';

import { Rating } from '/@/shared/components/rating/rating';

dayjs.extend(relativeTime);
dayjs.extend(utc);

const FORMATS: Record<number, string> = Object.freeze({
    0: 'YYYY',
    1: 'MMM YYYY',
    2: 'MMM D, YYYY',
});

const getDateFormat = (key: string): string => {
    const dashes = Math.min(key.split('-').length - 1, 2);
    return FORMATS[dashes];
};

export const formatDateAbsolute = (key: null | string) =>
    key ? dayjs(key).format(getDateFormat(key)) : '';

export const formatDateAbsoluteUTC = (key: null | string) =>
    key ? dayjs.utc(key).format(getDateFormat(key)) : '';

export const formatDateRelative = (key: null | string) => (key ? dayjs(key).fromNow() : '');

export const formatDurationString = (duration: number) => {
    const rawDuration = formatDuration(duration).split(':');

    let string;

    switch (rawDuration.length) {
        case 1:
            string = `${rawDuration[0]} sec`;
            break;
        case 2:
            string = `${rawDuration[0]} min ${rawDuration[1]} sec`;
            break;
        case 3:
            string = `${rawDuration[0]} hr ${rawDuration[1]} min ${rawDuration[2]} sec`;
            break;
        case 4:
            string = `${rawDuration[0]} day ${rawDuration[1]} hr ${rawDuration[2]} min ${rawDuration[3]} sec`;
            break;
    }

    return string;
};

export const formatRating = (item: Album | AlbumArtist | Song) =>
    item.userRating !== null ? (
        <Rating
            readOnly
            value={item.userRating}
        />
    ) : null;

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
