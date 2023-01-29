import { Stack, Group, Divider } from '@mantine/core';
import { Button, Text, TimeoutButton } from '/@/renderer/components';
import { useDisclosure } from '@mantine/hooks';
import { RiDeleteBin2Line, RiEdit2Fill } from 'react-icons/ri';
import { EditServerForm } from '/@/renderer/features/servers/components/edit-server-form';
import { ServerSection } from '/@/renderer/features/servers/components/server-section';
import { useAuthStoreActions } from '/@/renderer/store';
import { ServerListItem as ServerItem } from '/@/renderer/types';

interface ServerListItemProps {
  server: ServerItem;
}

export const ServerListItem = ({ server }: ServerListItemProps) => {
  const [edit, editHandlers] = useDisclosure(false);
  const { deleteServer } = useAuthStoreActions();

  const handleDeleteServer = () => {
    deleteServer(server.id);
  };

  return (
    <Stack>
      <ServerSection
        title={
          <Group position="apart">
            <Text>Server details</Text>
          </Group>
        }
      >
        {edit ? (
          <EditServerForm
            server={server}
            onCancel={() => editHandlers.toggle()}
          />
        ) : (
          <Stack>
            <Group noWrap>
              <Stack>
                <Text>URL</Text>
                <Text>Username</Text>
              </Stack>
              <Stack>
                <Text>{server.url}</Text>
                <Text>{server.username}</Text>
              </Stack>
            </Group>
            <Group grow>
              <Button
                leftIcon={<RiEdit2Fill />}
                tooltip={{ label: 'Edit server details' }}
                variant="subtle"
                onClick={() => editHandlers.toggle()}
              >
                Edit
              </Button>
            </Group>
          </Stack>
        )}
      </ServerSection>
      <Divider my="sm" />
      <TimeoutButton
        leftIcon={<RiDeleteBin2Line />}
        timeoutProps={{ callback: handleDeleteServer, duration: 1500 }}
        variant="subtle"
      >
        Remove server
      </TimeoutButton>
    </Stack>
  );
};
