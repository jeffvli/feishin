import { Stack, Group, Grid, Image } from '@mantine/core';
import { FileWithPath, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { useForm } from '@mantine/form';
import { useClipboard, useFocusTrap } from '@mantine/hooks';
import { RiImage2Line } from 'react-icons/ri';
import { User } from '@/renderer/api/types';
import {
  Button,
  PasswordInput,
  TextInput,
  Switch,
  toast,
  Dropzone,
  Text,
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
      image: null as FileWithPath | null,
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
      image: values.image || undefined,
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

  const getPreview = () => {
    if (form.values.image instanceof File) {
      const imageUrl = URL.createObjectURL(form.values.image);
      return (
        <Image
          height={150}
          imageProps={{ onLoad: () => URL.revokeObjectURL(imageUrl) }}
          radius={100}
          src={imageUrl}
          sx={{ objectFit: 'contain' }}
          width={150}
        />
      );
    }

    return null;
  };

  const handleRemoveImage = () => form.setFieldValue('image', null);

  return (
    <form onSubmit={handleUpdateUser}>
      <Stack ref={focusTrapRef} spacing="xs" sx={{ margin: '5px' }}>
        <Grid>
          <Grid.Col span={4}>
            <Stack spacing="xs" sx={{ height: '100%' }}>
              <Dropzone
                accept={IMAGE_MIME_TYPE}
                maxSize={3 * 1024 ** 2}
                multiple={false}
                onDrop={(file) => form.setFieldValue('image', file[0])}
                onReject={(err) =>
                  toast.error({
                    message: `${err[0].errors[0].message}`,
                    title: 'Invalid Image',
                  })
                }
              >
                <Group>
                  <Dropzone.Idle>
                    {form.values.image ? (
                      <Group position="center">{getPreview()}</Group>
                    ) : (
                      <Group position="center">
                        <RiImage2Line color="var(--primary-color)" size={30} />
                        <Stack spacing="xs">
                          <Text>Profile image</Text>
                          <Text>Max size: 5MB</Text>
                        </Stack>
                      </Group>
                    )}
                  </Dropzone.Idle>
                </Group>
              </Dropzone>
              <Button compact variant="subtle" onClick={handleRemoveImage}>
                Remove image
              </Button>
            </Stack>
          </Grid.Col>
          <Grid.Col span={8}>
            <Stack>
              <TextInput
                data-autofocus
                label="Username"
                {...form.getInputProps('username')}
              />
              <TextInput
                label="Display Name"
                {...form.getInputProps('displayName')}
              />
              <PasswordInput
                label="Password"
                {...form.getInputProps('password')}
              />
              {repeatPassword && (
                <PasswordInput
                  label="Repeat Password"
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
          </Grid.Col>
        </Grid>
      </Stack>
    </form>
  );
};

EditUserForm.defaultProps = {
  repeatPassword: false,
  user: undefined,
};
