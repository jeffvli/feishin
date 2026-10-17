import { BINS, type Levels } from '/@/renderer/features/sour/visualizer/levels';

// Lightning in a bottle (Gavin's extra): a glass bottle with its cork popped, a storm crackling inside
// with the music, and on every beat bolts of lightning escape out of the neck and arc across the
// screen, branching as they go.

export interface LightningState {
    bolts: Bolt[];
    cork: number;
    crackle: number;
    sparks: Spark[];
}

interface Bolt {
    branches: { x: number; y: number }[][];
    hue: number;
    life: number;
    points: { x: number; y: number }[];
    width: number;
}

interface Spark {
    life: number;
    vx: number;
    vy: number;
    x: number;
    y: number;
}

export const makeLightning = (): LightningState => ({ bolts: [], cork: 0, crackle: 0, sparks: [] });

// a jagged path from a to b (midpoint displacement)
const jagged = (ax: number, ay: number, bx: number, by: number, rough: number, depth = 6) => {
    let pts = [
        { x: ax, y: ay },
        { x: bx, y: by },
    ];
    let spread = rough;
    for (let d = 0; d < depth; d++) {
        const next: { x: number; y: number }[] = [];
        for (let i = 0; i < pts.length - 1; i++) {
            const p = pts[i];
            const q = pts[i + 1];
            const nx = -(q.y - p.y);
            const ny = q.x - p.x;
            const len = Math.hypot(nx, ny) || 1;
            const off = (Math.random() - 0.5) * spread;
            next.push(p, {
                x: (p.x + q.x) / 2 + (nx / len) * off,
                y: (p.y + q.y) / 2 + (ny / len) * off,
            });
        }
        next.push(pts[pts.length - 1]);
        pts = next;
        spread *= 0.55;
    }
    return pts;
};

const stroke = (ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[]) => {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
};

