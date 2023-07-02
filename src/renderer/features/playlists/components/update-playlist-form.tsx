import { Group, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { openModal, closeAllModals } from '@mantine/modals';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import {
    PlaylistDetailResponse,
    ServerListItem,
    ServerType,
    SortOrder,
    UpdatePlaylistBody,
    UpdatePlaylistQuery,
    User,
    UserListQuery,
    UserListSort,
} from '/@/renderer/api/types';
import { Button, Select, Switch, TextInput, toast } from '/@/renderer/components';
import { useUpdatePlaylist } from '/@/renderer/features/playlists/mutations/update-playlist-mutation';
import { queryClient } from '/@/renderer/lib/react-query';
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
                    {...form.getInputProps('_custom.navidrome.ownerId')}
                    label="Owner"
                />
                {isPublicDisplayed && (
                    <Switch
                        label="Is Public?"
                        {...form.getInputProps('_custom.navidrome.public', { type: 'checkbox' })}
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

export const openUpdatePlaylistModal = async (args: {
    playlist: PlaylistDetailResponse;
    server: ServerListItem;
}) => {
    const { playlist, server } = args;

    const query: UserListQuery = {
        sortBy: UserListSort.NAME,
        sortOrder: SortOrder.ASC,
        startIndex: 0,
    };

    if (!server) return;

    const users = await queryClient.fetchQuery({
        queryFn: ({ signal }) =>
            api.controller.getUserList({ apiClientProps: { server, signal }, query }),
        queryKey: queryKeys.users.list(server?.id || '', query),
    });

    openModal({
        children: (
            <UpdatePlaylistForm
                body={{
                    _custom: {
                        navidrome: {
                            owner: playlist?.owner || undefined,
                            ownerId: playlist?.ownerId || undefined,
                            public: playlist?.public || false,
                            rules: playlist?.rules || undefined,
                            sync: playlist?.sync || undefined,
                        },
                    },
                    comment: playlist?.description || undefined,
                    genres: playlist?.genres,
                    name: playlist?.name,
                }}
                query={{ id: playlist?.id }}
                users={users?.items}
                onCancel={closeAllModals}
            />
        ),
        title: 'Edit playlist',
    });
};
