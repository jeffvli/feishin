import { Group } from '@mantine/core';
import { Accordion, Button, ContextModalVars } from '/@/renderer/components';
import { openContextModal } from '@mantine/modals';
import { RiAddFill, RiServerFill } from 'react-icons/ri';
import { AddServerForm } from '/@/renderer/features/servers/components/add-server-form';
import { ServerListItem } from '/@/renderer/features/servers/components/server-list-item';
import { useServerList } from '/@/renderer/store';
import { titleCase } from '/@/renderer/utils';

export const ServerList = () => {
  const serverListQuery = useServerList();

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
      </Group>
      <Accordion variant="separated">
        {serverListQuery?.map((s) => (
          <Accordion.Item
            key={s.id}
            value={s.name}
          >
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
