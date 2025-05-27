import { Image, Title } from '@mantine/core';
import formatDuration from 'format-duration';
import debounce from 'lodash/debounce';
import { useCallback } from 'react';
import {
    RiHeartLine,
    RiPauseFill,
    RiPlayFill,
    RiRepeat2Line,
    RiRepeatOneLine,
    RiShuffleFill,
    RiSkipBackFill,
    RiSkipForwardFill,
    RiVolumeUpFill,
} from 'react-icons/ri';

import { RemoteButton } from '/@/remote/components/buttons/remote-button';
import { WrapperSlider } from '/@/remote/components/wrapped-slider';
import { useInfo, useSend, useShowImage } from '/@/remote/store';
import { Group } from '/@/shared/components/group/group';
import { Rating } from '/@/shared/components/rating/rating';
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
        <>
            {id && (
                <>
                    <Title order={1}>{song.name}</Title>
                    <Group align="flex-end">
                        <Title order={2}>Album: {song.album}</Title>
                        <Title order={2}>Artist: {song.artistName}</Title>
                    </Group>
                    <Group justify="space-between">
                        <Title order={3}>Duration: {formatDuration(song.duration)}</Title>
                        {song.releaseDate && (
                            <Title order={3}>
                                Released: {new Date(song.releaseDate).toLocaleDateString()}
                            </Title>
                        )}
                        <Title order={3}>Plays: {song.playCount}</Title>
                    </Group>
                </>
            )}
            <Group
                gap={0}
                grow
            >
                <RemoteButton
                    disabled={!id}
                    onClick={() => send({ event: 'previous' })}
                    tooltip={{
                        label: 'Previous track',
                    }}
                    variant="default"
                >
                    <RiSkipBackFill size={25} />
                </RemoteButton>
                <RemoteButton
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
                </RemoteButton>
                <RemoteButton
                    disabled={!id}
                    onClick={() => send({ event: 'next' })}
                    tooltip={{
                        label: 'Next track',
                    }}
                    variant="default"
                >
                    <RiSkipForwardFill size={25} />
                </RemoteButton>
            </Group>
            <Group
                gap={0}
                grow
            >
                <RemoteButton
                    isActive={shuffle || false}
                    onClick={() => send({ event: 'shuffle' })}
                    tooltip={{
                        label: shuffle ? 'Shuffle tracks' : 'Shuffle disabled',
                    }}
                    variant="default"
                >
                    <RiShuffleFill size={25} />
                </RemoteButton>
                <RemoteButton
                    isActive={repeat !== undefined && repeat !== PlayerRepeat.NONE}
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
                >
                    {repeat === undefined || repeat === PlayerRepeat.ONE ? (
                        <RiRepeatOneLine size={25} />
                    ) : (
                        <RiRepeat2Line size={25} />
                    )}
                </RemoteButton>
                <RemoteButton
                    disabled={!id}
                    isActive={song?.userFavorite}
                    onClick={() => {
                        if (!id) return;

                        send({ event: 'favorite', favorite: !song.userFavorite, id });
                    }}
                    tooltip={{
                        label: song?.userFavorite ? 'Unfavorite' : 'Favorite',
                    }}
                    variant="default"
                >
                    <RiHeartLine size={25} />
                </RemoteButton>
                {(song?.serverType === 'navidrome' || song?.serverType === 'subsonic') && (
                    <div style={{ margin: 'auto' }}>
                        <Tooltip
                            label="Double click to clear"
                            openDelay={1000}
                        >
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
            {id && position !== undefined && (
                <WrapperSlider
                    label={(value) => formatDuration(value * 1e3)}
                    leftLabel={formatDuration(position * 1e3)}
                    max={song.duration / 1e3}
                    onChangeEnd={(e) => send({ event: 'position', position: e })}
                    rightLabel={formatDuration(song.duration)}
                    value={position}
                />
            )}
            <WrapperSlider
                leftLabel={<RiVolumeUpFill size={20} />}
                max={100}
                onChangeEnd={(e) => send({ event: 'volume', volume: e })}
                rightLabel={
                    <Text
                        fw={600}
                        size="xs"
                    >
                        {volume ?? 0}
                    </Text>
                }
                value={volume ?? 0}
            />
            {showImage && (
                <Image
                    onError={() => send({ event: 'proxy' })}
                    src={song?.imageUrl?.replaceAll(/&(size|width|height=\d+)/g, '')}
                />
            )}
        </>
    );
};
