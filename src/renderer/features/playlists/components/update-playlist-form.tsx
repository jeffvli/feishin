import { useForm } from '@mantine/form';
import { closeAllModals, openModal } from '@mantine/modals';
import { useTranslation } from 'react-i18next';

import i18n from '/@/i18n/i18n';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { useUpdatePlaylist } from '/@/renderer/features/playlists/mutations/update-playlist-mutation';
import { queryClient } from '/@/renderer/lib/react-query';
import { useCurrentServer } from '/@/renderer/store';
import { hasFeature } from '/@/shared/api/utils';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { Select } from '/@/shared/components/select/select';
import { Stack } from '/@/shared/components/stack/stack';
import { Switch } from '/@/shared/components/switch/switch';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { toast } from '/@/shared/components/toast/toast';
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
} from '/@/shared/types/domain-types';
import { ServerFeature } from '/@/shared/types/features-types';

interface UpdatePlaylistFormProps {
    body: Partial<UpdatePlaylistBody>;
    onCancel: () => void;
    query: UpdatePlaylistQuery;
    users?: User[];
}

export const UpdatePlaylistForm = ({ body, onCancel, query, users }: UpdatePlaylistFormProps) => {
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
                    label={t('form.createPlaylist.input', {
                        context: 'name',
                        postProcess: 'titleCase',
                    })}
                    required
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
                <Group justify="flex-end">
                    <Button
                        onClick={onCancel}
                        variant="subtle"
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
                onCancel={closeAllModals}
                query={{ id: playlist?.id }}
                users={users?.items}
            />
        ),
        title: i18n.t('form.editPlaylist.title', { postProcess: 'titleCase' }) as string,
    });
};
