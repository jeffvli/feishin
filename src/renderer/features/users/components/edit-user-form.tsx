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

interface EditUserFormProps {
  onCancel: () => void;
  repeatPassword?: boolean;
  user?: User;
}

export const EditUserForm = ({
  user,
  onCancel,
  repeatPassword,
}: EditUserFormProps) => {
  const permissions = usePermissions();
  const focusTrapRef = useFocusTrap(true);
  const clipboard = useClipboard({ timeout: 1000 });

  const form = useForm({
    initialValues: {
      displayName: user?.displayName || '',
      isAdmin: user?.isAdmin || false,
      password: '',
      repeatPassword: '',
      username: user?.username || '',
    },
  });

  const handleGeneratePassword = () => {
    const pass = randomString();
    form.setFieldValue('password', pass);
    clipboard.copy(pass);
    toast.info({ message: 'Password copied to clipboard' });
  };

  const isSubmitValid = () => {
    if (!repeatPassword) return true;
    return form.values.password === form.values.repeatPassword;
  };

  const updateUserMutation = useUpdateUser();

  const handleUpdateUser = form.onSubmit((values) => {
    if (!user) return;

    const body = {
      ...values,
      displayName: values.displayName || undefined,
      password: values.password || undefined,
      repeatPassword: values.repeatPassword || undefined,
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
          toast.success({
            message: `${values.username} was successfully updated.`,
            title: 'User updated',
          });
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
        {repeatPassword && (
          <PasswordInput
            label="Repeat password"
            {...form.getInputProps('repeatPassword')}
          />
        )}

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
          {!repeatPassword && (
            <Button
              compact
              sx={{ height: '1.5rem' }}
              variant="subtle"
              onClick={handleGeneratePassword}
            >
              Generate password
            </Button>
          )}
        </Group>

        <Group mt={10} position="right">
          <Button variant="subtle" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            disabled={!isSubmitValid()}
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
  repeatPassword: false,
  user: undefined,
};
