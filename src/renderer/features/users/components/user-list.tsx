import { Avatar, Group, Stack } from '@mantine/core';
import { openContextModal } from '@mantine/modals';
import { RiAdminLine, RiDeleteBin2Line, RiEdit2Line } from 'react-icons/ri';
import { User } from '@/renderer/api/types';
import {
  Button,
  ContextModalVars,
  Popover,
  Text,
  toast,
  Tooltip,
} from '@/renderer/components';
import { usePermissions } from '@/renderer/features/shared';
import { AddUserForm } from '@/renderer/features/users/components/add-user-form';
import { EditUserForm } from '@/renderer/features/users/components/edit-user-form';
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
      title: `Edit User`,
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

  return (
    <Stack>
      <Group mb={10} position="right">
        <Button compact variant="default" onClick={handleAddUserModal}>
          Add user
        </Button>
      </Group>
      {users?.data?.map((u) => (
        <Group
          key={u.id}
          noWrap
          position="apart"
          sx={{
            '&:hover': {
              background: 'rgba(125, 125, 125, 0.1)',
            },
          }}
        >
          <Group>
            <Avatar radius="xl" />
            <Text overflow="hidden">
              {u.displayName ? u.displayName : u.username}{' '}
              {u.isAdmin && (
                <Tooltip label="Admin">
                  <span>
                    <RiAdminLine />
                  </span>
                </Tooltip>
              )}
            </Text>
          </Group>
          <Group>
            <Button
              compact
              disabled={!permissions.isAdmin}
              leftIcon={<RiEdit2Line />}
              variant="subtle"
              onClick={() => handleEditUserModal(u)}
            >
              Edit
            </Button>
            <Popover position="bottom-start">
              <Popover.Target>
                <Button
                  compact
                  disabled={!permissions.isAdmin}
                  variant="subtle"
                >
                  <RiDeleteBin2Line color="var(--danger-color)" size={15} />
                </Button>
              </Popover.Target>
              <Popover.Dropdown>
                <Group>
                  <Button
                    compact
                    uppercase
                    sx={{
                      '&:hover': {
                        background: 'var(--danger-color)',
                      },
                      background: 'var(--danger-color)',
                    }}
                    onClick={() => handleDeleteUser(u)}
                  >
                    Delete
                  </Button>
                </Group>
              </Popover.Dropdown>
            </Popover>
          </Group>
        </Group>
      ))}
    </Stack>
  );
};
