import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';

import { artistImageQueries } from '/@/renderer/features/discover/api/artist-image-api';
import { DiscoverItem } from '/@/renderer/features/discover/utils/lb-adapters';

/**
 * Artist rows are capped before any lookup runs.
 *
 * One request per card is cheap individually but a page with several artist rows would fire
 * them all at once against a free, keyless third-party service. TheAudioDB publishes no
 * rate-limit headers, so the restraint has to come from this side.
 */
const MAX_LOOKUPS = 24;

/**
 * Fills in the artist images that ListenBrainz cannot supply, keyed by item id.
 *
 * Applied after the rows are built rather than inside the adapters, because an adapter is a
 * pure shape conversion and this is a network call. Missing entries are expected: an artist
 * with no image simply keeps the card's placeholder.
 *
 * Takes the rows separately rather than one flat list, because the allowance is shared between
 * them and which cards get it is the whole question. See `interleave`.
 */
export function useArtistImages(rows: DiscoverItem[][]): Map<string, string> {
    const artists = useMemo(() => {
        const unique = new Map<string, DiscoverItem>();

        for (const item of interleave(rows)) {
            if (item.kind === 'artist' && !item.imageUrl && !unique.has(item.id)) {
                unique.set(item.id, item);
            }
        }

        return [...unique.values()].slice(0, MAX_LOOKUPS);
    }, [rows]);

    const results = useQueries({
        queries: artists.map((artist) => artistImageQueries.byArtist(artist.id, artist.artistName)),
    });

    // `results` is a new array on every render, so the memo is keyed on the resolved URLs.
    const urls = results.map((result) => result.data ?? null);
    const signature = urls.join('|');

    return useMemo(() => {
        const map = new Map<string, string>();

        artists.forEach((artist, index) => {
            const url = urls[index];

            if (url) {
                map.set(artist.id, url);
            }
        });

        return map;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [artists, signature]);
}

/**
 * The cards, taken a row at a time from the front of each.
 *
 * Concatenating the rows and truncating spent the whole allowance on the first row and left the
 * second one a page of grey silhouettes, which reads as artists nobody has a photograph of
 * rather than as a budget running out. Round robin instead, so the allowance is spent on what
 * is on screen: every row's opening cards are reached before any row's tail is.
 */
function interleave(rows: DiscoverItem[][]): DiscoverItem[] {
    const ordered: DiscoverItem[] = [];
    const longest = Math.max(0, ...rows.map((row) => row.length));

    for (let index = 0; index < longest; index += 1) {
        for (const row of rows) {
            if (row[index]) {
                ordered.push(row[index]);
            }
        }
    }

    return ordered;
}
