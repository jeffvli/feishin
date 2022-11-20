import { Box } from '@mantine/core';
import styled from 'styled-components';
import { PlayQueue } from '@/renderer/features/now-playing/components/play-queue';
import { AnimatedPage } from '@/renderer/features/shared';

const QueueContainer = styled(Box)`
  position: relative;
  width: 100%;
  height: 100%;
`;

export const NowPlayingRoute = () => {
  return (
    <AnimatedPage>
      <QueueContainer>
        <PlayQueue type="nowPlaying" />
      </QueueContainer>
    </AnimatedPage>
  );
};
