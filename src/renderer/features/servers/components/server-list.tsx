import { Accordion, Group } from '@mantine/core';
import { RiServerFill } from 'react-icons/ri';
import { Text } from '@/renderer/components';
import { ServerListItem } from '@/renderer/features/servers/components/server-list-item';
import { useServerList } from '@/renderer/features/servers/queries/use-server-list';
import { Font } from '@/renderer/styles';
import { titleCase } from '@/renderer/utils';

export const ServerList = () => {
  const { data: servers } = useServerList();

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