export const drawLightning = (
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    levels: Levels,
    dpr: number,
    s: LightningState,
    dt: number,
    playing: boolean,
) => {
    const { bins, energy, kick } = levels;
    const small = Math.min(W, H) < 90 * dpr;
    // the bottle: centred, sized to the space
    const bh = H * (small ? 0.86 : 0.62);
    const bw = Math.min(W * 0.32, bh * 0.62);
    const cx = W / 2;
    const bottom = H * (small ? 0.96 : 0.92);
    const top = bottom - bh;
    const neckW = bw * 0.34;
    const neckH = bh * 0.26;
    const shoulder = top + neckH;
    const mouthY = top;

    // escaping bolts on the beat (more and brighter with a harder kick), and now and then on loud
    // passages even between beats
    if (playing && (levels.beat || (energy > 0.35 && Math.random() < 0.04 * dt))) {
        const n = small ? 1 : 1 + Math.round(kick * 3);
        for (let i = 0; i < n; i++) {
            const side = Math.random() < 0.5 ? -1 : 1;
            const tx = cx + side * (W * (0.2 + Math.random() * 0.32));
            const ty = Math.random() * H * (small ? 0.4 : 0.55);
            const points = jagged(cx, mouthY, tx, ty, Math.hypot(tx - cx, ty - mouthY) * 0.45);
            const branches: { x: number; y: number }[][] = [];
            for (let b = 0; b < (small ? 1 : 3); b++) {
                const from = points[Math.floor(points.length * (0.3 + Math.random() * 0.5))];
                const a = Math.atan2(ty - mouthY, tx - cx) + (Math.random() - 0.5) * 1.6;
                const len = Math.min(W, H) * (0.12 + Math.random() * 0.2);
                branches.push(
                    jagged(
                        from.x,
                        from.y,
                        from.x + Math.cos(a) * len,
                        from.y + Math.sin(a) * len,
                        len * 0.5,
                        4,
                    ),
                );
            }
            s.bolts.push({
                branches,
                hue: 200 + Math.random() * 60,
                life: 1,
                points,
                width: (1.5 + kick * 3) * dpr,
            });
        }
        s.cork = 1;
        for (let i = 0; i < (small ? 4 : 14); i++) {
            const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.8;
            const sp = (1.5 + Math.random() * 4) * dpr;
            s.sparks.push({
                life: 1,
                vx: Math.cos(a) * sp,
                vy: Math.sin(a) * sp,
                x: cx,
                y: mouthY,
            });
        }
    }
    s.cork *= Math.pow(0.9, dt);
    s.crackle += dt;

    // glow behind the bottle
    const glowR = bw * (1.1 + energy * 1.4);
    const glow = ctx.createRadialGradient(
        cx,
        (shoulder + bottom) / 2,
        0,
        cx,
        (shoulder + bottom) / 2,
        glowR,
    );
    glow.addColorStop(0, `rgba(140, 190, 255, ${0.25 + energy * 0.45})`);
    glow.addColorStop(1, 'rgba(140, 190, 255, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // the bottle's outline: body with rounded bottom, shoulders, neck
    const bottle = new Path2D();
    const r = bw * 0.18;
    bottle.moveTo(cx - neckW / 2, mouthY);
    bottle.lineTo(cx - neckW / 2, shoulder);
    bottle.quadraticCurveTo(cx - bw / 2, shoulder + bh * 0.06, cx - bw / 2, shoulder + bh * 0.2);
    bottle.lineTo(cx - bw / 2, bottom - r);
    bottle.quadraticCurveTo(cx - bw / 2, bottom, cx - bw / 2 + r, bottom);
    bottle.lineTo(cx + bw / 2 - r, bottom);
    bottle.quadraticCurveTo(cx + bw / 2, bottom, cx + bw / 2, bottom - r);
    bottle.lineTo(cx + bw / 2, shoulder + bh * 0.2);
    bottle.quadraticCurveTo(cx + bw / 2, shoulder + bh * 0.06, cx + neckW / 2, shoulder);
    bottle.lineTo(cx + neckW / 2, mouthY);

    // the storm inside: the levels as a crackling glow, clipped to the glass
    ctx.save();
    ctx.clip(bottle);
    const inside = ctx.createLinearGradient(0, bottom, 0, shoulder);
    inside.addColorStop(0, `rgba(90, 140, 255, ${0.35 + energy * 0.5})`);
    inside.addColorStop(1, 'rgba(60, 40, 120, 0.15)');
    ctx.fillStyle = inside;
    ctx.fill(bottle);
    ctx.lineCap = 'round';
    const inner = small ? 2 : 5;
    for (let i = 0; i < inner; i++) {
        const v = bins[Math.floor((i / inner) * BINS)];
        if (v < 0.12) continue;
        const x1 = cx + (Math.random() - 0.5) * bw * 0.8;
        const y1 = bottom - Math.random() * (bottom - shoulder) * 0.4;
        const x2 = cx + (Math.random() - 0.5) * bw * 0.8;
        const y2 = shoulder + Math.random() * (bottom - shoulder) * 0.5;
        ctx.strokeStyle = `rgba(210, 230, 255, ${0.25 + v * 0.7})`;
        ctx.lineWidth = (0.8 + v * 1.6) * dpr;
        stroke(ctx, jagged(x1, y1, x2, y2, bw * 0.35, 4));
    }
    ctx.restore();

    // glass
    ctx.strokeStyle = 'rgba(220, 235, 255, 0.75)';
    ctx.lineWidth = (small ? 1.2 : 2.2) * dpr;
    ctx.stroke(bottle);
    // a shine down the left side
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = (small ? 1 : 3) * dpr;
    ctx.beginPath();
    ctx.moveTo(cx - bw * 0.36, shoulder + bh * 0.24);
    ctx.lineTo(cx - bw * 0.36, bottom - bh * 0.12);
    ctx.stroke();
    // the popped cork, jumping on each beat
    const corkY = mouthY - (6 + s.cork * bh * 0.18) * dpr;
    ctx.save();
    ctx.translate(cx + neckW * 0.9, corkY);
    ctx.rotate(0.5 + s.cork * 0.6);
    ctx.fillStyle = '#b5814a';
    ctx.fillRect(-neckW * 0.45, -neckW * 0.3, neckW * 0.9, neckW * 0.6);
    ctx.restore();

    // the escaping bolts: a wide soft glow, then the bright core
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const b of s.bolts) {
        const a = Math.max(0, b.life);
        ctx.strokeStyle = `hsla(${b.hue}, 100%, 70%, ${a * 0.35})`;
        ctx.lineWidth = b.width * 4;
        stroke(ctx, b.points);
        ctx.strokeStyle = `rgba(255, 255, 255, ${a})`;
        ctx.lineWidth = b.width;
        stroke(ctx, b.points);
        ctx.lineWidth = b.width * 0.6;
        for (const br of b.branches) stroke(ctx, br);
        b.life -= 0.035 * dt;
    }
    s.bolts = s.bolts.filter((b) => b.life > 0);

    // sparks out of the neck
    for (const p of s.sparks) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 0.08 * dpr * dt;
        p.life -= 0.03 * dt;
        ctx.fillStyle = `rgba(200, 225, 255, ${Math.max(0, p.life)})`;
        ctx.fillRect(p.x, p.y, 2 * dpr, 2 * dpr);
    }
    s.sparks = s.sparks.filter((p) => p.life > 0);
};

// still drawing something (bolts fading out) even after the music stopped
export const lightningBusy = (s: LightningState) =>
    s.bolts.length > 0 || s.sparks.length > 0 || s.cork > 0.02;
