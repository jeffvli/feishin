import styles from './row-index-column.module.css';
import { ItemDetailRowPlayControlCell } from './row-play-control-cell';
import { ItemDetailListCellProps } from './types';
import { useDetailRowPlayControl } from './use-detail-row-play-control';

import { isRowPlayControlColumn } from '/@/renderer/components/item-list/helpers/get-row-play-control-column';
import { Icon } from '/@/shared/components/icon/icon';
import { TableColumn } from '/@/shared/types/types';

const DefaultRowIndexColumn = ({ rowIndex }: ItemDetailListCellProps) => {
    return <>{String((rowIndex ?? 0) + 1)}</>;
};

const PlayableRowIndexColumn = (props: ItemDetailListCellProps) => {
    const { handlePlay, isActive, isPlaying, showPlayControls } = useDetailRowPlayControl(props);

    const indexContent = isActive ? (
        <div className={styles.iconWrapper}>
            <Icon fill="primary" icon={isPlaying ? 'mediaPlay' : 'mediaPause'} />
        </div>
    ) : (
        String((props.rowIndex ?? 0) + 1)
    );

    return (
        <ItemDetailRowPlayControlCell
            indexContent={indexContent}
            onPlay={handlePlay}
            showPlayControls={showPlayControls}
        />
    );
};

export const RowIndexColumn = (props: ItemDetailListCellProps) => {
    if (!props.columns || !isRowPlayControlColumn(TableColumn.ROW_INDEX, props.columns)) {
        return <DefaultRowIndexColumn {...props} />;
    }

    return <PlayableRowIndexColumn {...props} />;
};
