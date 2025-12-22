export const truncateMiddle = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) {
        return text;
    }

    const ellipsis = '…';
    const halfLength = Math.floor((maxLength - ellipsis.length) / 2);
    const start = text.substring(0, halfLength);
    const end = text.substring(text.length - halfLength);

    return `${start}${ellipsis}${end}`;
};
