import formatDuration from 'format-duration';
import debounce from 'lodash/debounce';
import { useCallback } from 'react';
import { RiPauseFill, RiPlayFill, RiVolumeUpFill } from 'react-icons/ri';

import { PlayerImage } from '/@/remote/components/player-image';
import { WrappedSlider } from '/@/remote/components/wrapped-slider';
import { useInfo, useSend, useShowImage } from '/@/remote/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { Rating } from '/@/shared/components/rating/rating';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { Tooltip } from '/@/shared/components/tooltip/tooltip';
import { PlayerRepeat, PlayerStatus } from '/@/shared/types/types';

export const RemoteContainer = () => {
    const { position, repeat, shuffle, song, status, volume } = useInfo();
    const send = useSend();
    const showImage = useShowImage();

    const id = song?.id;

    const setRating = useCallback(
        (rating: number) => {
            send({ event: 'rating', id: id!, rating });
        },
        [send, id],
    );

    const debouncedSetRating = debounce(setRating, 400);

    return (
        <Stack gap="md" h="100dvh" w="100%">
            {showImage && (
                <Flex align="center" justify="center" w="100%">
                    <PlayerImage src={song?.imageUrl} />
                </Flex>
            )}
            {id && (
                <Stack gap="xs">
                    <Text
                        fw={700}
                        size="xl"
                        style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {song.name}
                    </Text>
                    <Text
                        isMuted
                        style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {song.album}
                    </Text>
                    <Text
                        isMuted
                        style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {song.artistName}
                    </Text>
                    <Group justify="space-between">
                        {song.releaseDate && (
                            <Text isMuted>{new Date(song.releaseDate).toLocaleDateString()}</Text>
                        )}
                        <Text isMuted>Plays: {song.playCount}</Text>
                    </Group>
                </Stack>
            )}
            <Group gap={0} grow>
                <ActionIcon
                    disabled={!id}
                    icon="favorite"
                    iconProps={{
                        fill: song?.userFavorite ? 'favorite' : 'default',
                    }}
                    onClick={() => {
                        if (!id) return;

                        send({ event: 'favorite', favorite: !song.userFavorite, id });
                    }}
                    tooltip={{
                        label: song?.userFavorite ? 'Unfavorite' : 'Favorite',
                    }}
                    variant="transparent"
                />
                {(song?._serverType === 'navidrome' || song?._serverType === 'subsonic') && (
                    <div style={{ margin: 'auto' }}>
                        <Tooltip label="Double click to clear" openDelay={1000}>
                            <Rating
                                onChange={debouncedSetRating}
                                onDoubleClick={() => debouncedSetRating(0)}
                                style={{ margin: 'auto' }}
                                value={song.userRating ?? 0}
                            />
                        </Tooltip>
                    </div>
                )}
            </Group>
            <Group gap="xs" grow>
                <ActionIcon
                    disabled={!id}
                    icon="mediaPrevious"
                    iconProps={{
                        fill: 'default',
                        size: 'lg',
                    }}
                    onClick={() => send({ event: 'previous' })}
                    tooltip={{
                        label: 'Previous track',
                    }}
                    variant="default"
                />
                <ActionIcon
                    disabled={!id}
                    onClick={() => {
                        if (status === PlayerStatus.PLAYING) {
                            send({ event: 'pause' });
                        } else if (status === PlayerStatus.PAUSED) {
                            send({ event: 'play' });
                        }
                    }}
                    tooltip={{
                        label: id && status === PlayerStatus.PLAYING ? 'Pause' : 'Play',
                    }}
                    variant="default"
                >
                    {id && status === PlayerStatus.PLAYING ? (
                        <RiPauseFill size={25} />
                    ) : (
                        <RiPlayFill size={25} />
                    )}
                </ActionIcon>
                <ActionIcon
                    disabled={!id}
                    icon="mediaNext"
                    iconProps={{
                        fill: 'default',
                        size: 'lg',
                    }}
                    onClick={() => send({ event: 'next' })}
                    tooltip={{
                        label: 'Next track',
                    }}
                    variant="default"
                />
            </Group>
            <Group gap="xs" grow>
                <ActionIcon
                    icon="mediaShuffle"
                    iconProps={{
                        fill: shuffle ? 'primary' : 'default',
                        size: 'lg',
                    }}
                    onClick={() => send({ event: 'shuffle' })}
                    tooltip={{
                        label: shuffle ? 'Shuffle tracks' : 'Shuffle disabled',
                    }}
                    variant="default"
                />
                <ActionIcon
                    icon={
                        repeat === undefined || repeat === PlayerRepeat.ONE
                            ? 'mediaRepeatOne'
                            : 'mediaRepeat'
                    }
                    iconProps={{
                        fill:
                            repeat !== undefined && repeat !== PlayerRepeat.NONE
                                ? 'primary'
                                : 'default',
                        size: 'lg',
                    }}
                    onClick={() => send({ event: 'repeat' })}
                    tooltip={{
                        label: `Repeat ${
                            repeat === PlayerRepeat.ONE
                                ? 'One'
                                : repeat === PlayerRepeat.ALL
                                  ? 'all'
                                  : 'none'
                        }`,
                    }}
                    variant="default"
                />
            </Group>
            <Stack gap="lg">
                {id && position !== undefined && (
                    <WrappedSlider
                        label={(value) => formatDuration(value * 1e3)}
                        leftLabel={formatDuration(position * 1e3)}
                        max={song.duration / 1e3}
                        onChangeEnd={(e) => send({ event: 'position', position: e })}
                        rightLabel={formatDuration(song.duration)}
                        value={position}
                    />
                )}
                <WrappedSlider
                    leftLabel={<RiVolumeUpFill size={20} />}
                    max={100}
                    onChangeEnd={(e) => send({ event: 'volume', volume: e })}
                    rightLabel={
                        <Text fw={600} size="xs">
                            {volume ?? 0}
                        </Text>
                    }
                    value={volume ?? 0}
                />
            </Stack>
        </Stack>
    );
};
