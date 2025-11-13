/**
 * Creates a function to extract row ID from an item based on the getRowId configuration.
 *
 * @param getRowId - Either a string property name, a function that extracts the ID, or undefined to use default 'id' property
 * @returns A function that extracts the row ID from an item
 */
export const createExtractRowId = (
    getRowId?: ((item: unknown) => string) | string,
): ((item: unknown) => string | undefined) => {
    return (item: unknown): string | undefined => {
        if (!item || typeof item !== 'object') {
            return undefined;
        }

        if (getRowId === undefined) {
            // Default behavior: use 'id' property
            return (item as any).id;
        }

        if (typeof getRowId === 'string') {
            // getRowId is a property name
            return (item as any)[getRowId];
        }

        // getRowId is a function
        return getRowId(item);
    };
};
