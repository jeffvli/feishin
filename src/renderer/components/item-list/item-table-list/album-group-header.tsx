import clsx from 'clsx';
import { ReactElement, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, Link } from 'react-router';

import imageColumnStyles from '../item-detail-list/columns/image-column.module.css';
import { AlbumGroupControls } from './album-group-controls';
import styles from './album-group-header.module.css';
import {
    AlbumGroupMetadata,
    AlbumGroupTextSize,
    renderAlbumGroupMetadataItem,
} from './album-group-metadata';
import { TableItemSize } from './item-table-list';

import { ItemImage } from '/@/renderer/components/item-image/item-image';
import { PlayButton } from '/@/renderer/features/shared/components/play-button';
import {
    LONG_PRESS_PLAY_BEHAVIOR,
    PlayTooltip,
} from '/@/renderer/features/shared/components/play-button-group';
import { AppRoute } from '/@/renderer/router/routes';
import {
    useAlbumGroupImageSize,
    useAlbumGroupItems,
    useAlbumGroupShowFavoriteRating,
    usePlayButtonBehavior,
} from '/@/renderer/store';
import { Text } from '/@/shared/components/text/text';
import { LibraryItem, Song } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

interface AlbumGroupHeaderProps {
    groupKey?: string;
    groupRowCount?: number;
    metadata: AlbumGroupMetadata;
    onPlay?: (playType: Play) => void;
    setAlbumGroupContentHeight?: (groupKey: string, height: number) => void;
    size?: AlbumGroupTextSize;
    song: Song | undefined;
    storedContentHeight?: number;
}

export const AlbumGroupHeader = ({
    groupKey,
    groupRowCount,
    metadata,
    onPlay,
    setAlbumGroupContentHeight,
    size = 'normal',
    song,
    storedContentHeight,
}: AlbumGroupHeaderProps): ReactElement => {
    const { t } = useTranslation();
    const albumGroupItems = useAlbumGroupItems();
    const showFavoriteRating = useAlbumGroupShowFavoriteRating();
    const [isHovered, setIsHovered] = useState(false);
    const [resolved, setResolved] = useState<null | { forInfoHeight: number; height: number }>(
        null,
    );
    const playButtonBehavior = usePlayButtonBehavior();
    const albumImageSize = useAlbumGroupImageSize();
    const rowHeight = {
        compact: TableItemSize.COMPACT,
        large: TableItemSize.LARGE,
        normal: TableItemSize.DEFAULT,
    }[size];

    const albumPath = song?.albumId
        ? generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, { albumId: song.albumId })
        : null;

    const metadataRows = useMemo(() => {
        return albumGroupItems
            .filter((item) => !item.disabled)
            .map((item) => ({
                content: renderAlbumGroupMetadataItem(item.id, song, metadata, t),
                id: item.id,
            }))
            .filter((item) => item.content != null);
    }, [albumGroupItems, metadata, song, t]);

    // The album group spans the combined row height, but when the image is
    // enlarged the group's last row is grown so the total reaches the img size.
    const infoHeight =
        groupRowCount !== undefined
            ? albumImageSize > 0
                ? Math.max(albumImageSize, groupRowCount * rowHeight)
                : groupRowCount * rowHeight
            : undefined;

    // Ignore resolved height from a previous (larger) group span so minHeight
    // cannot keep scrollHeight measurement stuck after a split/shrink.
    const resolvedInfoHeight =
        resolved && infoHeight !== undefined && resolved.forInfoHeight === infoHeight
            ? resolved.height
            : undefined;

    const imageContainerStyle =
        albumImageSize > 0
            ? {
                  aspectRatio: 'auto',
                  height: `${albumImageSize}px`,
                  paddingBottom: 'var(--theme-spacing-xs)',
                  paddingTop: 'var(--theme-spacing-xs)',
                  position: 'relative' as const,
                  width: `${albumImageSize}px`,
                  zIndex: 1,
              }
            : undefined;

    const infoRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const infoEl = infoRef.current;
        if (!infoEl) return;

        const measure = () => {
            const contentHeight = infoEl.scrollHeight;
            const resolvedHeight = Math.max(infoHeight ?? 0, contentHeight);

            if (infoHeight !== undefined) {
                setResolved({ forInfoHeight: infoHeight, height: resolvedHeight });
            }

            if (groupKey !== undefined && setAlbumGroupContentHeight) {
                setAlbumGroupContentHeight(groupKey, contentHeight);
            }
        };

        measure();

        const resizeObserver = new ResizeObserver(measure);
        resizeObserver.observe(infoEl);

        return () => resizeObserver.disconnect();
    }, [
        groupKey,
        groupRowCount,
        infoHeight,
        metadataRows.length,
        setAlbumGroupContentHeight,
        storedContentHeight,
    ]);

    return (
        <div
            className={styles.container}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className={styles.imageContainer} style={imageContainerStyle}>
                <ItemImage
                    className={imageColumnStyles.compactImage}
                    enableDebounce
                    enableViewport={false}
                    id={song?.imageId}
                    itemType={LibraryItem.SONG}
                    src={song?.imageUrl}
                    type="table"
                />
                {isHovered && onPlay && (
                    <div className={imageColumnStyles.playButtonOverlay}>
                        <PlayTooltip type={playButtonBehavior}>
                            <PlayButton
                                fill
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onPlay(playButtonBehavior);
                                }}
                                onLongPress={(e) => {
                                    e.stopPropagation();
                                    onPlay(LONG_PRESS_PLAY_BEHAVIOR[playButtonBehavior]);
                                }}
                            />
                        </PlayTooltip>
                    </div>
                )}
            </div>
            <div
                className={clsx(styles.info, albumImageSize > 0 && styles.enlargedImage)}
                ref={infoRef}
                style={{ minHeight: resolvedInfoHeight ?? infoHeight }}
            >
                {song?.album &&
                    (song.albumId && albumPath ? (
                        <Text
                            className={styles.albumTitle}
                            component={Link}
                            isLink
                            isNoSelect
                            state={{ item: song }}
                            to={albumPath}
                        >
                            {song.album}
                        </Text>
                    ) : (
                        <Text className={styles.albumTitle} isNoSelect>
                            {song.album}
                        </Text>
                    ))}
                {metadataRows.map((row) => (
                    <div key={row.id}>{row.content}</div>
                ))}
                {showFavoriteRating && (
                    <div className={styles.controlsRow}>
                        <AlbumGroupControls
                            albumId={song?.albumId}
                            isGroupHovered={isHovered}
                            serverId={song?._serverId}
                            serverType={song?._serverType}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
