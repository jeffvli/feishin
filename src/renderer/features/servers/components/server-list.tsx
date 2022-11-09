import { Accordion, Group } from '@mantine/core';
import { openContextModal } from '@mantine/modals';
import { RiServerFill } from 'react-icons/ri';
import { Text, Button, ContextModalVars } from '@/renderer/components';
import { ServerListItem } from '@/renderer/features/servers/components/server-list-item';
import { useServerList } from '@/renderer/features/servers/queries/use-server-list';
import { usePermissions } from '@/renderer/features/shared';
import { Font } from '@/renderer/styles';
import { titleCase } from '@/renderer/utils';
import { AddServerForm } from './add-server-form';

export const ServerList = () => {
  const { data: servers } = useServerList();
  const permissions = usePermissions();

  const handleAddServerModal = () => {
    openContextModal({
      centered: true,
      exitTransitionDuration: 300,
      innerProps: {
        modalBody: (vars: ContextModalVars) => (
          <AddServerForm onCancel={() => vars.context.closeModal(vars.id)} />
        ),
      },
      modal: 'base',
      overflow: 'inside',
      title: 'Add server',
      transition: 'slide-down',
    });
  };

  return (
    <>
      <Group mb={10} position="right">
        <Button
          compact
          disabled={!permissions.createServer}
          variant="subtle"
          onClick={handleAddServerModal}
        >
          Add server
        </Button>
      </Group>
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
