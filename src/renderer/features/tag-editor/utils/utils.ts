import type { BatchFileError } from '/@/shared/types/tag-editor';

export const base64ToBytes = (base64: string): Uint8Array => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
};

export const bytesToBase64 = (bytes: Uint8Array): string => {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
};

export const formatBatchFileErrors = (failed: BatchFileError[], summary: string): string => {
    const details = failed
        .slice(0, 3)
        .map((f) => f.path.split(/[/\\]/).pop() ?? f.path)
        .join(', ');
    const suffix = failed.length > 3 ? '…' : '';
    return `${summary} ${details}${suffix}`;
};
