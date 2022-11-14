import { ChangeEvent } from 'react';
import { Stack, Group, Divider } from '@mantine/core';
import { RiServerFill } from 'react-icons/ri';
import { ServerPermissionType } from '@/renderer/api/types';
import {
  Accordion,
  Button,
  Select,
  Switch,
  Text,
  toast,
  Tooltip,
} from '@/renderer/components';
import {
  useCreateServerPermission,
  useServerList,
  useUpdateServerPermission,
  useCreateServerFolderPermission,
  useDeleteServerFolderPermission,
  useDeleteServerPermission,
} from '@/renderer/features/servers';
import { ServerPermission, usePermissions } from '@/renderer/features/shared';
import { useUserDetail } from '@/renderer/features/users/queries/get-user-detail';
import { titleCase } from '@/renderer/utils';

interface EditUserPermissionsFormProps {
  onCancel: () => void;
  userId: string;
}

export const PERMISSION_TYPE_OPTIONS = [
  { label: 'None', value: '' },
  { label: 'Viewer', value: ServerPermissionType.VIEWER },
  { label: 'Editor', value: ServerPermissionType.EDITOR },
  { label: 'Editor', value: ServerPermissionType.EDITOR },
];

export const EditUserPermissionsForm = ({
  userId,
  onCancel,
}: EditUserPermissionsFormProps) => {
  const permissions = usePermissions();
  const { data: servers } = useServerList();
  const { data: user } = useUserDetail({ userId });
  const createServerPermissionMutation = useCreateServerPermission();
  const deleteServerPermissionMutation = useDeleteServerPermission();
  const updateServerPermissionMutation = useUpdateServerPermission();
  const createServerFolderPermissionMutation =
    useCreateServerFolderPermission();
  const deleteServerFolderPermissionMutation =
    useDeleteServerFolderPermission();

  const permissionTypeOptions = [
    { label: 'None', value: 'none' },
    { label: 'Viewer', value: ServerPermissionType.VIEWER },
    { label: 'Editor', value: ServerPermissionType.EDITOR },
    {
      disabled: !permissions.isAdmin,
      label: 'Admin',
      value: ServerPermissionType.ADMIN,
    },
  ];

  return (
    <Stack m={5}>
      <Accordion variant="contained">
        {servers?.data?.map((s) => {
          const currentServerPermission = user?.data?.serverPermissions?.find(
            (p) => p.serverId === s.id
          );

          const isServerAdminEditingSelf =
            permissions[s.id] >= ServerPermission.ADMIN &&
            user?.data.id === permissions.userId;

          const isServerAdminEditingOtherAdmin =
            !permissions.isAdmin &&
            currentServerPermission?.type === ServerPermissionType.ADMIN;

          const isPermissionTypeDisabled =
            isServerAdminEditingSelf || isServerAdminEditingOtherAdmin;

          const handleChangeServerPermission = async (e: string | null) => {
            if (!e || !user) return;

            if (e === 'none' && currentServerPermission) {
              deleteServerPermissionMutation.mutate(
                {
                  query: {
                    permissionId: currentServerPermission.id,
                    serverId: s.id,
                  },
                  userId: user.data.id,
                },
                {
                  onError: (err) =>
                    toast.error({
                      message: err?.response?.data.error.message,
                      title: 'Error deleting folder permission',
                    }),
                }
              );
            } else if (currentServerPermission) {
              updateServerPermissionMutation.mutate(
                {
                  body: {
                    type: e as ServerPermissionType,
                  },
                  query: {
                    permissionId: currentServerPermission.id,
                    serverId: s.id,
                  },
                  userId: user.data.id,
                },
                {
                  onError: (err) =>
                    toast.error({
                      message: err?.response?.data.error.message,
                      title: 'Error updating folder permission',
                    }),
                }
              );
            } else {
              createServerPermissionMutation.mutate(
                {
                  body: {
                    type: e as ServerPermissionType,
                    userId: user.data.id,
                  },
                  query: {
                    serverId: s.id,
                  },
                },
                {
                  onError: (err) =>
                    toast.error({
                      message: err?.response?.data.error.message,
                      title: 'Error creating server permission',
                    }),
                }
              );
            }
          };

          return (
            <Accordion.Item key={`server-permission-${s.id}`} value={s.name}>
              <Accordion.Control icon={<RiServerFill />}>
                <Group>
                  <Text>
                    {s.name} ({titleCase(s.type)})
                  </Text>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack>
                  <Select
                    data={permissionTypeOptions}
                    defaultValue={currentServerPermission?.type || 'none'}
                    disabled={isPermissionTypeDisabled}
                    label="Permission Type"
                    width={150}
                    onChange={handleChangeServerPermission}
                  />
                  <Group>
                    <Tooltip label="Allows the user to trigger full scans and edit user permissions for this server">
                      <span>
                        <Text $secondary size="xs">
                          Admin
                        </Text>
                      </span>
                    </Tooltip>
                    <Tooltip label="Allows the user to trigger quick scans and edit server urls">
                      <span>
                        <Text $secondary size="xs">
                          Editor
                        </Text>
                      </span>
                    </Tooltip>
                    <Tooltip label="Allows the user to view the server">
                      <span>
                        <Text $secondary size="xs">
                          Viewer
                        </Text>
                      </span>
                    </Tooltip>
                  </Group>
                  <Divider my={5} />
                  <Stack spacing={0}>
                    <Text>Music Folders</Text>
                    <Text $secondary size="xs">
                      Server admins have access to all music folders by default.
                    </Text>
                  </Stack>
                  {s.serverFolders?.map((f) => {
                    const currentFolderPermission =
                      user?.data.serverFolderPermissions?.find(
                        (p) => p.serverFolderId === f.id
                      );

                    const handleToggleMusicFolderPermission = async (
                      e: ChangeEvent<HTMLInputElement>
                    ) => {
                      if (!user) return;
                      const { checked } = e.target;
                      const serverId = s.id;

                      if (checked) {
                        createServerFolderPermissionMutation.mutate(
                          {
                            body: {
                              userId: user.data.id,
                            },
                            query: {
                              folderId: f.id,
                              serverId,
                            },
                          },
                          {
                            onError: (err) =>
                              toast.error({
                                message: err?.response?.data.error.message,
                                title: 'Error creating folder permission',
                              }),
                          }
                        );
                      } else if (currentFolderPermission) {
                        deleteServerFolderPermissionMutation.mutate(
                          {
                            query: {
                              folderId: f.id,
                              folderPermissionId: currentFolderPermission.id,
                              serverId,
                            },
                            userId: user.data.id,
                          },
                          {
                            onError: (err) =>
                              toast.error({
                                message: err?.response?.data.error.message,
                                title: 'Error removing folder permission',
                              }),
                          }
                        );
                      }
                    };

                    return (
                      <Switch
                        key={`server-folder-permission-${f.id}`}
                        defaultChecked={user?.data.serverFolderPermissions.some(
                          (p) => p.serverFolderId === f.id
                        )}
                        disabled={isServerAdminEditingOtherAdmin}
                        label={f.name}
                        onChange={handleToggleMusicFolderPermission}
                      />
                    );
                  })}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          );
        })}
      </Accordion>
      <Group mt={10} position="right">
        <Button variant="subtle" onClick={onCancel}>
          Go back
        </Button>
      </Group>
    </Stack>
  );
};
