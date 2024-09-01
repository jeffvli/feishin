import { useRef, useState } from 'react';
import { Group, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { CreatePlaylistBody, ServerType, SongListSort } from '/@/renderer/api/types';
import { Button, Switch, Text, TextInput, toast } from '/@/renderer/components';
import {
    PlaylistQueryBuilder,
    PlaylistQueryBuilderRef,
} from '/@/renderer/features/playlists/components/playlist-query-builder';
import { useCreatePlaylist } from '/@/renderer/features/playlists/mutations/create-playlist-mutation';
import { convertQueryGroupToNDQuery } from '/@/renderer/features/playlists/utils';
import { useCurrentServer } from '/@/renderer/store';
import { useTranslation } from 'react-i18next';
import { hasFeature } from '/@/renderer/api/utils';
import { ServerFeature } from '/@/renderer/api/features-types';

interface CreatePlaylistFormProps {
    onCancel: () => void;
}

export const CreatePlaylistForm = ({ onCancel }: CreatePlaylistFormProps) => {
    const { t } = useTranslation();
    const mutation = useCreatePlaylist({});
    const server = useCurrentServer();
    const queryBuilderRef = useRef<PlaylistQueryBuilderRef>(null);

    const form = useForm<CreatePlaylistBody>({
        initialValues: {
            _custom: {
                navidrome: {
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
                                          limit: smartPlaylist.extraFilters.limit,
                                          order: smartPlaylist.extraFilters.sortOrder,
                                          sort: smartPlaylist.extraFilters.sortBy,
                                      }
                                    : undefined,
                        },
                    },
                },
                serverId: server.id,
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
                        message: t('form.createPlaylist.success', { postProcess: 'sentenceCase' }),
                    });
                    onCancel();
                },
            },
        );
    });

    const isPublicDisplayed = hasFeature(server, ServerFeature.PUBLIC_PLAYLIST);
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
                <Group>
                    {isPublicDisplayed && (
                        <Switch
                            label={t('form.createPlaylist.input', {
                                context: 'public',
                                postProcess: 'titleCase',
                            })}
                            {...form.getInputProps('public', {
                                type: 'checkbox',
                            })}
                        />
                    )}
                    {server?.type === ServerType.NAVIDROME &&
                        hasFeature(server, ServerFeature.PLAYLISTS_SMART) && (
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
                        {t('common.cancel', { postProcess: 'titleCase' })}
                    </Button>
                    <Button
                        disabled={isSubmitDisabled}
                        loading={mutation.isLoading}
                        type="submit"
                        variant="filled"
                    >
                        {t('common.create', { postProcess: 'titleCase' })}
                    </Button>
                </Group>
            </Stack>
        </form>
    );
};
