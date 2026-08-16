import { useCallback, useMemo } from 'react';

import { FeatureCarousel } from '/@/renderer/components/feature-carousel/feature-carousel';
import { DiscoverItem } from '/@/renderer/features/discover/utils/lb-adapters';
import {
    usePreviewActions,
    usePreviewPlayingId,
    usePreviewResolvingId,
} from '/@/renderer/features/preview/preview-store';
import { PlayButton } from '/@/renderer/features/shared/components/play-button';
import { usePlaybackType } from '/@/renderer/store';
import { Stack } from '/@/shared/components/stack/stack';
import { TextTitle } from '/@/shared/components/text-title/text-title';
import { Album } from '/@/shared/types/domain-types';
import { PlayerType } from '/@/shared/types/types';

interface DiscoverFeatureCarouselProps {
    items: DiscoverItem[];
    title: React.ReactNode | string;
}

/**
 * ListenBrainz suggestions given the hero treatment the home page uses for featured albums.
 *
 * `FeatureCarousel` is built around library albums, so the two escape hatches carry the
 * difference: `enableNavigation={false}` because a Discover item has no library id to link to,
 * and `renderControls` because the only thing playable here is a thirty second external clip.
 */
export function DiscoverFeatureCarousel(props: DiscoverFeatureCarouselProps) {
    const { items, title } = props;
    const playbackType = usePlaybackType();
    const playingId = usePreviewPlayingId();
    const resolvingId = usePreviewResolvingId();
    const { toggle } = usePreviewActions();

    // Jukebox plays through the server's own sound card, so a preview on this machine could
    // neither be heard alongside it nor duck it. Offer nothing rather than something broken.
    const canPreview = playbackType !== PlayerType.JUKEBOX;

    const itemsById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);

    const albums = useMemo(() => {
        return items.map((item) => {
            // The carousel's `data` is a library entity. A ListenBrainz item satisfies only the
            // fields the card actually reads, so the cast is at this single boundary rather than
            // spread through the component.
            return {
                albumArtists: [{ id: item.id, name: item.artistName }],
                id: item.id,
                imageId: null,
                imageUrl: item.imageUrl,
                name: item.title,
            } as unknown as Album;
        });
    }, [items]);

    const renderControls = useCallback(
        (album: Album) => {
            // The projection above is what the carousel hands back, and it carries neither the
            // title nor the Apple Music links the preview needs, so look the real item back up.
            const item = itemsById.get(album.id);

            if (!canPreview || !item) {
                return null;
            }

            return (
                <PlayButton
                    fill
                    icon={playingId === item.id ? 'mediaPause' : 'mediaPlay'}
                    loading={resolvingId === item.id}
                    onClick={() =>
                        void toggle(item.id, {
                            artistName: item.artistName,
                            title: item.title,
                            urlRels: item.urlRels,
                        })
                    }
                />
            );
        },
        [canPreview, itemsById, playingId, resolvingId, toggle],
    );

    if (albums.length === 0) {
        return null;
    }

    return (
        <Stack gap="md">
            {typeof title === 'string' ? (
                <TextTitle fw={700} isNoSelect order={3}>
                    {title}
                </TextTitle>
            ) : (
                title
            )}
            <FeatureCarousel
                data={albums}
                enableNavigation={false}
                renderControls={renderControls}
            />
        </Stack>
    );
}
