import { ItemDetailRowPlayControlCell } from './row-play-control-cell';
import styles from './row-play-control-cell.module.css';
import { ItemDetailListCellProps } from './types';
import { useDetailRowPlayControl } from './use-detail-row-play-control';

import { isRowPlayControlColumn } from '/@/renderer/components/item-list/helpers/get-row-play-control-column';
import { Icon } from '/@/shared/components/icon/icon';
import { TableColumn } from '/@/shared/types/types';

const formatTrackNumber = (song: ItemDetailListCellProps['song']) => {
    const disc = song.discNumber ?? 1;
    const track = song.trackNumber.toString().padStart(2, '0');
    return `${disc}-${track}`;
};

const DefaultTrackNumberColumn = ({ song }: ItemDetailListCellProps) => {
    return <>{formatTrackNumber(song)}</>;
};

const PlayableTrackNumberColumn = (props: ItemDetailListCellProps) => {
    const { handlePlay, isActive, isPlaying, showPlayControls } = useDetailRowPlayControl(props);

    const indexContent = isActive ? (
        <div className={styles.iconWrapper}>
            <Icon fill="primary" icon={isPlaying ? 'mediaPlay' : 'mediaPause'} />
        </div>
    ) : (
        formatTrackNumber(props.song)
    );

    return (
        <ItemDetailRowPlayControlCell
            indexContent={indexContent}
            onPlay={handlePlay}
            showPlayControls={showPlayControls}
        />
    );
};

export const TrackNumberColumn = (props: ItemDetailListCellProps) => {
    if (!props.columns || !isRowPlayControlColumn(TableColumn.TRACK_NUMBER, props.columns)) {
        return <DefaultTrackNumberColumn {...props} />;
    }

    return <PlayableTrackNumberColumn {...props} />;
};
