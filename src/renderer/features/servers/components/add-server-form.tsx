import { Checkbox, Stack, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useFocusTrap } from '@mantine/hooks';
import { closeAllModals } from '@mantine/modals';
import { ServerType } from '@/renderer/api/types';
import {
  Button,
  PasswordInput,
  TextInput,
  SegmentedControl,
} from '@/renderer/components';
import { useCreateServer } from '@/renderer/features/servers/mutations/create-server';

const SERVER_TYPES = [
  { label: 'Jellyfin', value: ServerType.JELLYFIN },
  { label: 'Navidrome', value: ServerType.NAVIDROME },
  { label: 'Subsonic', value: ServerType.SUBSONIC },
];

interface AddServerFormProps {
  onCancel: () => void;
}

export const AddServerForm = ({ onCancel }: AddServerFormProps) => {
  const focusTrapRef = useFocusTrap(true);

  const form = useForm({
    initialValues: {
      legacyAuth: false,
      name: '',
      password: '',
      type: ServerType.JELLYFIN,
      url: 'http://',
      username: '',
    },
  });

  const createServerMutation = useCreateServer();

  return (
    <form
      onSubmit={form.onSubmit(async (values) => {
        createServerMutation.mutate(
          { body: values },
          { onSuccess: () => closeAllModals() }
        );
      })}
    >
      <Stack ref={focusTrapRef} m={5}>
        <SegmentedControl data={SERVER_TYPES} {...form.getInputProps('type')} />
        <TextInput
          data-autofocus
          required
          label="Name"
          {...form.getInputProps('name')}
        />
        <TextInput required label="Url" {...form.getInputProps('url')} />
        <TextInput
          required
          label="Username"
          {...form.getInputProps('username')}
        />
        <PasswordInput
          required
          label="Password"
          {...form.getInputProps('password')}
        />
        {form.values.type === ServerType.SUBSONIC && (
          <Checkbox
            label="Enable legacy authentication"
            {...form.getInputProps('legacyAuth', { type: 'checkbox' })}
          />
        )}
        <Group position="right">
          <Button variant="subtle" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            loading={createServerMutation.isLoading}
            type="submit"
            variant="filled"
          >
            Add
          </Button>
        </Group>
      </Stack>
    </form>
  );
};
