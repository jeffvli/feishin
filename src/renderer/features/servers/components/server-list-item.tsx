import { useMemo } from 'react';
import { Stack, Group, Divider } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { RiDeleteBin2Line, RiEdit2Fill } from 'react-icons/ri';
import { queryKeys } from '@/renderer/api/query-keys';
import { Server, TaskType } from '@/renderer/api/types';
import { Button, Switch, Text, toast } from '@/renderer/components';
import { AddServerCredentialForm } from '@/renderer/features/servers/components/add-server-credential-form';
import { AddServerUrlForm } from '@/renderer/features/servers/components/add-server-url-form';
import { EditServerForm } from '@/renderer/features/servers/components/edit-server-form';
import { ServerSection } from '@/renderer/features/servers/components/server-section';
import { useDeleteServerUrl } from '@/renderer/features/servers/mutations/use-delete-server-url';
import { useDisableServerFolder } from '@/renderer/features/servers/mutations/use-disable-server-folder';
import { useDisableServerUrl } from '@/renderer/features/servers/mutations/use-disable-server-url';
import { useEnableServerFolder } from '@/renderer/features/servers/mutations/use-enable-server-folder';
import { useEnableServerUrl } from '@/renderer/features/servers/mutations/use-enable-server-url';
import { useFullScan } from '@/renderer/features/servers/mutations/use-full-scan';
import { useQuickScan } from '@/renderer/features/servers/mutations/use-quick-scan';
import { useUpdateServer } from '@/renderer/features/servers/mutations/use-update-server';
import { usePermissions } from '@/renderer/features/shared';
import { useTaskList } from '@/renderer/features/tasks';
import { useAuthStore } from '@/renderer/store';
import { Font } from '@/renderer/styles';

interface ServerListItemProps {
  server: Server;
}

