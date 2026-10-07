import clsx from 'clsx';
import { useEffect, useRef } from 'react';

import styles from './sour-visualizer.module.css';

import { type VisualizerStyle } from '/@/renderer/features/sour/store/sour.store';
import {
    BINS,
    type Levels,
    makeLevels,
    readLevels,
    useLevelSource,
} from '/@/renderer/features/sour/visualizer/levels';

export interface OrbitPerson {
    color: string;
    image?: null | string;
    name: string;
}

export const VISUALIZER_STYLES: { id: VisualizerStyle; label: string; perk?: string }[] = [
    { id: 'bars', label: 'Lemon bars' },
    { id: 'halo', label: 'Cover halo' },
    { id: 'pulp', label: 'Pulp burst' },
    { id: 'river', label: 'Sour river' },
    { id: 'glow', label: 'Album glow' },
    { id: 'orbit', label: 'Group orbit' },
    { id: 'soul', label: 'Soul (only yours)', perk: 'determination' },
];

interface Props {
    className?: string;
    colors?: string[];
    coverUrl?: null | string;
    people?: OrbitPerson[];
    style: VisualizerStyle;
}

interface Spark {
    h: number;
    l: number;
    vx: number;
    vy: number;
    x: number;
    y: number;
}

const FALLBACK_COLORS = ['#e86a92', '#f2c14e', '#6ca0dc'];

// the soul heart, 13x11 pixels
const HEART = [
    '0011100011100',
    '0111110111110',
    '1111111111111',
    '1111111111111',
    '1111111111111',
    '0111111111110',
    '0011111111100',
    '0001111111000',
    '0000111110000',
    '0000011100000',
    '0000001000000',
];

const loadImage = (src: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    return img;
};

