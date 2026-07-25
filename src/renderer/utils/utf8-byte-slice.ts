const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export const sliceUtf8Bytes = (value: string, byteStart: number, byteEnd: number): string => {
    const bytes = textEncoder.encode(value);
    const start = Math.max(0, byteStart);
    const end = Math.min(bytes.length - 1, byteEnd);

    if (start > end || bytes.length === 0) {
        return '';
    }

    return textDecoder.decode(bytes.slice(start, end + 1));
};
