import { ReactElement, useState } from 'react';

import imageColumnStyles from '../item-detail-list/columns/image-column.module.css';
import styles from './album-group-header.module.css';
import { TableItemSize } from './item-table-list';

import { ItemImage } from '/@/renderer/components/item-image/item-image';
import { PlayButton } from '/@/renderer/features/shared/components/play-button';
import {
    LONG_PRESS_PLAY_BEHAVIOR,
    PlayTooltip,
} from '/@/renderer/features/shared/components/play-button-group';
import { useAlbumGroupImageSize, usePlayButtonBehavior } from '/@/renderer/store';
import { LibraryItem, Song } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

interface AlbumGroupHeaderProps {
    groupRowCount?: number;
    onPlay?: (playType: Play) => void;
    size?: 'compact' | 'large' | 'normal';
    song: Song | undefined;
}

export const AlbumGroupHeader = ({
    groupRowCount,
    onPlay,
    size = 'normal',
    song,
}: AlbumGroupHeaderProps): ReactElement => {
    const [isHovered, setIsHovered] = useState(false);
    const playButtonBehavior = usePlayButtonBehavior();
    const albumImageSize = useAlbumGroupImageSize();
    const rowHeight = {
        compact: TableItemSize.COMPACT,
        large: TableItemSize.LARGE,
        normal: TableItemSize.DEFAULT,
    }[size];
    // The album group spans the combined row height, but when the image is
    // enlarged the group's last row is grown so the total reaches the img size.
    const infoHeight =
        groupRowCount !== undefined
            ? albumImageSize > 0
                ? Math.max(albumImageSize, groupRowCount * rowHeight)
                : groupRowCount * rowHeight
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

    return (
        <div className={styles.container}>
            <div
                className={styles.imageContainer}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={imageContainerStyle}
            >
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
            <div className={styles.info} style={{ height: infoHeight }}>
                <div className={styles.albumName}>{song?.album ?? ''}</div>
                <div className={styles.artistName}>{song?.albumArtistName ?? ''}</div>
            </div>
        </div>
    );
};
