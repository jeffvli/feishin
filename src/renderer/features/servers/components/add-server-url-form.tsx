import { Stack, Group } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { useFocusTrap } from '@mantine/hooks';
import { z } from 'zod';
import { Button, TextInput } from '@/renderer/components';
import { useCreateServerUrl } from '@/renderer/features/servers/mutations/create-server-url';

interface AddServerUrlFormProps {
  onCancel: () => void;
  serverId: string;
}

const schema = z.object({
  url: z.string().url({ message: 'Invalid URL' }),
});

export const AddServerUrlForm = ({
  serverId,
  onCancel,
}: AddServerUrlFormProps) => {
  const focusTrapRef = useFocusTrap(true);

  const form = useForm({
    initialValues: {
      url: 'http://',
    },
    validate: zodResolver(schema),
  });

  const mutation = useCreateServerUrl();

  const handleSubmit = form.onSubmit((values) => {
    mutation.mutate(
      { body: values, query: { serverId } },
      { onSuccess: () => onCancel() }
    );
  });

  return (
    <form onSubmit={handleSubmit}>
      <Stack ref={focusTrapRef}>
        <TextInput
          data-autofocus
          required
          label="URL"
          {...form.getInputProps('url')}
        />
        <Group position="right">
          <Button variant="subtle" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="filled">
            Add
          </Button>
        </Group>
      </Stack>
    </form>
  );
};
