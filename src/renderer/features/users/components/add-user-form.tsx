import { Stack, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useClipboard, useFocusTrap } from '@mantine/hooks';
import {
  Button,
  PasswordInput,
  TextInput,
  Switch,
  toast,
} from '@/renderer/components';
import { usePermissions } from '@/renderer/features/shared';
import { useCreateUser } from '@/renderer/features/users/mutations/create-user';
import { randomString } from '@/renderer/utils';

interface AddUserFormProps {
  onCancel: () => void;
}

export const AddUserForm = ({ onCancel }: AddUserFormProps) => {
  const permissions = usePermissions();
  const focusTrapRef = useFocusTrap(true);
  const clipboard = useClipboard({ timeout: 1000 });

  const form = useForm({
    initialValues: {
      displayName: '',
      isAdmin: false,
      password: '',
      username: '',
    },
  });

  const handleGeneratePassword = () => {
    const pass = randomString();
    form.setFieldValue('password', pass);
    clipboard.copy(pass);
    toast.info({ message: 'Password copied to clipboard' });
  };

  const createUserMutation = useCreateUser();

  const handleAddUser = form.onSubmit((values) => {
    const body = {
      ...values,
      displayName: values.displayName || undefined,
    };

    createUserMutation.mutate(
      { body },
      {
        onError: (err) =>
          toast.error({ message: err.response?.data?.error?.message }),
        onSuccess: () => {
          toast.success({
            message: `${values.username} was successfully created.`,
            title: 'User created',
          });
          onCancel();
        },
      }
    );
  });

  return (
    <form onSubmit={handleAddUser}>
      <Stack ref={focusTrapRef} m={5}>
        <TextInput
          data-autofocus
          required
          label="Username"
          {...form.getInputProps('username')}
        />
        <TextInput
          label="Display name"
          {...form.getInputProps('displayName')}
        />
        <PasswordInput
          required
          label="Password"
          {...form.getInputProps('password')}
        />
        <Group position="apart">
          {permissions.isSuperAdmin ? (
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
            loading={createUserMutation.isLoading}
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
