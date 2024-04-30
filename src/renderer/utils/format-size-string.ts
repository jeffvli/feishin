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
