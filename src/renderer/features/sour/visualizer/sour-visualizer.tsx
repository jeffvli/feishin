import clsx from 'clsx';
import { useEffect, useRef } from 'react';

import styles from './sour-visualizer.module.css';

import { useItemImageUrl } from '/@/renderer/components/item-image/item-image';
import {
    type BarVisualizerStyle,
    useSourStore,
    type VisualizerStyle,
} from '/@/renderer/features/sour/store/sour.store';
import {
    BINS,
    isPlaying,
    type Levels,
    makeLevels,
    readLevels,
    useLevelSource,
} from '/@/renderer/features/sour/visualizer/levels';
import {
    drawLightning,
    lightningBusy,
    makeLightning,
} from '/@/renderer/features/sour/visualizer/lightning';
import { drawSoul, makeSoul, steerSoul } from '/@/renderer/features/sour/visualizer/soul';
import { useFastAverageColor } from '/@/renderer/hooks';
import { usePlayerSong } from '/@/renderer/store';
import { LibraryItem } from '/@/shared/types/domain-types';

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
    { id: 'soul', label: 'Soul (admins)', perk: 'determination' },
    { id: 'lightning', label: 'Lightning in a bottle (Gavin)', perk: 'gavin' },
];

interface Props {
    className?: string;
    colors?: string[];
    coverUrl?: null | string;
    people?: OrbitPerson[];
    // Soul: you steer the SOUL with the arrow keys / WASD
    soulPlay?: boolean;
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

const loadImage = (src: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    return img;
};

// One canvas, seven looks. Draws every frame from the shared levels (real audio when the player's
// audio can be read, the song's tempo otherwise). Sleeps while the window is hidden or the canvas is
// off screen, and only redraws a few times a second once the music has stopped and settled.
export const SourVisualizer = ({ className, colors, coverUrl, people, soulPlay, style }: Props) => {
    useLevelSource();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const latest = useRef({ colors, coverUrl, people, soulPlay, style });
    latest.current = { colors, coverUrl, people, soulPlay, style };
    const steering = !!soulPlay && style === 'soul';
    useEffect(() => {
        if (!steering) return undefined;
        steerSoul(true);
        return () => steerSoul(false);
    }, [steering]);

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
        let last = 0;
        let drawn = 0;
        let spin = 0;
        let visible = true;
        const soul = makeSoul();
        const lightning = makeLightning();

        const fit = () => {
            const r = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            canvas.width = Math.max(1, Math.round(r.width * dpr));
            canvas.height = Math.max(1, Math.round(r.height * dpr));
        };
        fit();
        const observer = new ResizeObserver(fit);
        observer.observe(canvas);
        const seen = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
        });
        seen.observe(canvas);

        const draw = (now: number) => {
            frame = requestAnimationFrame(draw);
            if (document.hidden || !visible) return;
            const {
                colors: cols,
                coverUrl: src,
                people: who,
                soulPlay: steer,
                style: look,
            } = latest.current;
            readLevels(levels, now);
            const dt = Math.min(3, (now - (last || now)) / 16.7);
            last = now;
            const playing = isPlaying();
            const settled = !playing && levels.energy < 0.004 && !sparks.length && flash < 0.02;
            const still =
                (look !== 'soul' || (soul.broken > 0.97 && !soul.stars.length && soul.hurt <= 0)) &&
                (look !== 'lightning' || !lightningBusy(lightning));
            if (settled && still && now - drawn < 400) return;
            drawn = now;
            if (playing) spin += dt / 540;
            const W = canvas.width;
            const H = canvas.height;
            const dpr = window.devicePixelRatio || 1;
            const { bins, kick } = levels;
            const small = Math.min(W, H) < 90 * dpr;
            if (levels.beat) flash = 1;
            flash *= Math.pow(0.9, dt);
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
                // in the player bar's little strip: fewer, shorter rays hugging the cover
                const rays = small ? 20 : BINS * 2;
                const gap = (small ? 1.5 : 6) * dpr;
                const R = Math.min(W, H) * (small ? 0.3 : 0.26) * (1 + kick * 0.06);
                for (let i = 0; i < rays; i++) {
                    const v = bins[Math.floor((i / rays) * BINS * 2) % BINS];
                    const a = (i / rays) * Math.PI * 2 - Math.PI / 2;
                    const l = v * Math.min(W, H) * (small ? 0.17 : 0.2) + (small ? 1 : 2) * dpr;
                    ctx.strokeStyle = `hsl(${48 + v * 70}, 85%, 60%)`;
                    ctx.lineWidth = Math.max(small ? 1.5 : 2, (Math.PI * 2 * R) / rays - 2 * dpr);
                    ctx.lineCap = 'round';
                    ctx.beginPath();
                    ctx.moveTo(cx + Math.cos(a) * (R + gap), cy + Math.sin(a) * (R + gap));
                    ctx.lineTo(cx + Math.cos(a) * (R + gap + l), cy + Math.sin(a) * (R + gap + l));
                    ctx.stroke();
                }
                ctx.save();
                ctx.beginPath();
                ctx.arc(cx, cy, R, 0, Math.PI * 2);
                ctx.clip();
                if (cover && cover.complete && cover.naturalWidth) {
                    ctx.translate(cx, cy);
                    ctx.rotate(spin);
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
                    for (let i = 0; i < (small ? 14 : 36); i++) {
                        const a = Math.random() * Math.PI * 2;
                        const sp = (2 + Math.random() * 5) * dpr * (small ? 0.22 : 1);
                        sparks.push({
                            h: 45 + Math.random() * 50,
                            l: 1,
                            vx: Math.cos(a) * sp,
                            vy: Math.sin(a) * sp,
                            x: W / 2,
                            y: H / 2,
                        });
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
                    ctx.arc(p.x, p.y, (small ? 1.4 : 3) * dpr * p.l + 0.5, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.fillStyle = '#f2c14e';
                ctx.beginPath();
                ctx.arc(
                    W / 2,
                    H / 2,
                    Math.min(W, H) * (small ? 0.16 : 0.08) * (1 + kick * 0.6),
                    0,
                    Math.PI * 2,
                );
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
                        const y =
                            H / 2 +
                            Math.sin((x / W) * 9 + (now / 1000) * (2 + j) + j) *
                                bins[i] *
                                H *
                                0.4 *
                                m;
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
                drawSoul(ctx, W, H, levels, soul, playing, dt, now, !!steer);
            } else if (look === 'lightning') {
                drawLightning(ctx, W, H, levels, dpr, lightning, dt, playing);
            }
        };
        frame = requestAnimationFrame(draw);
        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
            seen.disconnect();
        };
    }, []);

    return <canvas aria-hidden className={clsx(styles.canvas, className)} ref={canvasRef} />;
};

