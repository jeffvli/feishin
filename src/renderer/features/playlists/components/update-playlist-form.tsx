import { Group, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { ServerType, UpdatePlaylistBody, UpdatePlaylistQuery, User } from '/@/renderer/api/types';
import { Button, Select, Switch, TextInput, toast } from '/@/renderer/components';
import { useUpdatePlaylist } from '/@/renderer/features/playlists/mutations/update-playlist-mutation';
import { useCurrentServer } from '/@/renderer/store';

interface UpdatePlaylistFormProps {
  body: Partial<UpdatePlaylistBody>;
  onCancel: () => void;
  query: UpdatePlaylistQuery;
  users?: User[];
}

export const UpdatePlaylistForm = ({ users, query, body, onCancel }: UpdatePlaylistFormProps) => {
  const mutation = useUpdatePlaylist({});
  const server = useCurrentServer();

  const userList = users?.map((user) => ({
    label: user.name,
    value: user.id,
  }));

  const form = useForm<UpdatePlaylistBody>({
    initialValues: {
      _custom: {
        navidrome: {
          owner: body?._custom?.navidrome?.owner || '',
          ownerId: body?._custom?.navidrome?.ownerId || '',
          public: body?._custom?.navidrome?.public || false,
          rules: undefined,
          sync: body?._custom?.navidrome?.sync || false,
        },
      },
      comment: body?.comment || '',
      name: body?.name || '',
    },
  });

  const handleSubmit = form.onSubmit((values) => {
    mutation.mutate(
      {
        body: values,
        query,
        serverId: server?.id,
      },
      {
        onError: (err) => {
          toast.error({ message: err.message, title: 'Error updating playlist' });
        },
        onSuccess: () => {
          toast.success({ message: `Playlist has been saved` });
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
        <Select
          data={userList || []}
          {...form.getInputProps('ndParams.ownerId')}
          label="Owner"
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
