import isElectron from 'is-electron';

export function wrapImageUrl(url: null | string): null | string {
    if (!url || !isElectron()) return url;
    return `feishin-img://${encodeURIComponent(url)}`;
}
