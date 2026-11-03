/**
 * Splits an ICY StreamTitle into artist and title.
 * Handles iHeartRadio's `title="...",artist="...",url="..."` and `Artist - text="..." song_spot=...`
 * formats and plain "Artist - Title".
 */
export const parseStreamTitle = (
    streamTitle: string,
): { artist: null | string; title: null | string } => {
    const iheartTitle = streamTitle.match(/^title="(.*?)",/);
    if (iheartTitle) {
        const iheartArtist = streamTitle.match(/,artist="(.*?)",/);
        return { artist: iheartArtist?.[1] || null, title: iheartTitle[1] || null };
    }

    const iheartText = streamTitle.match(/^(.*?)\s*-\s*text="(.*?)"/);
    if (iheartText) {
        return { artist: iheartText[1].trim() || null, title: iheartText[2] || null };
    }

    const match = streamTitle.match(/^(.*?)\s+[-–—]\s+(.+)$/);
    if (match) {
        return { artist: match[1].trim() || null, title: match[2].trim() || null };
    }

    return { artist: null, title: streamTitle };
};
