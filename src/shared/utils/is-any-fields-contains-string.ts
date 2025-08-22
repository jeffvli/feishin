export function isAnyFieldsContainsString<T>(
    record: T,
    fields: (keyof T)[],
    value: string,
): boolean {
    const lowerCaseValue = value.toLowerCase();
    for (const field of fields) {
        if (typeof record[field] !== 'string') {
            continue;
        }
        const lowerCaseFieldValue = record[field].toLowerCase();
        if (lowerCaseFieldValue.includes(lowerCaseValue)) {
            return true;
        }
    }
    return false;
}
