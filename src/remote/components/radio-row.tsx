import { RowComponentProps } from 'react-window-v2';

import { ListRow } from '/@/remote/components/list-row';
import { Thumbnail } from '/@/remote/components/thumbnail';
import { Icon } from '/@/shared/components/icon/icon';
import { Text } from '/@/shared/components/text/text';
import { RemoteRadioItem } from '/@/shared/types/remote-types';

export interface RadioRowSharedProps {
    items: RemoteRadioItem[];
    onPlay: (station: RemoteRadioItem) => void;
}

export const RadioRow = ({
    ariaAttributes,
    index,
    items,
    onPlay,
    style,
}: RowComponentProps<RadioRowSharedProps>) => {
    const station = items[index];

    return (
        <div {...ariaAttributes} style={style}>
            <ListRow onClick={() => onPlay(station)}>
                <Thumbnail
                    fallbackIcon={<Icon icon="emptyImage" size={18} />}
                    src={station.imageUrl}
                />
                <Text
                    fw={500}
                    style={{
                        flex: 1,
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {station.name}
                </Text>
            </ListRow>
        </div>
    );
};
