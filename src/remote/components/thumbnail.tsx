import { Image } from '@mantine/core';
import { ReactNode, useMemo } from 'react';

import { Flex } from '/@/shared/components/flex/flex';
import { useNativeImage } from '/@/shared/components/image/use-native-image';
import { useInViewport } from '/@/shared/hooks/use-in-viewport';

interface ThumbnailProps {
    fallbackIcon?: ReactNode;
    onError?: () => void;
    size?: number;
    src: null | string;
}

export const Thumbnail = ({ fallbackIcon, onError, size = 48, src }: ThumbnailProps) => {
    const { inViewport, ref } = useInViewport<HTMLDivElement>();

    // Queue/track/album/playlist rows are virtualized and recycle their DOM
    // nodes across items as they scroll (see queue-row.tsx) — plain
    // `<img src>` has no way to say "stop" once a fetch is on the wire, so
    // scrolling fast through a long list fires (and lets finish) one request
    // per row it ever passed, even rows only ever rendered in react-window's
    // overscan buffer and never actually seen. `useNativeImage` fetches
    // through an AbortController and is gated on `inViewport`, so leaving
    // the viewport mid-fetch (or never entering it at all) aborts the
    // request instead of letting it run to completion — the same
    // desktop-app image loader already used elsewhere, not a new mechanism.
    const imageRequest = useMemo(() => (src ? { cacheKey: src, url: src } : undefined), [src]);
    const nativeImage = useNativeImage({
        enabled: inViewport,
        onFetchError: onError,
        request: imageRequest,
    });

    // Falls back to `fallbackIcon` on a load error, not just a missing `src`
    // — previously a broken image (unreachable server, no `remoteUrl`
    // configured) rendered the browser's raw broken-image glyph on every
    // list row (tracks/albums/playlists/queue) with no graceful fallback,
    // unlike the desktop app's own image components.
    if (!src || nativeImage.isError) {
        return (
            <Flex
                align="center"
                justify="center"
                ref={ref}
                style={{
                    background: 'var(--theme-colors-surface)',
                    borderRadius: 8,
                    color: 'var(--theme-colors-text-secondary)',
                    flexShrink: 0,
                    height: size,
                    width: size,
                }}
            >
                {fallbackIcon}
            </Flex>
        );
    }

    return (
        <div ref={ref} style={{ flexShrink: 0, height: size, width: size }}>
            {nativeImage.displaySrc && (
                <Image
                    fit="cover"
                    radius={8}
                    src={nativeImage.displaySrc}
                    // Mantine's Image defaults to width:100% via its own
                    // stylesheet, which beats the bare width/height props
                    // (those only set the native <img> attribute, near-zero
                    // CSS specificity) — without this the thumbnail
                    // stretched to fill the whole row. Setting size here, as
                    // an inline style, wins reliably.
                    style={{ height: size, width: size }}
                />
            )}
        </div>
    );
};
