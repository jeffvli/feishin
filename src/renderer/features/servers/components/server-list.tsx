import { Group } from '@mantine/core';
import { openContextModal } from '@mantine/modals';
import { RiAddFill, RiServerFill } from 'react-icons/ri';
import { Button, ContextModalVars, Accordion } from '@/renderer/components';
import { ServerListItem } from '@/renderer/features/servers/components/server-list-item';
import { useServerList } from '@/renderer/features/servers/queries/get-server-list';
import { usePermissions } from '@/renderer/features/shared';
import { titleCase } from '@/renderer/utils';
import { AddServerForm } from './add-server-form';

export const ServerList = () => {
  const serverListQuery = useServerList();
  const permissions = usePermissions();

  const handleAddServerModal = () => {
    openContextModal({
      innerProps: {
        modalBody: (vars: ContextModalVars) => (
          <AddServerForm onCancel={() => vars.context.closeModal(vars.id)} />
        ),
      },
      modal: 'base',
      title: 'Add server',
    });
  };

  return (
    <>
      <Group
        mb={10}
        position="right"
        sx={{
          position: 'absolute',
          right: 55,
          transform: 'translateY(-4rem)',
        }}
      >
        {permissions.isAdmin && (
          <Button
            autoFocus
            compact
            leftIcon={<RiAddFill size={15} />}
            size="sm"
            variant="filled"
            onClick={handleAddServerModal}
          >
            Add server
          </Button>
        )}
      </Group>
      <Accordion variant="separated">
        {serverListQuery?.data?.data.map((s) => (
          <Accordion.Item key={s.id} value={s.name}>
            <Accordion.Control icon={<RiServerFill size={15} />}>
              <Group position="apart">
                {titleCase(s.type)} - {s.name}
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
