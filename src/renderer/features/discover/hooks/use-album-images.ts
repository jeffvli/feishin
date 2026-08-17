import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';

import { albumImageQueries } from '/@/renderer/features/discover/api/album-image-api';
import { DiscoverItem } from '/@/renderer/features/discover/utils/lb-adapters';

/**
 * Distinct albums are capped before any lookup runs.
 *
 * TheAudioDB is free, keyless and publishes no rate-limit headers, so the restraint has to come
 * from this side. Release and track rows both feed this hook where only artist rows feed the
 * artist one, which is why the ceiling is a little higher than the 24 there; deduplication
 * already collapses a whole track row down to a few albums, so a page rarely reaches it.
 *
 * This is not what bounds the iTunes fallback. Apple's allowance is per address and per minute,
 * not per page, and it is shared with the preview player, so the album-art source paces itself
 * against the clock and a per-page cap would say nothing about it either way.
 */
const MAX_LOOKUPS = 32;

interface AlbumLookup {
    albumName: string;
    artistName: string;
    /** Every card standing for this album, since one lookup answers for all of them. */
    itemIds: string[];
}

/**
 * Resolves album art from the sources behind the Cover Art Archive, keyed by item id.
 *
 * Answers for every release and track card that names an album, whether or not the card already
 * has an `imageUrl`: whether the Cover Art Archive copy loads is not something this hook can
 * see, so it resolves what the other sources have and leaves the choice to the caller. Missing
 * entries are expected; an album none of them holds simply has none.
 */
export function useAlbumImages(items: DiscoverItem[]): Map<string, string> {
    const albums = useMemo(() => {
        const lookups = new Map<string, AlbumLookup>();

        for (const item of items) {
            if (item.kind === 'artist' || !item.albumName) {
                continue;
            }

            // Ten tracks off one record are one album, and asking ten times would spend the
            // unpublished budget on an answer already in hand. Joined on a character that cannot
            // appear in either name, so no two pairs of names can collide on one key. Written as
            // an escape rather than typed literally: a raw control byte in a source file makes
            // git store it as binary and makes grep skip the file without saying so.
            const key = `${item.artistName}\u0000${item.albumName}`.toLowerCase();
            const existing = lookups.get(key);

            if (existing) {
                existing.itemIds.push(item.id);
            } else {
                lookups.set(key, {
                    albumName: item.albumName,
                    artistName: item.artistName,
                    itemIds: [item.id],
                });
            }
        }

        return [...lookups.values()].slice(0, MAX_LOOKUPS);
    }, [items]);

    const results = useQueries({
        queries: albums.map((album) =>
            albumImageQueries.byAlbum(album.artistName, album.albumName),
        ),
    });

    // `results` is a new array on every render, so the memo is keyed on the resolved URLs.
    const urls = results.map((result) => result.data ?? null);
    const signature = urls.join('|');

    return useMemo(() => {
        const map = new Map<string, string>();

        albums.forEach((album, index) => {
            const url = urls[index];

            if (url) {
                for (const id of album.itemIds) {
                    map.set(id, url);
                }
            }
        });

        return map;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [albums, signature]);
}
