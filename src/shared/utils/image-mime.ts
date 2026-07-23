/** Guesses image MIME type from a file path or filename extension. */
export const getImageMimeTypeFromPath = (filePath: string): string => {
    if (/\.png$/i.test(filePath)) return 'image/png';
    if (/\.gif$/i.test(filePath)) return 'image/gif';
    if (/\.webp$/i.test(filePath)) return 'image/webp';
    return 'image/jpeg';
};
