import { Stack, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useClipboard, useFocusTrap } from '@mantine/hooks';
import { User } from '@/renderer/api/types';
import {
  Button,
  PasswordInput,
  TextInput,
  Switch,
  toast,
} from '@/renderer/components';
import { usePermissions } from '@/renderer/features/shared';
import { useUpdateUser } from '@/renderer/features/users/mutations/update-user';
import { randomString } from '@/renderer/utils';

interface AddUserFormProps {
  onCancel: () => void;
  user?: User;
}

export const EditUserForm = ({ user, onCancel }: AddUserFormProps) => {
  const permissions = usePermissions();
  const focusTrapRef = useFocusTrap(true);
  const clipboard = useClipboard({ timeout: 1000 });

  const form = useForm({
    initialValues: {
      displayName: user?.displayName || '',
      isAdmin: user?.isAdmin || false,
      password: '',
      username: user?.username || '',
    },
  });

  const handleGeneratePassword = () => {
    const pass = randomString();
    form.setFieldValue('password', pass);
    clipboard.copy(pass);
    toast.info({ message: 'Password copied to clipboard' });
  };

  const updateUserMutation = useUpdateUser();

  const handleUpdateUser = form.onSubmit((values) => {
    if (!user) return;

    const body = {
      ...values,
      displayName: values.displayName || undefined,
      password: values.password || undefined,
    };

    updateUserMutation.mutate(
      {
        body,
        query: { userId: user.id },
      },
      {
        onError: (err) =>
          toast.error({ message: err.response?.data?.error?.message }),
        onSuccess: () => {
          toast.success({ message: 'User updated' });
          onCancel();
        },
      }
    );
  });

  return (
    <form onSubmit={handleUpdateUser}>
      <Stack ref={focusTrapRef} spacing="xl">
        <TextInput
          data-autofocus
          label="Username"
          {...form.getInputProps('username')}
        />
        <TextInput
          label="Display name"
          {...form.getInputProps('displayName')}
        />
        <PasswordInput label="Password" {...form.getInputProps('password')} />
        <Group position="apart">
          {permissions.isAdmin && !user?.isSuperAdmin ? (
            <Group>
              Admin
              <Switch
                {...form.getInputProps('isAdmin', { type: 'checkbox' })}
              />
            </Group>
          ) : (
            <Group />
          )}
          <Button
            compact
            sx={{ height: '1.5rem' }}
            variant="subtle"
            onClick={handleGeneratePassword}
          >
            Generate password
          </Button>
        </Group>

        <Group mt={10} position="right">
          <Button variant="subtle" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            loading={updateUserMutation.isLoading}
            type="submit"
            variant="filled"
          >
            Submit
          </Button>
        </Group>
      </Stack>
    </form>
  );
};

EditUserForm.defaultProps = {
  user: undefined,
};
