import React from 'react';
import { Avatar, Group, Stack } from '@mantine/core';
import { openContextModal } from '@mantine/modals';
import {
  RiAdminLine,
  RiDeleteBin2Line,
  RiEdit2Line,
  RiMore2Fill,
} from 'react-icons/ri';
import { User } from '@/renderer/api/types';
import {
  Button,
  ContextModalVars,
  DropdownMenu,
  Text,
  toast,
  Tooltip,
} from '@/renderer/components';
import { usePermissions } from '@/renderer/features/shared';
import { AddUserForm } from '@/renderer/features/users/components/add-user-form';
import { EditUserForm } from '@/renderer/features/users/components/edit-user-form';
import { EditUserPermissionsForm } from '@/renderer/features/users/components/edit-user-permissions-form';
import { useDeleteUser } from '../mutations/delete-user';
import { useUserList } from '../queries/get-user-list';

export const UserList = () => {
  const permissions = usePermissions();
  const { data: users } = useUserList();

  const handleAddUserModal = () => {
    openContextModal({
      centered: true,
      exitTransitionDuration: 300,
      innerProps: {
        modalBody: (vars: ContextModalVars) => (
          <AddUserForm onCancel={() => vars.context.closeModal(vars.id)} />
        ),
      },
      modal: 'base',
      overflow: 'inside',
      title: 'Add User',
      transition: 'slide-down',
    });
  };

  const handleEditUserModal = (user: User) => {
    openContextModal({
      centered: true,
      exitTransitionDuration: 300,
      innerProps: {
        modalBody: (vars: ContextModalVars) => (
          <EditUserForm
            user={user}
            onCancel={() => vars.context.closeModal(vars.id)}
          />
        ),
      },
      modal: 'base',
      overflow: 'inside',
      size: 'lg',
      title: `Edit User (${user.username})`,
      transition: 'slide-down',
    });
  };

  const deleteUserMutation = useDeleteUser();

  const handleDeleteUser = (user: User) => {
    deleteUserMutation.mutate(
      { query: { userId: user.id } },
      {
        onError: (err) =>
          toast.error({ message: err.response?.data?.error?.message }),
        onSuccess: () =>
          toast.success({
            message: `${user.username} was successfully deleted.`,
            title: 'User deleted',
          }),
      }
    );
  };

  const handleEdituserPermissionsModal = (user: User) => {
    openContextModal({
      centered: true,
      exitTransitionDuration: 300,
      innerProps: {
        modalBody: (vars: ContextModalVars) => (
          <EditUserPermissionsForm
            userId={user.id}
            onCancel={() => vars.context.closeModal(vars.id)}
          />
        ),
      },
      modal: 'base',
      overflow: 'inside',
      title: `Edit Permissions (${user.username})`,
      transition: 'slide-down',
    });
  };

  return (
    <Stack>
      <Group
        mb={10}
        position="right"
        sx={{
          position: 'absolute',
          right: 45,
          transform: 'translateY(-35px)',
        }}
      >
        <Button
          autoFocus
          compact
          variant="default"
          onClick={handleAddUserModal}
        >
          Add user
        </Button>
      </Group>
      {users?.data?.map((u) => (
        <React.Fragment key={u.id}>
          <Group
            noWrap
            p={5}
            position="apart"
            sx={{
              '&:hover': {
                background: 'rgba(125, 125, 125, 0.1)',
              },
              transition: 'background 0.2s ease',
            }}
          >
            <Group noWrap>
              <Avatar radius="xl" src={u.avatarUrl} />
              <Stack spacing="xs">
                <Text overflow="hidden" sx={{ maxWidth: '15rem' }}>
                  {(u.isSuperAdmin || u.isAdmin) && (
                    <Tooltip label={u.isSuperAdmin ? 'Super Admin' : 'Admin'}>
                      <span style={{ marginRight: '.5rem' }}>
                        <RiAdminLine />
                      </span>
                    </Tooltip>
                  )}
                  {u.username}
                </Text>
                <Text
                  $secondary
                  overflow="hidden"
                  size="xs"
                  sx={{ maxWidth: '15rem' }}
                >
                  {u.displayName}
                </Text>
              </Stack>
            </Group>
            <Group noWrap>
              {!u.isAdmin && (
                <Button
                  compact
                  disabled={u.isAdmin}
                  leftIcon={<RiEdit2Line />}
                  variant="subtle"
                  onClick={() => handleEdituserPermissionsModal(u)}
                >
                  Permissions
                </Button>
              )}
              <DropdownMenu position="bottom-start">
                <DropdownMenu.Target>
                  <Button
                    compact
                    disabled={!permissions.isAdmin}
                    variant="subtle"
                  >
                    <RiMore2Fill size={15} />
                  </Button>
                </DropdownMenu.Target>
                <DropdownMenu.Dropdown>
                  <DropdownMenu.Item
                    rightSection={<RiEdit2Line />}
                    onClick={() => handleEditUserModal(u)}
                  >
                    Edit profile
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    rightSection={
                      <RiDeleteBin2Line color="var(--danger-color)" />
                    }
                    onClick={() => handleDeleteUser(u)}
                  >
                    Delete
                  </DropdownMenu.Item>
                </DropdownMenu.Dropdown>
              </DropdownMenu>
            </Group>
          </Group>
        </React.Fragment>
      ))}
    </Stack>
  );
};
