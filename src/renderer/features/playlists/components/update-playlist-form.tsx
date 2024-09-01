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
import { useTranslation } from 'react-i18next';
import i18n from '/@/i18n/i18n';
import { hasFeature } from '/@/renderer/api/utils';
import { ServerFeature } from '/@/renderer/api/features-types';

interface UpdatePlaylistFormProps {
    body: Partial<UpdatePlaylistBody>;
    onCancel: () => void;
    query: UpdatePlaylistQuery;
    users?: User[];
}

export const UpdatePlaylistForm = ({ users, query, body, onCancel }: UpdatePlaylistFormProps) => {
    const { t } = useTranslation();
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
                    rules: undefined,
                    sync: body?._custom?.navidrome?.sync || false,
                },
            },
            comment: body?.comment || '',
            name: body?.name || '',
            public: body.public,
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
                    toast.error({
                        message: err.message,
                        title: t('error.genericError', { postProcess: 'sentenceCase' }),
                    });
                },
                onSuccess: () => {
                    toast.success({
                        message: t('form.editPlaylist.success', { postProcess: 'sentenceCase' }),
                    });
                    onCancel();
                },
            },
        );
    });

    const isPublicDisplayed = hasFeature(server, ServerFeature.PUBLIC_PLAYLIST);
    const isOwnerDisplayed = server?.type === ServerType.NAVIDROME && userList;
    const isSubmitDisabled = !form.values.name || mutation.isLoading;

    return (
        <form onSubmit={handleSubmit}>
            <Stack>
                <TextInput
                    data-autofocus
                    required
                    label={t('form.createPlaylist.input', {
                        context: 'name',
                        postProcess: 'titleCase',
                    })}
                    {...form.getInputProps('name')}
                />
                {server?.type === ServerType.NAVIDROME && (
                    <TextInput
                        label={t('form.createPlaylist.input', {
                            context: 'description',
                            postProcess: 'titleCase',
                        })}
                        {...form.getInputProps('comment')}
                    />
                )}
                {isOwnerDisplayed && (
                    <Select
                        data={userList || []}
                        {...form.getInputProps('_custom.navidrome.ownerId')}
                        label={t('form.createPlaylist.input', {
                            context: 'owner',
                            postProcess: 'titleCase',
                        })}
                    />
                )}
                {isPublicDisplayed && (
                    <>
                        {server?.type === ServerType.JELLYFIN && (
                            <div>
                                {t('form.editPlaylist.publicJellyfinNote', {
                                    postProcess: 'sentenceCase',
                                })}
                            </div>
                        )}
                        <Switch
                            label={t('form.createPlaylist.input', {
                                context: 'public',
                                postProcess: 'titleCase',
                            })}
                            {...form.getInputProps('public', { type: 'checkbox' })}
                        />
                    </>
                )}
                <Group position="right">
                    <Button
                        variant="subtle"
                        onClick={onCancel}
                    >
                        {t('common.cancel', { postProcess: 'titleCase' })}
                    </Button>
                    <Button
                        disabled={isSubmitDisabled}
                        loading={mutation.isLoading}
                        type="submit"
                        variant="filled"
                    >
                        {t('common.save', { postProcess: 'titleCase' })}
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

    const users =
        server?.type === ServerType.NAVIDROME
            ? await queryClient
                  .fetchQuery({
                      queryFn: ({ signal }) =>
                          api.controller.getUserList({ apiClientProps: { server, signal }, query }),
                      queryKey: queryKeys.users.list(server?.id || '', query),
                  })
                  .catch((error) => {
                      // This eror most likely happens if the user is not an admin
                      console.error(error);
                      return null;
                  })
            : null;

    openModal({
        children: (
            <UpdatePlaylistForm
                body={{
                    _custom: {
                        navidrome: {
                            owner: playlist?.owner || undefined,
                            ownerId: playlist?.ownerId || undefined,
                            rules: playlist?.rules || undefined,
                            sync: playlist?.sync || undefined,
                        },
                    },
                    comment: playlist?.description || undefined,
                    genres: playlist?.genres,
                    name: playlist?.name,
                    public: playlist?.public || false,
                }}
                query={{ id: playlist?.id }}
                users={users?.items}
                onCancel={closeAllModals}
            />
        ),
        title: i18n.t('form.editPlaylist.title', { postProcess: 'titleCase' }) as string,
    });
};
