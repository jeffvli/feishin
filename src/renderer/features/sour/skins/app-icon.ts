import isElectron from 'is-electron';

import appIcon from '../../../../../assets/icons/256x256.png';

// Icon packs: the Sour Player icon recoloured (and a holiday emoji in the corner during holidays),
// drawn here and handed to the window as its taskbar/dock icon.
export const ICON_PACKS: { filter: string; id: string; label: string }[] = [
    { filter: 'none', id: 'classic', label: 'Classic' },
    { filter: 'hue-rotate(60deg) saturate(1.2)', id: 'lime', label: 'Lime' },
    { filter: 'hue-rotate(-45deg) saturate(1.3)', id: 'grapefruit', label: 'Grapefruit' },
    { filter: 'hue-rotate(170deg)', id: 'blueberry', label: 'Blueberry' },
    { filter: 'hue-rotate(250deg) saturate(1.2)', id: 'grape', label: 'Grape' },
    { filter: 'sepia(1) saturate(3) brightness(1.05)', id: 'gold', label: 'Gold' },
    { filter: 'grayscale(1) contrast(1.2)', id: 'mono', label: 'Mono' },
    { filter: 'invert(1) hue-rotate(180deg)', id: 'negative', label: 'Negative' },
    { filter: 'none', id: 'pixel', label: 'Pixel' },
];

const load = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('icon'));
        img.src = src;
    });

export const drawAppIcon = async (pack: string, emoji: null | string, pixel = false) => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const img = await load(appIcon);
    const filter = ICON_PACKS.find((p) => p.id === pack)?.filter ?? 'none';
    if (pixel) {
        // pixel pack: draw tiny, then scale up without smoothing
        const small = document.createElement('canvas');
        small.width = 32;
        small.height = 32;
        small.getContext('2d')?.drawImage(img, 0, 0, 32, 32);
        ctx.imageSmoothingEnabled = false;
        ctx.filter = filter;
        ctx.drawImage(small, 0, 0, size, size);
    } else {
        ctx.filter = filter;
        ctx.drawImage(img, 0, 0, size, size);
    }
    ctx.filter = 'none';
    if (emoji) {
        await document.fonts.load('96px "Sour Emoji"', emoji).catch(() => []);
        ctx.font = '104px "Sour Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, size - 62, size - 58);
    }
    return canvas.toDataURL('image/png');
};

let lastSent = '';
export const applyAppIcon = async (pack: string, emoji: null | string) => {
    if (!isElectron()) return;
    const id = `${pack}:${emoji ?? ''}`;
    if (id === lastSent || (id === 'classic:' && !lastSent)) return;
    const data = await drawAppIcon(pack, emoji, pack === 'pixel').catch(() => null);
    if (!data) return;
    lastSent = id;
    window.api?.ipc?.send('sour-icon', data);
};
