import { PageHeader } from '/@/renderer/components';
import { LibraryHeaderBar } from '/@/renderer/features/shared';

export const NowPlayingHeader = () => {
  // const currentSong = useCurrentSong();
  // const theme = useTheme();

  return (
    <PageHeader backgroundColor="var(--titlebar-bg)">
      <LibraryHeaderBar>
        <LibraryHeaderBar.Title>Queue</LibraryHeaderBar.Title>
      </LibraryHeaderBar>
    </PageHeader>
  );
};
