import { closeModal, ContextModalProps, openContextModal } from '@mantine/modals';
import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { useTranslation } from 'react-i18next';

import i18n from '/@/i18n/i18n';
import { useUpdatePlaylist } from '/@/renderer/features/playlists/mutations/update-playlist-mutation';
import { sharedQueries } from '/@/renderer/features/shared/api/shared-api';
import { useCurrentServer, useCurrentServerId, usePermissions } from '/@/renderer/store';
import { hasFeature } from '/@/shared/api/utils';
import { Group } from '/@/shared/components/group/group';
import { ModalButton } from '/@/shared/components/modal/model-shared';
import { Select } from '/@/shared/components/select/select';
import { Stack } from '/@/shared/components/stack/stack';
import { Switch } from '/@/shared/components/switch/switch';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { toast } from '/@/shared/components/toast/toast';
import { useForm } from '/@/shared/hooks/use-form';
import {
    Playlist,
    ServerType,
    SortOrder,
    UpdatePlaylistBody,
    UpdatePlaylistQuery,
    UserListSort,
} from '/@/shared/types/domain-types';
import { ServerFeature } from '/@/shared/types/features-types';

export const UpdatePlaylistContextModal = ({
    id,
    innerProps,
}: ContextModalProps<{
    body: Partial<UpdatePlaylistBody>;
    query: UpdatePlaylistQuery;
}>) => {
    const { t } = useTranslation();
    const mutation = useUpdatePlaylist({});
    const server = useCurrentServer();
    const { body, query } = innerProps;

    const form = useForm<UpdatePlaylistBody>({
        initialValues: {
            comment: body?.comment || '',
            name: body?.name || '',
            ownerId: body.ownerId,
            public: body.public,
            queryBuilderRules: body.queryBuilderRules,
            sync: body.sync,
        },
    });

    const handleSubmit = form.onSubmit((values) => {
        mutation.mutate(
            {
                apiClientProps: { serverId: server?.id || '' },
                body: values,
                query,
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
                    closeModal(id);
                },
            },
        );
    });

    const isPublicDisplayed = hasFeature(server, ServerFeature.PUBLIC_PLAYLIST);
    const isOwnerDisplayed = server?.type === ServerType.NAVIDROME;
    const isCommentDisplayed = server?.type === ServerType.NAVIDROME;
    const isSubmitDisabled = !form.values.name || mutation.isPending;

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
                {isCommentDisplayed && (
                    <TextInput
                        label={t('form.createPlaylist.input', {
                            context: 'description',
                            postProcess: 'titleCase',
                        })}
                        {...form.getInputProps('comment')}
                    />
                )}
                {isOwnerDisplayed && <OwnerSelect form={form} />}
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
                    <ModalButton onClick={() => closeModal(id)}>{t('common.cancel')}</ModalButton>
                    <ModalButton
                        disabled={isSubmitDisabled}
                        loading={mutation.isPending}
                        type="submit"
                        variant="filled"
                    >
                        {t('common.save')}
                    </ModalButton>
                </Group>
            </Stack>
        </form>
    );
};

const OwnerSelect = ({ form }: { form: ReturnType<typeof useForm<UpdatePlaylistBody>> }) => {
    const serverId = useCurrentServerId();
    const permissions = usePermissions();

    const usersQuery = useQuery(
        sharedQueries.users({
            options: { enabled: permissions.playlists.editOwner },
            query: { sortBy: UserListSort.NAME, sortOrder: SortOrder.ASC, startIndex: 0 },
            serverId,
        }),
    );

    const userList = usersQuery.data?.items?.map((user) => ({
        label: user.name,
        value: user.id,
    }));

    if (!permissions.playlists.editOwner) {
        return null;
    }

    return (
        <Select
            data={usersQuery.isLoading ? [] : userList}
            disabled={usersQuery.isLoading}
            {...form.getInputProps('ownerId')}
            label={t('form.createPlaylist.input', {
                context: 'owner',
                postProcess: 'titleCase',
            })}
        />
    );
};

export const openUpdatePlaylistModal = async (args: { playlist: Playlist }) => {
    const { playlist } = args;

    openContextModal({
        innerProps: {
            body: {
                comment: playlist?.description || undefined,
                genres: playlist?.genres,
                name: playlist?.name,
                ownerId: playlist?.ownerId || undefined,
                public: playlist?.public || false,
                queryBuilderRules: playlist?.rules || undefined,
                sync: playlist?.sync || undefined,
            },
            query: { id: playlist?.id },
        },
        modalKey: 'updatePlaylist',
        title: i18n.t('form.editPlaylist.title', { postProcess: 'titleCase' }) as string,
    });
};