// One canvas, seven looks. Draws every frame from the shared levels (real audio when the player's
// audio can be read, the song's tempo otherwise) and sleeps while the window is hidden.
export const SourVisualizer = ({ className, colors, coverUrl, people, style }: Props) => {
    useLevelSource();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const props = useRef({ colors, coverUrl, people, style });
    props.current = { colors, coverUrl, people, style };

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return undefined;
        const levels: Levels = makeLevels();
        let sparks: Spark[] = [];
        let cover: HTMLImageElement | null = null;
        let coverSrc = '';
        const faces = new Map<string, HTMLImageElement>();
        let frame = 0;
        let flash = 0;

        const fit = () => {
            const r = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            canvas.width = Math.max(1, Math.round(r.width * dpr));
            canvas.height = Math.max(1, Math.round(r.height * dpr));
        };
        fit();
        const observer = new ResizeObserver(fit);
        observer.observe(canvas);

        const draw = (now: number) => {
            frame = requestAnimationFrame(draw);
            if (document.hidden) return;
            const { colors: cols, coverUrl: src, people: who, style: look } = props.current;
            readLevels(levels, now);
            const W = canvas.width;
            const H = canvas.height;
            const dpr = window.devicePixelRatio || 1;
            const { bins, kick } = levels;
            if (levels.beat) flash = 1;
            flash *= 0.9;
            if (src && src !== coverSrc) {
                coverSrc = src;
                cover = loadImage(src);
            } else if (!src) {
                coverSrc = '';
                cover = null;
            }
            const palette = cols?.length ? cols : FALLBACK_COLORS;
            ctx.clearRect(0, 0, W, H);

            if (look === 'bars') {
                const bw = W / BINS;
                for (let i = 0; i < BINS; i++) {
                    const v = bins[i];
                    const h = Math.max(2 * dpr, v * H * 0.92);
                    ctx.fillStyle = `hsl(${55 + i * 1.6}, 85%, ${58 - v * 12}%)`;
                    ctx.fillRect(i * bw + bw * 0.12, H - h, bw * 0.76, h);
                }
            } else if (look === 'halo') {
                const cx = W / 2;
                const cy = H / 2;
                const R = Math.min(W, H) * 0.26 * (1 + kick * 0.06);
                for (let i = 0; i < BINS * 2; i++) {
                    const v = bins[i % BINS];
                    const a = (i / (BINS * 2)) * Math.PI * 2 - Math.PI / 2;
                    const l = v * Math.min(W, H) * 0.2 + 2 * dpr;
                    ctx.strokeStyle = `hsl(${48 + v * 70}, 85%, 60%)`;
                    ctx.lineWidth = Math.max(2, (Math.PI * 2 * R) / (BINS * 2) - 2 * dpr);
                    ctx.lineCap = 'round';
                    ctx.beginPath();
                    ctx.moveTo(cx + Math.cos(a) * (R + 6 * dpr), cy + Math.sin(a) * (R + 6 * dpr));
                    ctx.lineTo(cx + Math.cos(a) * (R + 6 * dpr + l), cy + Math.sin(a) * (R + 6 * dpr + l));
                    ctx.stroke();
                }
                ctx.save();
                ctx.beginPath();
                ctx.arc(cx, cy, R, 0, Math.PI * 2);
                ctx.clip();
                if (cover && cover.complete && cover.naturalWidth) {
                    ctx.translate(cx, cy);
                    ctx.rotate(now / 9000);
                    ctx.drawImage(cover, -R, -R, R * 2, R * 2);
                } else {
                    ctx.fillStyle = '#2b2b2b';
                    ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
                    ctx.fillStyle = '#f2c14e';
                    ctx.beginPath();
                    ctx.arc(cx, cy, R * 0.55, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            } else if (look === 'pulp') {
                if (levels.beat) {
                    for (let i = 0; i < 36; i++) {
                        const a = Math.random() * Math.PI * 2;
                        const sp = (2 + Math.random() * 5) * dpr;
                        sparks.push({ h: 45 + Math.random() * 50, l: 1, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, x: W / 2, y: H / 2 });
                    }
                }
                sparks = sparks.filter((p) => (p.l -= 0.018) > 0).slice(-400);
                for (const p of sparks) {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.vx *= 0.97;
                    p.vy *= 0.97;
                    ctx.fillStyle = `hsla(${p.h}, 85%, 60%, ${p.l})`;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 3 * dpr * p.l + 0.5, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.fillStyle = '#f2c14e';
                ctx.beginPath();
                ctx.arc(W / 2, H / 2, Math.min(W, H) * 0.08 * (1 + kick * 0.6), 0, Math.PI * 2);
                ctx.fill();
            } else if (look === 'river') {
                const layers: Array<[string, number]> = [
                    ['#f2c14e', 1],
                    ['#9bd06b', 0.7],
                    ['#e8e07a', 0.45],
                ];
                layers.forEach(([color, m], j) => {
                    ctx.strokeStyle = color;
                    ctx.globalAlpha = 0.4 + m * 0.6;
                    ctx.lineWidth = 2.5 * dpr;
                    ctx.beginPath();
                    for (let x = 0; x <= W; x += 4 * dpr) {
                        const i = Math.min(BINS - 1, Math.floor((x / W) * (BINS - 1)));
                        const y = H / 2 + Math.sin((x / W) * 9 + (now / 1000) * (2 + j) + j) * bins[i] * H * 0.4 * m;
                        if (x === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.stroke();
                });
                ctx.globalAlpha = 1;
            } else if (look === 'glow') {
                const bass = (bins[0] + bins[1] + bins[2] + bins[3] + bins[4] + bins[5]) / 6;
                palette.slice(0, 4).forEach((color, j) => {
                    const a = now / 2500 + j * 2.1;
                    const r = Math.min(W, H) * (0.35 + bass * 0.45);
                    const g = ctx.createRadialGradient(
                        W / 2 + Math.cos(a) * W * 0.22,
                        H / 2 + Math.sin(a) * H * 0.2,
                        0,
                        W / 2 + Math.cos(a) * W * 0.22,
                        H / 2 + Math.sin(a) * H * 0.2,
                        r,
                    );
                    g.addColorStop(0, color);
                    g.addColorStop(1, 'transparent');
                    ctx.globalAlpha = 0.35 + bass * 0.45;
                    ctx.fillStyle = g;
                    ctx.fillRect(0, 0, W, H);
                });
                ctx.globalAlpha = 1;
            } else if (look === 'orbit') {
                const cx = W / 2;
                const cy = H / 2;
                const rx = W * 0.36;
                const ry = H * 0.34;
                ctx.strokeStyle = 'rgb(255 255 255 / 12%)';
                ctx.lineWidth = dpr;
                ctx.beginPath();
                ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.fillStyle = '#f2c14e';
                ctx.beginPath();
                ctx.arc(cx, cy, Math.min(W, H) * 0.12 * (1 + kick * 0.25), 0, Math.PI * 2);
                ctx.fill();
                const list = who?.length ? who : [{ color: '#7bc67e', name: 'You' }];
                list.slice(0, 12).forEach((p, i) => {
                    const a = now / 2000 + (i / list.length) * Math.PI * 2;
                    const v = bins[(i * 7) % BINS];
                    const px = cx + Math.cos(a) * rx;
                    const py = cy + Math.sin(a) * ry - v * H * 0.12;
                    const r = Math.min(W, H) * 0.08 * (1 + v * 0.4);
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(px, py, r, 0, Math.PI * 2);
                    ctx.fillStyle = p.color;
                    ctx.fill();
                    let face = p.image ? faces.get(p.image) : undefined;
                    if (p.image && !face) {
                        face = loadImage(p.image);
                        faces.set(p.image, face);
                    }
                    if (face && face.complete && face.naturalWidth) {
                        ctx.clip();
                        ctx.drawImage(face, px - r, py - r, r * 2, r * 2);
                    } else {
                        ctx.fillStyle = '#151515';
                        ctx.font = `${Math.round(r)}px sans-serif`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText((p.name[0] || '?').toUpperCase(), px, py);
                    }
                    ctx.restore();
                });
            } else if (look === 'soul') {
                const scale = Math.max(2, Math.floor((Math.min(W, H) * (0.5 + kick * 0.18)) / 13));
                const ox = Math.round(W / 2 - (13 * scale) / 2);
                const oy = Math.round(H / 2 - (11 * scale) / 2);
                ctx.fillStyle = `rgb(255, ${Math.round(flash * 90)}, ${Math.round(flash * 90)})`;
                HEART.forEach((row, y) => {
                    for (let x = 0; x < row.length; x++) {
                        if (row[x] === '1') ctx.fillRect(ox + x * scale, oy + y * scale, scale, scale);
                    }
                });
                // little star-like sparks on the beat
                if (levels.beat) {
                    for (let i = 0; i < 10; i++) {
                        const a = Math.random() * Math.PI * 2;
                        sparks.push({ h: 0, l: 1, vx: Math.cos(a) * 3 * dpr, vy: Math.sin(a) * 3 * dpr, x: W / 2, y: H / 2 });
                    }
                }
                sparks = sparks.filter((p) => (p.l -= 0.025) > 0).slice(-120);
                for (const p of sparks) {
                    p.x += p.vx;
                    p.y += p.vy;
                    ctx.fillStyle = `rgb(255 255 255 / ${p.l})`;
                    ctx.fillRect(p.x, p.y, scale * 0.6, scale * 0.6);
                }
            }
        };
        frame = requestAnimationFrame(draw);
        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
        };
    }, []);

    return <canvas aria-hidden className={clsx(styles.canvas, className)} ref={canvasRef} />;
};
