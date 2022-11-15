import { Checkbox, Stack, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { RiInformationLine } from 'react-icons/ri';
import { Server, ServerType } from '@/renderer/api/types';
import { Button, PasswordInput, TextInput, toast } from '@/renderer/components';
import { useUpdateServer } from '@/renderer/features/servers/mutations/use-update-server';

interface EditServerFormProps {
  onCancel: () => void;
  server: Server;
}

export const EditServerForm = ({ server, onCancel }: EditServerFormProps) => {
  const updateServer = useUpdateServer();

  const serverDetailsForm = useForm({
    initialValues: {
      legacyAuth: false,
      name: server?.name,
      password: '',
      type: server?.type,
      url: server?.url,
      username: server?.username,
    },
  });

  const isSubsonic = serverDetailsForm.values.type === ServerType.SUBSONIC;

  const handleSubmit = serverDetailsForm.onSubmit(async (values) => {
    updateServer.mutate(
      {
        body: {
          name: values.name,
          password: values.password,
          type: values.type,
          url: values.url,
          username: values.username,
        },
        query: { serverId: server.id },
      },
      {
        onSuccess: (data) => {
          toast.show({
            message: `Server "${data.data.name}" updated`,
            type: 'success',
          });
          onCancel();
        },
      }
    );
  });

  return (
    <form onSubmit={handleSubmit}>
      <Stack>
        <TextInput
          required
          label="Name"
          rightSection={
            serverDetailsForm.isDirty('name') && (
              <RiInformationLine color="red" />
            )
          }
          {...serverDetailsForm.getInputProps('name')}
        />
        <TextInput
          required
          label="Url"
          rightSection={
            serverDetailsForm.isDirty('url') && (
              <RiInformationLine color="red" />
            )
          }
          {...serverDetailsForm.getInputProps('url')}
        />
        <TextInput
          label="Username"
          rightSection={
            serverDetailsForm.isDirty('username') && (
              <RiInformationLine color="red" />
            )
          }
          {...serverDetailsForm.getInputProps('username')}
        />
        <PasswordInput
          label="Password"
          {...serverDetailsForm.getInputProps('password')}
        />
        {isSubsonic && (
          <Checkbox
            label="Enable legacy authentication"
            {...serverDetailsForm.getInputProps('legacyAuth', {
              type: 'checkbox',
            })}
          />
        )}
        <Group position="right">
          <Button variant="subtle" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="filled">
            Save
          </Button>
        </Group>
      </Stack>
    </form>
  );
};
