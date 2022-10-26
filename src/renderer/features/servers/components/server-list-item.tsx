import { Stack, Group } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { RiDeleteBin2Fill, RiEdit2Fill } from 'react-icons/ri';
import { Server } from '@/renderer/api/types';
import { Button, Text } from '@/renderer/components';
import { AddServerCredentialForm } from '@/renderer/features/servers/components/add-server-credential-form';
import { AddServerUrlForm } from '@/renderer/features/servers/components/add-server-url-form';
import { EditServerForm } from '@/renderer/features/servers/components/edit-server-form';
import { ServerSection } from '@/renderer/features/servers/components/server-section';
import { useDeleteServerUrl } from '@/renderer/features/servers/mutations/use-delete-server-url';
import { useDisableServerFolder } from '@/renderer/features/servers/mutations/use-disable-server-folder';
import { useDisableServerUrl } from '@/renderer/features/servers/mutations/use-disable-server-url';
import { useEnableServerFolder } from '@/renderer/features/servers/mutations/use-enable-server-folder';
import { useEnableServerUrl } from '@/renderer/features/servers/mutations/use-enable-server-url';
import { usePermissions } from '@/renderer/features/shared';
import { useAuthStore } from '@/renderer/store';

interface ServerListItemProps {
  server: Server;
}

