import { Group, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { CreatePlaylistBody, RawCreatePlaylistResponse, ServerType } from '/@/renderer/api/types';
import { Button, Switch, TextInput, toast } from '/@/renderer/components';
import { useCreatePlaylist } from '/@/renderer/features/playlists/mutations/create-playlist-mutation';
import { useCurrentServer } from '/@/renderer/store';

interface SaveAsPlaylistFormProps {
  body: Partial<CreatePlaylistBody>;
  onCancel: () => void;
  onSuccess: (data: RawCreatePlaylistResponse) => void;
}

export const SaveAsPlaylistForm = ({ body, onSuccess, onCancel }: SaveAsPlaylistFormProps) => {
  const mutation = useCreatePlaylist();
  const server = useCurrentServer();

  const form = useForm<CreatePlaylistBody>({
    initialValues: {
      comment: body.comment || '',
      name: body.name || '',
      ndParams: {
        public: false,
        rules: undefined,
        ...body.ndParams,
      },
    },
  });

  const handleSubmit = form.onSubmit((values) => {
    mutation.mutate(
      { body: values },
      {
        onError: (err) => {
          toast.error({ message: err.message, title: 'Error creating playlist' });
        },
        onSuccess: (data) => {
          toast.success({ message: 'Playlist created successfully' });
          onSuccess(data);
          onCancel();
        },
      },
    );
  });

  const isPublicDisplayed = server?.type === ServerType.NAVIDROME;
  const isSubmitDisabled = !form.values.name || mutation.isLoading;

  return (
    <form onSubmit={handleSubmit}>
      <Stack>
        <TextInput
          data-autofocus
          required
          label="Name"
          {...form.getInputProps('name')}
        />
        <TextInput
          label="Description"
          {...form.getInputProps('comment')}
        />
        {isPublicDisplayed && (
          <Switch
            label="Is Public?"
            {...form.getInputProps('public')}
          />
        )}
        <Group position="right">
          <Button
            variant="subtle"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            disabled={isSubmitDisabled}
            loading={mutation.isLoading}
            type="submit"
            variant="filled"
          >
            Save
          </Button>
        </Group>
      </Stack>
    </form>
  );
};
