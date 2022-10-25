import { Accordion, Group } from '@mantine/core';
import { RiRefreshLine, RiRestartLine, RiServerFill } from 'react-icons/ri';
import { Button, Text } from '@/renderer/components';
import { ServerListItem } from '@/renderer/features/servers/components/server-list-item';
import { useServerList } from '@/renderer/features/servers/queries/use-server-list';
import { Font } from '@/renderer/styles';
import { titleCase } from '@/renderer/utils';

export const ServerList = () => {
  const { data: servers } = useServerList();

  const handleQuickScan = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.stopPropagation();
  };

  const handleFullScan = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.stopPropagation();
  };

  return (
    <>
      <Accordion variant="separated">
        {servers?.data?.map((s) => (
          <Accordion.Item key={s.id} value={s.name}>
            <Accordion.Control icon={<RiServerFill size={15} />}>
              <Group position="apart">
                <Text font={Font.GOTHAM}>
                  {titleCase(s.type)} - {s.name}
                </Text>
                <Group spacing="xs">
                  <Button
                    component="div"
                    px={10}
                    role="button"
                    tabIndex={0}
                    tooltip={{ label: 'Full scan' }}
                    variant="subtle"
                    onClick={handleFullScan}
                  >
                    <RiRefreshLine color="white" size={20} />
                  </Button>
                  <Button
                    px={10}
                    tooltip={{ label: 'Quick scan' }}
                    variant="subtle"
                    onClick={handleQuickScan}
                  >
                    <RiRestartLine color="white" size={20} />
                  </Button>
                </Group>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <ServerListItem server={s} />
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </>
  );
};
