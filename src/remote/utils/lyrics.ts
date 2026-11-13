export interface LyricLine {
    text: string;
    time?: number; // seconds from start of track
}

interface SongMeta {
    albumName?: string;
    artistName?: string;
    duration?: number;
    name: string;
}

// lrclib.net: free, no key, serves both plain and LRC-timed lyrics, and
// sets Access-Control-Allow-Origin: * so the remote can call it directly
// from the browser. Two calls: /api/get for an exact match (uses duration
// to disambiguate live/remaster versions), then /api/search as a fallback
// when the exact lookup 404s.
export async function fetchLyrics(song: SongMeta): Promise<LyricLine[]> {
    const base = {
        artist_name: song.artistName ?? '',
        track_name: song.name,
    };

    const getParams = new URLSearchParams(base);
    if (song.albumName) getParams.set('album_name', song.albumName);
    if (song.duration) getParams.set('duration', String(Math.round(song.duration)));

    try {
        const res = await fetch(`https://lrclib.net/api/get?${getParams}`);
        if (res.ok) {
            const parsed = fromLrclib(await res.json());
            if (parsed.length) return parsed;
        }
    } catch {
        // fall through to search
    }

    const searchRes = await fetch(`https://lrclib.net/api/search?${new URLSearchParams(base)}`);
    if (searchRes.ok) {
        const results = (await searchRes.json()) as unknown;
        if (Array.isArray(results)) {
            // Prefer a result whose duration is within a couple seconds of ours.
            const preferred =
                (song.duration != null &&
                    results.find(
                        (r: any) =>
                            typeof r?.duration === 'number' &&
                            Math.abs(r.duration - song.duration!) <= 2,
                    )) ||
                results[0];
            const parsed = fromLrclib(preferred);
            if (parsed.length) return parsed;
        }
    }

    throw new Error('No lyrics found');
}

function fromLrclib(data: any): LyricLine[] {
    if (!data) return [];
    if (typeof data.syncedLyrics === 'string' && data.syncedLyrics.length > 0) {
        return parseLrc(data.syncedLyrics);
    }
    if (typeof data.plainLyrics === 'string' && data.plainLyrics.length > 0) {
        return data.plainLyrics
            .split('\n')
            .map((text: string) => ({ text: text.trim() }))
            .filter((l: LyricLine) => l.text.length > 0);
    }
    return [];
}

// Handles LRC with multiple timestamps per line ([00:12.30][01:05.10]chorus)
// and skips metadata tags like [ar:], [ti:], [offset:].
function parseLrc(lrc: string): LyricLine[] {
    const out: LyricLine[] = [];
    const lineRe = /((?:\[\d+:\d+(?:\.\d+)?\])+)(.*)$/;
    const timeRe = /\[(\d+):(\d+(?:\.\d+)?)\]/g;

    for (const raw of lrc.split('\n')) {
        const trimmed = raw.trim();
        if (!trimmed) continue;

        const match = lineRe.exec(trimmed);
        if (!match) {
            // Plain-text line mixed into an LRC — keep it, drop tags.
            if (!/^\[\w+:/.test(trimmed)) out.push({ text: trimmed });
            continue;
        }

        const text = match[2].trim();
        timeRe.lastIndex = 0;
        let t: null | RegExpExecArray = null;
        while ((t = timeRe.exec(match[1])) !== null) {
            out.push({
                text,
                time: parseInt(t[1], 10) * 60 + parseFloat(t[2]),
            });
        }
    }

    return out.sort((a, b) => (a.time ?? 0) - (b.time ?? 0));
}