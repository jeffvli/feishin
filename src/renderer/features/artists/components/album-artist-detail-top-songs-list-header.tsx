import { Flex, Group } from '@mantine/core';
import { RiMoreFill } from 'react-icons/ri';
import { QueueSong } from '/@/renderer/api/types';
import {
  Button,
  DropdownMenu,
  PageHeader,
  TextTitle,
  Badge,
  SpinnerIcon,
} from '/@/renderer/components';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { useContainerQuery } from '/@/renderer/hooks';
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
  const cq = useContainerQuery();

  const handlePlay = async (play: Play) => {
    handlePlayQueueAdd?.({
      byData: data,
      play,
    });
  };

  return (
    <PageHeader p="1rem">
      <Flex
        ref={cq.ref}
        direction="row"
        justify="space-between"
      >
        <Flex
          align="center"
          gap="md"
          justify="center"
        >
          <Button
            compact
            size="xl"
            sx={{ paddingLeft: 0, paddingRight: 0 }}
            variant="subtle"
          >
            <Group noWrap>
              <TextTitle
                maw="20vw"
                order={3}
                overflow="hidden"
                weight={700}
              >
                {title}
              </TextTitle>
              <Badge
                radius="xl"
                size="lg"
              >
                {itemCount === null || itemCount === undefined ? <SpinnerIcon /> : itemCount}
              </Badge>
            </Group>
          </Button>
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
              <DropdownMenu.Item onClick={() => handlePlay(Play.NOW)}>Play</DropdownMenu.Item>
              <DropdownMenu.Item onClick={() => handlePlay(Play.LAST)}>
                Add to queue
              </DropdownMenu.Item>
              <DropdownMenu.Item onClick={() => handlePlay(Play.NEXT)}>
                Add to queue next
              </DropdownMenu.Item>
            </DropdownMenu.Dropdown>
          </DropdownMenu>
        </Flex>
      </Flex>
    </PageHeader>
  );
};
