import { Group, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useRef, useState } from 'react';
import { CreatePlaylistBody, ServerType, SongListSort } from '/@/renderer/api/types';
import { Button, Switch, Text, TextInput, toast } from '/@/renderer/components';
import {
  PlaylistQueryBuilder,
  PlaylistQueryBuilderRef,
} from '/@/renderer/features/playlists/components/playlist-query-builder';
import { useCreatePlaylist } from '/@/renderer/features/playlists/mutations/create-playlist-mutation';
import { convertQueryGroupToNDQuery } from '/@/renderer/features/playlists/utils';
import { useCurrentServer } from '/@/renderer/store';

interface CreatePlaylistFormProps {
  onCancel: () => void;
}

export const CreatePlaylistForm = ({ onCancel }: CreatePlaylistFormProps) => {
  const mutation = useCreatePlaylist({});
  const server = useCurrentServer();
  const queryBuilderRef = useRef<PlaylistQueryBuilderRef>(null);

  const form = useForm<CreatePlaylistBody>({
    initialValues: {
      _custom: {
        navidrome: {
          public: false,
          rules: undefined,
        },
      },
      comment: '',
      name: '',
    },
  });
  const [isSmartPlaylist, setIsSmartPlaylist] = useState(false);

  const handleSubmit = form.onSubmit((values) => {
    if (isSmartPlaylist) {
      values._custom!.navidrome = {
        ...values._custom?.navidrome,
        rules: queryBuilderRef.current?.getFilters(),
      };
    }

    const smartPlaylist = queryBuilderRef.current?.getFilters();

    if (!server) return;

    mutation.mutate(
      {
        body: {
          ...values,
          _custom: {
            navidrome: {
              ...values._custom?.navidrome,
              rules:
                isSmartPlaylist && smartPlaylist?.filters
                  ? {
                      ...convertQueryGroupToNDQuery(smartPlaylist.filters),
                      ...smartPlaylist.extraFilters,
                    }
                  : undefined,
            },
          },
        },
        serverId: server.id,
      },
      {
        onError: (err) => {
          toast.error({ message: err.message, title: 'Error creating playlist' });
        },
        onSuccess: () => {
          toast.success({ message: `Playlist has been created` });
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
        <Group>
          {isPublicDisplayed && (
            <Switch
              label="Is public?"
              {...form.getInputProps('ndParams.public')}
            />
          )}
          {server?.type === ServerType.NAVIDROME && (
            <Switch
              label="Is smart playlist?"
              onChange={(e) => setIsSmartPlaylist(e.currentTarget.checked)}
            />
          )}
        </Group>
        {server?.type === ServerType.NAVIDROME && isSmartPlaylist && (
          <Stack pt="1rem">
            <Text>Query Editor</Text>
            <PlaylistQueryBuilder
              ref={queryBuilderRef}
              isSaving={false}
              limit={undefined}
              query={undefined}
              sortBy={SongListSort.ALBUM}
              sortOrder="asc"
            />
          </Stack>
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
