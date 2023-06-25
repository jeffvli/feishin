import { Container, Group, Image, Text, Title } from '@mantine/core';
import { useInfo, useSend, useShowImage } from '/@/remote/store';
import { RemoteButton } from '/@/remote/components/buttons/remote-button';
import formatDuration from 'format-duration';
import {
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

export const RemoteContainer = () => {
  const { repeat, shuffle, song, status, volume } = useInfo();
  const send = useSend();
  const showImage = useShowImage();

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
            <Title order={3}>Duration: {formatDuration(song.duration * 1000)}</Title>
            {song.releaseDate && (
              <Title order={3}>
                Released at: {new Date(song.releaseDate).toLocaleDateString()}
              </Title>
            )}
            <Title order={3}>Plays: {song.playCount}</Title>
          </Group>
        </>
      )}
      <Group
        grow
        spacing={0}
      >
        <RemoteButton
          tooltip="Previous track"
          variant="default"
          onClick={() => send('previous')}
        >
          <RiSkipBackFill size={25} />
        </RemoteButton>
        <RemoteButton
          tooltip={status === PlayerStatus.PLAYING ? 'Pause' : 'Play'}
          variant="default"
          onClick={() => {
            if (status === PlayerStatus.PLAYING) {
              send('pause');
            } else if (status === PlayerStatus.PAUSED) {
              send('play');
            }
          }}
        >
          {status === PlayerStatus.PLAYING ? <RiPauseFill size={25} /> : <RiPlayFill size={25} />}
        </RemoteButton>
        <RemoteButton
          tooltip="Next track"
          variant="default"
          onClick={() => send('next')}
        >
          <RiSkipForwardFill size={25} />
        </RemoteButton>
      </Group>
      <Group
        grow
        spacing={0}
      >
        <RemoteButton
          $active={shuffle || false}
          tooltip={shuffle ? 'Shuffle tracks' : 'Shuffle disabled'}
          variant="default"
          onClick={() => send('shuffle')}
        >
          <RiShuffleFill size={25} />
        </RemoteButton>
        <RemoteButton
          $active={repeat !== undefined && repeat !== PlayerRepeat.NONE}
          tooltip={`Repeat ${
            repeat === PlayerRepeat.ONE ? 'One' : repeat === PlayerRepeat.ALL ? 'all' : 'none'
          }`}
          variant="default"
          onClick={() => send('repeat')}
        >
          {repeat === undefined || repeat === PlayerRepeat.ONE ? (
            <RiRepeatOneLine size={25} />
          ) : (
            <RiRepeat2Line size={25} />
          )}
        </RemoteButton>
      </Group>
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
        onChangeEnd={(e) => send('volume', e)}
      />
      {showImage && (
        <Image
          src={song?.imageUrl?.replaceAll(/&(size|width|height=\d+)/g, '')}
          onError={() => send('proxy')}
        />
      )}
    </>
  );
};
