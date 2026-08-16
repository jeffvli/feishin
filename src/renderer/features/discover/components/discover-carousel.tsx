import { useMemo } from 'react';

import {
    GridCarousel,
    useGridCarouselContainerQuery,
} from '/@/renderer/components/grid-carousel/grid-carousel-v2';
import { DataRow, MemoizedItemCard } from '/@/renderer/components/item-card/item-card';
import { ItemControls } from '/@/renderer/components/item-list/types';
import { DiscoverItem } from '/@/renderer/features/discover/utils/lb-adapters';
import {
    usePreviewActions,
    usePreviewPlayingId,
    usePreviewResolvingId,
} from '/@/renderer/features/preview/preview-store';
import { usePlaybackType } from '/@/renderer/store';
import { Album, AlbumArtist, LibraryItem } from '/@/shared/types/domain-types';
import { PlayerType } from '/@/shared/types/types';

interface DiscoverCarouselProps {
    containerQuery?: ReturnType<typeof useGridCarouselContainerQuery>;
    /** Artists render as circles and have nothing to preview. */
    isArtist?: boolean;
    items: DiscoverItem[];
    title: React.ReactNode | string;
}

const ROWS: DataRow[] = [
    { format: (data) => (data as { name?: string }).name ?? '', id: 'title' },
    {
        format: (data) => (data as { artistName?: string }).artistName ?? '',
        id: 'artist',
        isMuted: true,
    },
];

/**
 * A row of ListenBrainz suggestions, rendered with the same carousel and cards the library uses.
 *
 * `GridCarousel` takes `{ id, content }` and is indifferent to what an item is, and `ItemCard`
 * already degrades for items that have no server behind them: `useItemImageUrl` short-circuits
 * on an external `imageUrl`, and `enableNavigation={false}` keeps the card from linking to a
 * library id that does not exist. So nothing here needs new card chrome.
 */
export function DiscoverCarousel(props: DiscoverCarouselProps) {
    const { containerQuery, isArtist, items, title } = props;
    const playbackType = usePlaybackType();
    const playingId = usePreviewPlayingId();
    const resolvingId = usePreviewResolvingId();
    const { toggle } = usePreviewActions();

    // Jukebox plays through the server's own sound card, so a preview on this machine could
    // neither be heard alongside it nor duck it. Offer nothing rather than something broken.
    const canPreview = !isArtist && playbackType !== PlayerType.JUKEBOX;

    const controls = useMemo<ItemControls | undefined>(() => {
        if (!canPreview) {
            return undefined;
        }

        return {
            onPlay: ({ item }) => {
                const discoverItem = item as unknown as DiscoverItem;

                void toggle(discoverItem.id, {
                    artistName: discoverItem.artistName,
                    title: discoverItem.title,
                    urlRels: discoverItem.urlRels,
                });
            },
        };
    }, [canPreview, toggle]);

    const cards = useMemo(() => {
        return items.map((item) => {
            // ItemCard's `data` is the union of library entities. A ListenBrainz item satisfies
            // only the fields the card actually reads, so the cast is at this single boundary
            // rather than spread through the component.
            const data = {
                artistName: item.artistName,
                id: item.id,
                imageUrl: item.imageUrl,
                name: item.title,
            } as unknown as Album | AlbumArtist;

            return {
                content: (
                    <MemoizedItemCard
                        controls={controls}
                        data={data}
                        enableNavigation={false}
                        imageFetchPriority="low"
                        isRound={isArtist}
                        itemType={isArtist ? LibraryItem.ALBUM_ARTIST : LibraryItem.ALBUM}
                        previewState={
                            canPreview
                                ? {
                                      isLoading: resolvingId === item.id,
                                      isPlaying: playingId === item.id,
                                  }
                                : undefined
                        }
                        rows={ROWS}
                        type="poster"
                        withControls={canPreview}
                    />
                ),
                id: item.id,
            };
        });
    }, [items, controls, canPreview, isArtist, playingId, resolvingId]);

    if (cards.length === 0) {
        return null;
    }

    const noop = () => {};

    return (
        <GridCarousel
            cards={cards}
            containerQuery={containerQuery}
            onNextPage={noop}
            onPrevPage={noop}
            rowCount={1}
            title={title}
        />
    );
}