export const ServerListItem = ({ server }: ServerListItemProps) => {
  const queryClient = useQueryClient();
  const [edit, editHandlers] = useDisclosure(false);
  const [addUrl, addUrlHandlers] = useDisclosure(false);
  const [addCredential, addCredentialHandlers] = useDisclosure(false);

  const permissions = usePermissions();
  const updateServer = useUpdateServer();
  const enableServerUrl = useEnableServerUrl();
  const disableServerUrl = useDisableServerUrl();
  const deleteServerUrl = useDeleteServerUrl();
  const enableServerFolder = useEnableServerFolder();
  const disableServerFolder = useDisableServerFolder();
  const fullScan = useFullScan();
  const quickScan = useQuickScan();
  const { data: tasks } = useTaskList();

  const isRunningTask = useMemo(() => {
    return tasks?.data.some(
      (task) =>
        task.server?.id === server.id &&
        (task.type === TaskType.FULL_SCAN || task.type === TaskType.QUICK_SCAN)
    );
  }, [server.id, tasks?.data]);

  const serverCredentials = useAuthStore(
    (state) => state.serverCredentials
  ).filter((credential) => credential.serverId === server.id);

  const handleFullScan = () => {
    fullScan.mutate(
      { body: {}, query: { serverId: server.id } },
      {
        onSuccess: () => {
          toast.show({ message: 'Full scan started', type: 'info' });
          queryClient.invalidateQueries(queryKeys.tasks.root);
        },
      }
    );
  };

  const handleQuickScan = () => {
    quickScan.mutate(
      { body: {}, query: { serverId: server.id } },
      {
        onSuccess: () => {
          toast.show({ message: 'Quick scan started', type: 'info' });
          queryClient.invalidateQueries(queryKeys.tasks.root);
        },
      }
    );
  };

  const toggleRequiredCredential = (e: boolean) => {
    updateServer.mutate({
      body: { noCredential: e, type: server.type },
      query: { serverId: server.id },
    });
  };

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
      <Stack mt="1rem" spacing="xl">
        <ServerSection
          title={
            <Group position="apart">
              <Text font={Font.EPILOGUE}>Server details</Text>
              <Group spacing="md">
                <Button
                  compact
                  disabled={isRunningTask}
                  loading={fullScan.isLoading}
                  variant="subtle"
                  onClick={handleFullScan}
                >
                  Full scan
                </Button>
                <Button
                  compact
                  disabled={true || isRunningTask}
                  variant="subtle"
                  onClick={handleQuickScan}
                >
                  Quick scan
                </Button>
              </Group>
            </Group>
          }
        >
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
                  <Text size="sm">{server.url}</Text>
                  <Text size="sm">{server.username}</Text>
                </Stack>
              </Group>
              <Group>
                <Button
                  disabled={!permissions.editServer}
                  tooltip={{ label: 'Edit server details' }}
                  variant="default"
                  onClick={() => editHandlers.toggle()}
                >
                  <RiEdit2Fill color="white" />
                </Button>
              </Group>
            </Group>
          )}
        </ServerSection>
        <ServerSection title="Music Folders">
          <Stack>
            {server.serverFolders?.map((folder) => (
              <Group key={folder.id} position="apart">
                <Group>
                  <Button
                    compact
                    disabled={true || !permissions.deleteServerFolder}
                    variant="subtle"
                  >
                    <RiDeleteBin2Line color="var(--danger-color)" />
                  </Button>
                  <Text size="sm">{folder.name}</Text>
                </Group>
                <Switch
                  checked={folder.enabled}
                  onChange={(e) =>
                    handleToggleFolder(folder.id, !e.currentTarget.checked)
                  }
                />
              </Group>
            ))}
          </Stack>
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
                    <Group>
                      <Button
                        compact
                        disabled={!permissions.deleteServerCredential}
                        variant="subtle"
                        onClick={() => handleDeleteCredential(credential.id)}
                      >
                        <RiDeleteBin2Line color="var(--danger-color)" />
                      </Button>
                      <Text size="sm">{credential.username}</Text>
                    </Group>
                    <Switch
                      checked={credential.enabled}
                      onChange={(e) =>
                        handleToggleCredential(
                          credential.id,
                          !e.currentTarget.checked
                        )
                      }
                    />
                  </Group>
                ))}
              </Stack>
              <Button
                compact
                disabled={!permissions.createServerCredential}
                mt={10}
                variant="subtle"
                onClick={() => addCredentialHandlers.open()}
              >
                Add credential
              </Button>
            </>
          )}
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
                    <Group>
                      <Button
                        compact
                        disabled={!permissions.deleteServerUrl}
                        variant="subtle"
                        onClick={() => handleDeleteUrl(serverUrl.id)}
                      >
                        <RiDeleteBin2Line color="var(--danger-color)" />
                      </Button>
                      <Text size="sm">{serverUrl.url}</Text>
                    </Group>
                    <Switch
                      checked={serverUrl.enabled}
                      onChange={(e) =>
                        handleToggleUrl(serverUrl.id, !e.currentTarget.checked)
                      }
                    />
                  </Group>
                ))}
              </Stack>
              <Button
                compact
                disabled={!permissions.createServerUrl}
                mt={10}
                variant="subtle"
                onClick={() => addUrlHandlers.open()}
              >
                Add url
              </Button>
            </>
          )}
        </ServerSection>

        <ServerSection title="Danger zone">
          <Group position="apart">
            <Text size="sm">Require user credentials</Text>
            <Switch
              checked={server.noCredential}
              disabled={!permissions.isAdmin}
              onChange={(e) =>
                toggleRequiredCredential(e.currentTarget.checked)
              }
            />
          </Group>
          <Divider my="xl" />
          <Button
            compact
            disabled={!permissions.deleteServer}
            leftIcon={<RiDeleteBin2Line color="var(--danger-color)" />}
            variant="default"
          >
            Delete server
          </Button>
        </ServerSection>
      </Stack>
    </>
  );
};
