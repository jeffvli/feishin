import { AppTheme } from '/@/shared/themes/app-theme-types';

export interface Holiday {
    emoji: string;
    greeting: string;
    id: string;
    name: string;
    particles: Particles;
    theme: AppTheme;
}

export type Particles =
    | 'bats'
    | 'clovers'
    | 'confetti'
    | 'eggs'
    | 'fireworks'
    | 'hearts'
    | 'lanterns'
    | 'leaves'
    | 'snow'
    | 'suns';

const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const between = (d: Date, from: Date, to: Date) => day(d) >= day(from) && day(d) <= day(to);
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

// Easter Sunday (Gregorian, anonymous algorithm)
export const easter = (year: number) => {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const dayOfMonth = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, dayOfMonth);
};

// US Thanksgiving: the fourth Thursday of November
export const thanksgiving = (year: number) => {
    const first = new Date(year, 10, 1);
    const offset = (4 - first.getDay() + 7) % 7;
    return new Date(year, 10, 1 + offset + 21);
};

// Lunar New Year days (first day of the lunar year)
const LUNAR: Record<number, [number, number]> = {
    2026: [1, 17],
    2027: [1, 6],
    2028: [0, 26],
    2029: [1, 13],
    2030: [1, 3],
    2031: [0, 23],
    2032: [1, 11],
    2033: [0, 31],
    2034: [1, 19],
    2035: [1, 8],
};

const HOLIDAYS: Array<Holiday & { when: (d: Date) => boolean }> = [
    {
        emoji: '\u{1F386}',
        greeting: 'Happy New Year',
        id: 'new-year',
        name: "New Year's",
        particles: 'fireworks',
        theme: AppTheme.SOUR_NEW_YEAR,
        when: (d) =>
            (d.getMonth() === 11 && d.getDate() === 31) || (d.getMonth() === 0 && d.getDate() <= 2),
    },
    {
        emoji: '\u{1F3EE}',
        greeting: 'Happy Lunar New Year',
        id: 'lunar',
        name: 'Lunar New Year',
        particles: 'lanterns',
        theme: AppTheme.SOUR_LUNAR,
        when: (d) => {
            const at = LUNAR[d.getFullYear()];
            if (!at) return false;
            const start = new Date(d.getFullYear(), at[0], at[1]);
            return between(d, addDays(start, -1), addDays(start, 4));
        },
    },
    {
        emoji: '\u{1F496}',
        greeting: "Happy Valentine's Day",
        id: 'valentine',
        name: "Valentine's Day",
        particles: 'hearts',
        theme: AppTheme.SOUR_VALENTINE,
        when: (d) => d.getMonth() === 1 && d.getDate() >= 10 && d.getDate() <= 14,
    },
    {
        emoji: '☘️',
        greeting: "Happy St Patrick's Day",
        id: 'st-patrick',
        name: "St Patrick's Day",
        particles: 'clovers',
        theme: AppTheme.SOUR_SHAMROCK,
        when: (d) => d.getMonth() === 2 && d.getDate() >= 15 && d.getDate() <= 17,
    },
    {
        emoji: '\u{1F423}',
        greeting: 'Happy Easter',
        id: 'easter',
        name: 'Easter',
        particles: 'eggs',
        theme: AppTheme.SOUR_EASTER,
        when: (d) => {
            const e = easter(d.getFullYear());
            return between(d, addDays(e, -2), addDays(e, 1));
        },
    },
    {
        emoji: '☀️',
        greeting: 'Summer is here',
        id: 'summer',
        name: 'First week of summer',
        particles: 'suns',
        theme: AppTheme.SOUR_SUMMER,
        when: (d) => d.getMonth() === 5 && d.getDate() >= 20 && d.getDate() <= 27,
    },
    {
        emoji: '\u{1F383}',
        greeting: 'Spooky season',
        id: 'halloween',
        name: 'Halloween (all of October)',
        particles: 'bats',
        theme: AppTheme.SOUR_HALLOWEEN,
        when: (d) => d.getMonth() === 9,
    },
    {
        emoji: '\u{1F342}',
        greeting: 'Happy Thanksgiving',
        id: 'thanksgiving',
        name: 'Thanksgiving',
        particles: 'leaves',
        theme: AppTheme.SOUR_AUTUMN,
        when: (d) => {
            const t = thanksgiving(d.getFullYear());
            return between(d, addDays(t, -3), addDays(t, 3));
        },
    },
    {
        emoji: '\u{1F384}',
        greeting: 'Happy holidays',
        id: 'winter',
        name: 'Christmas (December)',
        particles: 'snow',
        theme: AppTheme.SOUR_WINTER,
        when: (d) => d.getMonth() === 11 && d.getDate() <= 30,
    },
];

const pick = (h: Holiday): Holiday => ({
    emoji: h.emoji,
    greeting: h.greeting,
    id: h.id,
    name: h.name,
    particles: h.particles,
    theme: h.theme,
});

export const HOLIDAY_LIST: Holiday[] = HOLIDAYS.map(pick);

export const currentHoliday = (d = new Date()): Holiday | null => {
    const found = HOLIDAYS.find((h) => h.when(d));
    return found ? pick(found) : null;
};

export const holidayById = (id: null | string) => HOLIDAY_LIST.find((h) => h.id === id) ?? null;
