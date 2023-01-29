import { Group } from '@mantine/core';
import { PageHeader, TextTitle } from '/@/renderer/components';

export const NowPlayingHeader = () => {
  // const currentSong = useCurrentSong();
  // const theme = useTheme();

  return (
    <PageHeader>
      <Group p="1rem">
        <TextTitle
          order={3}
          weight={700}
        >
          Queue
        </TextTitle>
      </Group>
    </PageHeader>
  );
};
