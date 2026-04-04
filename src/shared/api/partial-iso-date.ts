const PARTIAL_ISO = /^\d{4}(-\d{2}(-\d{2})?)?$/;

export const coerceYear = (value: null | number | undefined): number => {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return 0;
    }

    return value;
};

// Parses `YYYY`, `YYYY-MM`, or `YYYY-MM-DD`. Returns the trimmed string as `date` when valid.
export const parsePartialIsoDate = (
    input: null | string | undefined,
): { date: null | string; year: number } => {
    if (input == null || typeof input !== 'string') {
        return { date: null, year: 0 };
    }

    const s = input.trim();
    if (!s || !PARTIAL_ISO.test(s)) {
        return { date: null, year: 0 };
    }

    const year = Number.parseInt(s.slice(0, 4), 10);
    if (!Number.isFinite(year)) {
        return { date: null, year: 0 };
    }

    return { date: s, year };
};

// Like `parsePartialIsoDate`, but if the value is a full ISO datetime, uses the `YYYY-MM-DD` prefix.
export const parsePartialIsoDateFromApi = (
    input: null | string | undefined,
): { date: null | string; year: number } => {
    const direct = parsePartialIsoDate(input);
    if (direct.date) {
        return direct;
    }

    if (input != null && typeof input === 'string' && input.length >= 10) {
        return parsePartialIsoDate(input.slice(0, 10));
    }

    return { date: null, year: 0 };
};