export const ServerListItem = ({ server }: ServerListItemProps) => {
  const [edit, editHandlers] = useDisclosure(false);
  const [addUrl, addUrlHandlers] = useDisclosure(false);
  const [addCredential, addCredentialHandlers] = useDisclosure(false);

  const permissions = usePermissions();
  const enableServerUrl = useEnableServerUrl();
  const disableServerUrl = useDisableServerUrl();
  const deleteServerUrl = useDeleteServerUrl();
  const enableServerFolder = useEnableServerFolder();
  const disableServerFolder = useDisableServerFolder();
  const serverCredentials = useAuthStore((state) => state.serverCredentials);

  const enableServerCredential = useAuthStore(
    (state) => state.enableServerCredential
  );

  const disableServerCredential = useAuthStore(
    (state) => state.disableServerCredential
  );

  const deleteServerCredential = useAuthStore(
    (state) => state.deleteServerCredential
  );

  const handleToggleCredential = (credentialId: string, enabled: boolean) => {
    if (enabled) {
      return disableServerCredential({ id: credentialId });
    }

    return enableServerCredential({ id: credentialId });
  };

  const handleDeleteCredential = (credentialId: string) => {
    deleteServerCredential({ id: credentialId });
  };

  const handleToggleUrl = (urlId: string, enabled: boolean) => {
    if (enabled) {
      return disableServerUrl.mutate({ query: { serverId: server.id, urlId } });
    }

    return enableServerUrl.mutate({ query: { serverId: server.id, urlId } });
  };

  const handleDeleteUrl = (urlId: string) => {
    deleteServerUrl.mutate({
      query: {
        serverId: server.id,
        urlId,
      },
    });
  };

  const handleToggleFolder = (folderId: string, enabled: boolean) => {
    if (enabled) {
      return disableServerFolder.mutate({
        query: { folderId, serverId: server.id },
      });
    }

    return enableServerFolder.mutate({
      query: { folderId, serverId: server.id },
    });
  };

  return (
    <>
      <Stack spacing="xl">
        <ServerSection title="Server details">
          {edit ? (
            <EditServerForm
              server={server}
              onCancel={() => editHandlers.toggle()}
            />
          ) : (
            <Group position="apart">
              <Group>
                <Stack>
                  <Text>URL</Text>
                  <Text>Username</Text>
                </Stack>
                <Stack>
                  <Text>{server.url}</Text>
                  <Text>{server.username}</Text>
                </Stack>
              </Group>
              <Group>
                {permissions.editServer && (
                  <Button
                    tooltip={{ label: 'Edit server details' }}
                    variant="default"
                    onClick={() => editHandlers.toggle()}
                  >
                    <RiEdit2Fill color="white" />
                  </Button>
                )}
              </Group>
            </Group>
          )}
        </ServerSection>
        <ServerSection title="Music Folders">
          <Stack>
            {server.serverFolders?.map((folder) => (
              <Group position="apart">
                <Group>
                  <Text>{folder.name}</Text>
                </Group>
                <Group>
                  <Button
                    compact
                    radius="lg"
                    variant={folder.enabled ? 'filled' : 'subtle'}
                    onClick={() =>
                      handleToggleFolder(folder.id, folder.enabled)
                    }
                  >
                    {folder.enabled ? 'Enabled' : 'Disabled'}
                  </Button>
                  {permissions.deleteServerFolder && (
                    <Button compact disabled radius="xl" variant="subtle">
                      <RiDeleteBin2Fill />
                    </Button>
                  )}
                </Group>
              </Group>
            ))}
          </Stack>
        </ServerSection>
        <ServerSection title="URLs">
          {addUrl ? (
            <AddServerUrlForm
              serverId={server.id}
              onCancel={() => addUrlHandlers.close()}
            />
          ) : (
            <>
              <Stack>
                {server.serverUrls?.map((serverUrl) => (
                  <Group key={serverUrl.id} position="apart">
                    <Text>{serverUrl.url}</Text>
                    <Group>
                      <Button
                        compact
                        radius="lg"
                        variant={serverUrl.enabled ? 'filled' : 'subtle'}
                        onClick={() =>
                          handleToggleUrl(serverUrl.id, serverUrl.enabled)
                        }
                      >
                        {serverUrl.enabled ? 'Enabled' : 'Disabled'}
                      </Button>
                      {permissions.deleteServerUrl && (
                        <Button
                          compact
                          radius="xl"
                          variant="subtle"
                          onClick={() => handleDeleteUrl(serverUrl.id)}
                        >
                          <RiDeleteBin2Fill />
                        </Button>
                      )}
                    </Group>
                  </Group>
                ))}
              </Stack>
              {permissions.createServerUrl && (
                <Button
                  compact
                  mt={10}
                  variant="default"
                  onClick={() => addUrlHandlers.open()}
                >
                  Add URL
                </Button>
              )}
            </>
          )}
        </ServerSection>
        <ServerSection title="Credentials">
          {addCredential ? (
            <AddServerCredentialForm
              server={server}
              onCancel={() => addCredentialHandlers.close()}
            />
          ) : (
            <>
              <Stack>
                {serverCredentials?.map((credential) => (
                  <Group key={credential.id} position="apart">
                    <Text>{credential.username}</Text>
                    <Group>
                      <Button
                        compact
                        radius="lg"
                        variant={credential.enabled ? 'filled' : 'subtle'}
                        onClick={() =>
                          handleToggleCredential(
                            credential.id,
                            credential.enabled
                          )
                        }
                      >
                        {credential.enabled ? 'Disable' : 'Enable'}
                      </Button>
                      {permissions.deleteServerCredential && (
                        <Button
                          compact
                          radius="xl"
                          variant="subtle"
                          onClick={() => handleDeleteCredential(credential.id)}
                        >
                          <RiDeleteBin2Fill />
                        </Button>
                      )}
                    </Group>
                  </Group>
                ))}
              </Stack>
              {permissions.createServerCredential && (
                <Button
                  compact
                  mt={10}
                  variant="default"
                  onClick={() => addCredentialHandlers.open()}
                >
                  Add credential
                </Button>
              )}
            </>
          )}
        </ServerSection>
        <ServerSection title="Danger zone">
          {permissions.deleteServer && (
            <Button compact color="red" leftIcon={<RiDeleteBin2Fill />}>
              Delete server
            </Button>
          )}
        </ServerSection>
      </Stack>
    </>
  );
};
