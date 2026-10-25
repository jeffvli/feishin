import type { PlayerFilter } from '/@/renderer/store';

// Filters missing a field, operator or value are ignored
export const isActivePlayerFilter = (filter: PlayerFilter): boolean =>
    Boolean(
        filter.isEnabled &&
        filter.field &&
        filter.operator &&
        filter.value !== undefined &&
        filter.value !== null &&
        filter.value !== '',
    );

export const matchesPlayerFilterValue = (
    songValue: boolean | null | number | string | undefined,
    filter: PlayerFilter,
): boolean => {
    const filterValue = filter.value;

    // Handle null/undefined values
    if (songValue === null || songValue === undefined) {
        return false;
    }

    switch (filter.operator) {
        case 'contains':
            return String(songValue).toLowerCase().includes(String(filterValue).toLowerCase());
        case 'endsWith':
            return String(songValue).toLowerCase().endsWith(String(filterValue).toLowerCase());
        case 'is':
            return String(songValue).toLowerCase() === String(filterValue).toLowerCase();
        case 'isNot':
            return String(songValue).toLowerCase() !== String(filterValue).toLowerCase();
        case 'lt':
            return Number(songValue) < Number(filterValue);
        case 'notContains':
            return !String(songValue).toLowerCase().includes(String(filterValue).toLowerCase());
        case 'regex': {
            try {
                const regex = new RegExp(String(filterValue), 'i');
                return regex.test(String(songValue));
            } catch {
                // Invalid regex pattern, don't match
                return false;
            }
        }
        case 'gt':
            return Number(songValue) > Number(filterValue);
        case 'startsWith':
            return String(songValue).toLowerCase().startsWith(String(filterValue).toLowerCase());
        default:
            return true;
    }
};
