import formatDuration from 'format-duration';
import { RowComponentProps } from 'react-window-v2';

import { ListRow } from '/@/remote/components/list-row';
import { Thumbnail } from '/@/remote/components/thumbnail';
import { useLongPress } from '/@/remote/hooks/use-long-press';
import { Icon } from '/@/shared/components/icon/icon';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { RemoteTrackItem } from '/@/shared/types/remote-types';

export interface TrackRowSharedProps {
    items: RemoteTrackItem[];
    onLongPress: (track: RemoteTrackItem) => void;
    onPlay: (track: RemoteTrackItem) => void;
}

export const TrackRow = ({
    ariaAttributes,
    index,
    items,
    onLongPress,
    onPlay,
    style,
}: RowComponentProps<TrackRowSharedProps>) => {
    const track = items[index];
    const longPress = useLongPress({
        onClick: () => onPlay(track),
        onLongPress: () => onLongPress(track),
    });

    return (
        <div {...ariaAttributes} style={style}>
            <ListRow {...longPress}>
                <Thumbnail
                    fallbackIcon={<Icon icon="emptySongImage" size={18} />}
                    src={track.imageUrl}
                />
                <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                    <Text
                        fw={500}
                        isNoSelect
                        style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {track.name}
                    </Text>
                    <Text
                        isMuted
                        isNoSelect
                        size="sm"
                        style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {track.artistName}
                        {track.album ? ` · ${track.album}` : ''}
                    </Text>
                </Stack>
                <Text
                    isMuted
                    isNoSelect
                    size="sm"
                    style={{ flexShrink: 0, minWidth: 38, textAlign: 'right' }}
                >
                    {formatDuration(track.duration)}
                </Text>
            </ListRow>
        </div>
    );
};
