import { Box } from '@mantine/core';
import styled from 'styled-components';
import { PlayQueue } from '/@/features/now-playing/components/play-queue';

const QueueContainer = styled(Box)`
  position: relative;
  width: 100%;
  height: 100%;
`;

const NowPlayingRoute = () => {
  return (
    <QueueContainer>
      <PlayQueue type="nowPlaying" />
    </QueueContainer>
  );
};

export default NowPlayingRoute;
