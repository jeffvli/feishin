import { RefObject, useEffect } from 'react';

// Picture-in-picture shows whatever frames the element is decoding and nothing else, so an empty
// element between tracks means an empty window - or, since Chromium closes the window when the
// element stops having anything to show, no window at all. Feeding it a canvas keeps the session
// alive and gives it something honest to display.
export type MusicVideoPlaceholder = 'loading' | 'none' | 'unavailable';

// Small on purpose: this is only ever scaled up into a video surface, and a low resolution keeps
// the per-frame redraw negligible.
const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 360;
const FRAME_INTERVAL_MS = 66;

const BACKGROUND = '#0d0d0f';
const FOREGROUND = '#8b8b93';

const SPINNER_RADIUS = 26;
const SPINNER_LINE_WIDTH = 4;
const SPINNER_ARC = Math.PI * 0.6;
const SPINNER_REVOLUTIONS_PER_SECOND = 0.9;

const GLYPH_WIDTH = 96;
const GLYPH_HEIGHT = 66;
const GLYPH_LINE_WIDTH = 4;
const CAPTION_OFFSET = 74;

/**
 * Holds the video element with a generated stream whenever there is no real video to show, so a
 * picture-in-picture window opened on one track survives the gap to the next instead of vanishing,
 * and says which kind of gap it is: still looking, or nothing found.
 *
 * Does nothing when `placeholder` is `none` - the element is playing a real file then, and must
 * not have it replaced - nor when `isActive` is false, since a canvas nobody can see is still a
 * timer, a stream and a decode for every frame it draws.
 */
export function useMusicVideoPlaceholder(
    videoRef: RefObject<HTMLVideoElement | null>,
    placeholder: MusicVideoPlaceholder,
    caption: string,
    isActive: boolean,
): void {
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !isActive || placeholder === 'none') return;

        const canvas = document.createElement('canvas');
        canvas.height = CANVAS_HEIGHT;
        canvas.width = CANVAS_WIDTH;

        const context = canvas.getContext('2d');
        if (!context) return;

        const startedAt = performance.now();

        const draw = () => {
            context.fillStyle = BACKGROUND;
            context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            if (placeholder === 'loading') {
                drawSpinner(context, performance.now() - startedAt);
            } else {
                drawUnavailable(context);
            }

            if (caption) {
                context.fillStyle = FOREGROUND;
                context.font = '18px system-ui, sans-serif';
                context.textAlign = 'center';
                context.fillText(caption, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + CAPTION_OFFSET);
            }
        };

        draw();
        // A captured stream only produces a frame when the canvas is drawn to, so this interval
        // is what keeps the stream live - `requestAnimationFrame` would stall the moment the
        // window is backgrounded, which is exactly when a floating picture-in-picture window is
        // the only thing the user can still see.
        const interval = setInterval(draw, FRAME_INTERVAL_MS);

        video.srcObject = canvas.captureStream(Math.round(1000 / FRAME_INTERVAL_MS));
        video.play().catch(() => {
            // A placeholder that will not autoplay is not worth surfacing; the real video's own
            // play path reports its failures.
        });

        return () => {
            clearInterval(interval);
            if (video.srcObject) {
                video.srcObject = null;
            }
        };
    }, [caption, isActive, placeholder, videoRef]);
}

function drawSpinner(context: CanvasRenderingContext2D, elapsedMs: number): void {
    const angle = (elapsedMs / 1000) * SPINNER_REVOLUTIONS_PER_SECOND * Math.PI * 2;

    context.strokeStyle = FOREGROUND;
    context.lineCap = 'round';
    context.lineWidth = SPINNER_LINE_WIDTH;
    context.beginPath();
    context.arc(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, SPINNER_RADIUS, angle, angle + SPINNER_ARC);
    context.stroke();
}

/** A torn film frame: the rectangle a video would occupy, broken across the middle. */
function drawUnavailable(context: CanvasRenderingContext2D): void {
    const left = (CANVAS_WIDTH - GLYPH_WIDTH) / 2;
    const top = (CANVAS_HEIGHT - GLYPH_HEIGHT) / 2 - 10;

    context.strokeStyle = FOREGROUND;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = GLYPH_LINE_WIDTH;

    context.beginPath();
    context.moveTo(left + GLYPH_WIDTH * 0.45, top);
    context.lineTo(left, top);
    context.lineTo(left, top + GLYPH_HEIGHT);
    context.lineTo(left + GLYPH_WIDTH * 0.45, top + GLYPH_HEIGHT);
    context.moveTo(left + GLYPH_WIDTH * 0.55, top);
    context.lineTo(left + GLYPH_WIDTH, top);
    context.lineTo(left + GLYPH_WIDTH, top + GLYPH_HEIGHT);
    context.lineTo(left + GLYPH_WIDTH * 0.55, top + GLYPH_HEIGHT);
    context.stroke();

    // The tear itself, offset either side of the split so the two halves read as pulled apart
    // rather than as one rectangle with a gap.
    context.beginPath();
    context.moveTo(left + GLYPH_WIDTH * 0.45, top + GLYPH_HEIGHT * 0.3);
    context.lineTo(left + GLYPH_WIDTH * 0.36, top + GLYPH_HEIGHT * 0.5);
    context.lineTo(left + GLYPH_WIDTH * 0.45, top + GLYPH_HEIGHT * 0.7);
    context.moveTo(left + GLYPH_WIDTH * 0.55, top + GLYPH_HEIGHT * 0.3);
    context.lineTo(left + GLYPH_WIDTH * 0.64, top + GLYPH_HEIGHT * 0.5);
    context.lineTo(left + GLYPH_WIDTH * 0.55, top + GLYPH_HEIGHT * 0.7);
    context.stroke();
}
