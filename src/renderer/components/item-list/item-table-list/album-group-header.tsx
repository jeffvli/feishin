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
import { usePlayButtonBehavior } from '/@/renderer/store';
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
    const rowHeight = {
        compact: TableItemSize.COMPACT,
        large: TableItemSize.LARGE,
        normal: TableItemSize.DEFAULT,
    }[size];
    const infoHeight = groupRowCount !== undefined ? groupRowCount * rowHeight : undefined;

    return (
        <div className={styles.container}>
            <div
                className={styles.imageContainer}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
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
