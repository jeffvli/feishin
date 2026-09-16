export const HEADER_NAME_PATTERN = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;

export type CustomHeaderEntry = {
    id: string;
    key: string;
    value: string;
};

export const isCustomHeaderKeyValid = (key: string): boolean => {
    return HEADER_NAME_PATTERN.test(key.trim());
};

export const normalizeCustomHeaders = (
    entries: CustomHeaderEntry[] | Record<string, string> | undefined,
): Record<string, string> => {
    if (!entries) return {};

    if (Array.isArray(entries)) {
        return entries.reduce<Record<string, string>>((result, entry) => {
            const key = entry.key.trim();
            const value = entry.value.trim();
            if (key && value && HEADER_NAME_PATTERN.test(key)) {
                result[key] = value;
            }
            return result;
        }, {});
    }

    return { ...entries };
};

export const mergeCustomHeaders = (
    customHeaders: Record<string, string> | undefined,
    requiredHeaders: Record<string, string> = {},
): Record<string, string> => ({
    ...normalizeCustomHeaders(customHeaders),
    ...requiredHeaders,
});

export const areCustomHeadersEqual = (
    a?: Record<string, string>,
    b?: Record<string, string>,
): boolean => {
    const normA = normalizeCustomHeaders(a);
    const normB = normalizeCustomHeaders(b);
    const keysA = Object.keys(normA);
    const keysB = Object.keys(normB);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
        if (normA[key] !== normB[key]) return false;
    }

    return true;
};
