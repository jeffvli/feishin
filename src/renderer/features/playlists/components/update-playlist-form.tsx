import { Group, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { ServerType, UpdatePlaylistBody, UpdatePlaylistQuery } from '/@/renderer/api/types';
import { Button, Switch, TextInput, toast } from '/@/renderer/components';
import { useUpdatePlaylist } from '/@/renderer/features/playlists/mutations/update-playlist-mutation';
import { useCurrentServer } from '/@/renderer/store';

interface CreatePlaylistFormProps {
  body: Partial<UpdatePlaylistBody>;
  onCancel: () => void;
  query: UpdatePlaylistQuery;
}

export const UpdatePlaylistForm = ({ query, body, onCancel }: CreatePlaylistFormProps) => {
  const mutation = useUpdatePlaylist();
  const server = useCurrentServer();

  const form = useForm<UpdatePlaylistBody>({
    initialValues: {
      comment: '',
      name: '',
      public: false,
      rules: undefined,
      ...body,
    },
  });

  const handleSubmit = form.onSubmit((values) => {
    mutation.mutate(
      { body: values, query },
      {
        onError: (err) => {
          toast.error({ message: err.message, title: 'Error updating playlist' });
        },
        onSuccess: () => {
          toast.success({ message: 'Playlist updated successfully' });
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
