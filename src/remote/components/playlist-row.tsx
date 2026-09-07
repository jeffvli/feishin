import formatDuration from 'format-duration';
import { RowComponentProps } from 'react-window-v2';

import { ListRow } from '/@/remote/components/list-row';
import { Thumbnail } from '/@/remote/components/thumbnail';
import { useLongPress } from '/@/remote/hooks/use-long-press';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { RemotePlaylistItem } from '/@/shared/types/remote-types';

export interface PlaylistRowSharedProps {
    items: RemotePlaylistItem[];
    onLongPress: (playlist: RemotePlaylistItem) => void;
    onPlay: (playlist: RemotePlaylistItem) => void;
}

export const PlaylistRow = ({
    ariaAttributes,
    index,
    items,
    onLongPress,
    onPlay,
    style,
}: RowComponentProps<PlaylistRowSharedProps>) => {
    const playlist = items[index];
    const longPress = useLongPress({
        onClick: () => onPlay(playlist),
        onLongPress: () => onLongPress(playlist),
    });

    return (
        <div {...ariaAttributes} style={style}>
            <ListRow {...longPress}>
                <Thumbnail
                    fallbackIcon={<Icon icon="emptyPlaylistImage" size={18} />}
                    src={playlist.imageUrl}
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
                        {playlist.name}
                    </Text>
                    <Group gap="xs" wrap="nowrap">
                        <Group gap={4} wrap="nowrap">
                            <Icon color="muted" icon="itemSong" size="sm" />
                            <Text isMuted isNoSelect size="sm">
                                {playlist.songCount ?? 0}
                            </Text>
                        </Group>
                        {!!playlist.duration && (
                            <Group gap={4} wrap="nowrap">
                                <Icon color="muted" icon="duration" size="sm" />
                                <Text isMuted isNoSelect size="sm">
                                    {formatDuration(playlist.duration)}
                                </Text>
                            </Group>
                        )}
                    </Group>
                </Stack>
            </ListRow>
        </div>
    );
};
