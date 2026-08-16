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
 */
export function useArtistImages(items: DiscoverItem[]): Map<string, string> {
    const artists = useMemo(() => {
        const unique = new Map<string, DiscoverItem>();

        for (const item of items) {
            if (item.kind === 'artist' && !item.imageUrl && !unique.has(item.id)) {
                unique.set(item.id, item);
            }
        }

        return [...unique.values()].slice(0, MAX_LOOKUPS);
    }, [items]);

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
