import { RiAddBoxFill, RiAddCircleFill, RiMoreFill, RiPlayFill } from 'react-icons/ri';
import { QueueSong } from '/@/renderer/api/types';
import { Button, DropdownMenu, PageHeader, SpinnerIcon, Paper } from '/@/renderer/components';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { LibraryHeaderBar } from '/@/renderer/features/shared';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { Play } from '/@/renderer/types';

interface AlbumArtistDetailTopSongsListHeaderProps {
  data: QueueSong[];
  itemCount?: number;
  title: string;
}

export const AlbumArtistDetailTopSongsListHeader = ({
  title,
  itemCount,
  data,
}: AlbumArtistDetailTopSongsListHeaderProps) => {
  const handlePlayQueueAdd = usePlayQueueAdd();
  const playButtonBehavior = usePlayButtonBehavior();

  const handlePlay = async (playType: Play) => {
    handlePlayQueueAdd?.({
      byData: data,
      playType,
    });
  };

  return (
    <PageHeader p="1rem">
      <LibraryHeaderBar>
        <LibraryHeaderBar.PlayButton onClick={() => handlePlay(playButtonBehavior)} />
        <LibraryHeaderBar.Title>Top songs from {title}</LibraryHeaderBar.Title>
        <Paper
          fw="600"
          px="1rem"
          py="0.3rem"
          radius="sm"
        >
          {itemCount === null || itemCount === undefined ? <SpinnerIcon /> : itemCount}
        </Paper>
        <DropdownMenu position="bottom-start">
          <DropdownMenu.Target>
            <Button
              compact
              fw="600"
              variant="subtle"
            >
              <RiMoreFill size={15} />
            </Button>
          </DropdownMenu.Target>
          <DropdownMenu.Dropdown>
            <DropdownMenu.Item
              icon={<RiPlayFill />}
              onClick={() => handlePlay(Play.NOW)}
            >
              Play
            </DropdownMenu.Item>
            <DropdownMenu.Item
              icon={<RiAddBoxFill />}
              onClick={() => handlePlay(Play.LAST)}
            >
              Add to queue
            </DropdownMenu.Item>
            <DropdownMenu.Item
              icon={<RiAddCircleFill />}
              onClick={() => handlePlay(Play.NEXT)}
            >
              Add to queue next
            </DropdownMenu.Item>
          </DropdownMenu.Dropdown>
        </DropdownMenu>
      </LibraryHeaderBar>
    </PageHeader>
  );
};
