import { useCallback } from 'react';
import { Center, Grid, Group, Image, MediaQuery, Text, Title } from '@mantine/core';
import { useInfo, useSend, useShowImage } from '/@/remote/store';
import { RemoteButton } from '/@/remote/components/buttons/remote-button';
import formatDuration from 'format-duration';
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
import { PlayerRepeat, PlayerStatus } from '/@/renderer/types';
import { WrapperSlider } from '/@/remote/components/wrapped-slider';
import { Rating } from '/@/renderer/components';

export const RemoteContainer = () => {
    const { repeat, shuffle, song, status, volume } = useInfo();
    const send = useSend();
    const showImage = useShowImage();

    const id = song?.id;

    const setRating = useCallback(
        (rating: number) => {
            send({ event: 'rating', id: id!, rating });
        },
        [send, id],
    );

    return (
        <>
            {song && (
                <>
                    <Title order={1}>{song.name}</Title>
                    <Group align="flex-end">
                        <Title order={2}>Album: {song.album}</Title>
                        <Title order={2}>Artist: {song.artistName}</Title>
                    </Group>
                    <Group position="apart">
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
            <Grid
                grow
                align="center"
                gutter={0}
            >
                <Grid.Col span={4}>
                    <RemoteButton
                        tooltip="Previous track"
                        onClick={() => send({ event: 'previous' })}
                    >
                        <RiSkipBackFill size={25} />
                    </RemoteButton>
                </Grid.Col>
                <Grid.Col span={4}>
                    <RemoteButton
                        tooltip={status === PlayerStatus.PLAYING ? 'Pause' : 'Play'}
                        onClick={() => {
                            if (status === PlayerStatus.PLAYING) {
                                send({ event: 'pause' });
                            } else if (status === PlayerStatus.PAUSED) {
                                send({ event: 'play' });
                            }
                        }}
                    >
                        {status === PlayerStatus.PLAYING ? (
                            <RiPauseFill size={25} />
                        ) : (
                            <RiPlayFill size={25} />
                        )}
                    </RemoteButton>
                </Grid.Col>

                <Grid.Col span={4}>
                    <RemoteButton
                        tooltip="Next track"
                        onClick={() => send({ event: 'next' })}
                    >
                        <RiSkipForwardFill size={25} />
                    </RemoteButton>
                </Grid.Col>
            </Grid>
            <Grid
                grow
                align="center"
                gutter={0}
            >
                <Grid.Col
                    md={3}
                    span={4}
                >
                    <RemoteButton
                        $active={shuffle || false}
                        tooltip={shuffle ? 'Shuffle tracks' : 'Shuffle disabled'}
                        onClick={() => send({ event: 'shuffle' })}
                    >
                        <RiShuffleFill size={25} />
                    </RemoteButton>
                </Grid.Col>
                <Grid.Col
                    md={3}
                    span={4}
                >
                    <RemoteButton
                        $active={repeat !== undefined && repeat !== PlayerRepeat.NONE}
                        tooltip={`Repeat ${
                            repeat === PlayerRepeat.ONE
                                ? 'One'
                                : repeat === PlayerRepeat.ALL
                                ? 'all'
                                : 'none'
                        }`}
                        onClick={() => send({ event: 'repeat' })}
                    >
                        {repeat === undefined || repeat === PlayerRepeat.ONE ? (
                            <RiRepeatOneLine size={25} />
                        ) : (
                            <RiRepeat2Line size={25} />
                        )}
                    </RemoteButton>
                </Grid.Col>

                <Grid.Col
                    md={3}
                    span={4}
                >
                    <RemoteButton
                        $active={song?.userFavorite}
                        disabled={!song}
                        tooltip={song?.userFavorite ? 'Unfavorite' : 'Favorite'}
                        onClick={() => {
                            if (!id) return;

                            send({ event: 'favorite', favorite: !song.userFavorite, id });
                        }}
                    >
                        <RiHeartLine size={25} />
                    </RemoteButton>
                </Grid.Col>

                {(song?.serverType === 'navidrome' || song?.serverType === 'subsonic') && (
                    <MediaQuery
                        smallerThan="md"
                        styles={{ marginTop: 10 }}
                    >
                        <Grid.Col
                            md={3}
                            span={4}
                        >
                            <Center>
                                <Rating
                                    size="xl"
                                    value={song.userRating ?? 0}
                                    onChange={setRating}
                                />
                            </Center>
                        </Grid.Col>
                    </MediaQuery>
                )}
            </Grid>
            <WrapperSlider
                leftLabel={<RiVolumeUpFill size={20} />}
                max={100}
                rightLabel={
                    <Text
                        size="xs"
                        weight={600}
                    >
                        {volume ?? 0}
                    </Text>
                }
                value={volume ?? 0}
                onChangeEnd={(e) => send({ event: 'volume', volume: e })}
            />
            {showImage && (
                <Image
                    src={song?.imageUrl?.replaceAll(/&(size|width|height=\d+)/g, '')}
                    onError={() => send({ event: 'proxy' })}
                />
            )}
        </>
    );
};