// the little strip in the player bar and the mini player (Sour Studio > Visualizer)
export const BAR_STYLES: { id: BarVisualizerStyle; label: string; width: number }[] = [
    { id: 'bars', label: 'Lemon bars', width: 56 },
    { id: 'river', label: 'Sour river', width: 56 },
    { id: 'halo', label: 'Cover halo', width: 34 },
    { id: 'pulp', label: 'Pulp burst', width: 44 },
    { id: 'glow', label: 'Album glow', width: 56 },
];

export const useBarVisualizer = () => {
    const style = useSourStore((s) => s.look.barStyle) ?? 'bars';
    const song = usePlayerSong();
    const cover = useItemImageUrl({
        id: song?.imageId || undefined,
        itemType: LibraryItem.SONG,
        type: 'itemCard',
    });
    const { background } = useFastAverageColor({
        algorithm: 'dominant',
        src: style === 'glow' && cover ? cover : null,
        srcLoaded: true,
    });
    return {
        colors: background ? [background, '#f2c14e'] : undefined,
        coverUrl: cover || null,
        style,
        width: BAR_STYLES.find((b) => b.id === style)?.width ?? 56,
    };
};

export const PlayerBarVisualizer = () => {
    const on = useSourStore((s) => s.look.barVisualizer && !s.look.simple);
    const { colors, coverUrl, style, width } = useBarVisualizer();
    if (!on) return null;
    return (
        <div className={styles.bar} style={{ width }}>
            <SourVisualizer colors={colors} coverUrl={coverUrl} style={style} />
        </div>
    );
};
