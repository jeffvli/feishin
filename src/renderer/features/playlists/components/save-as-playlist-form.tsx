import { Group, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { CreatePlaylistBody, CreatePlaylistResponse, ServerType } from '/@/renderer/api/types';
import { Button, Switch, TextInput, toast } from '/@/renderer/components';
import { useCreatePlaylist } from '/@/renderer/features/playlists/mutations/create-playlist-mutation';
import { useCurrentServer } from '/@/renderer/store';
import { useTranslation } from 'react-i18next';
import { ServerFeature } from '/@/renderer/api/features-types';
import { hasFeature } from '/@/renderer/api/utils';

interface SaveAsPlaylistFormProps {
    body: Partial<CreatePlaylistBody>;
    onCancel: () => void;
    onSuccess: (data: CreatePlaylistResponse) => void;
    serverId: string | undefined;
}

export const SaveAsPlaylistForm = ({
    body,
    serverId,
    onSuccess,
    onCancel,
}: SaveAsPlaylistFormProps) => {
    const { t } = useTranslation();
    const mutation = useCreatePlaylist({});
    const server = useCurrentServer();

    const form = useForm<CreatePlaylistBody>({
        initialValues: {
            _custom: {
                navidrome: {
                    rules: undefined,
                    ...body?._custom?.navidrome,
                },
            },
            comment: body.comment || '',
            name: body.name || '',
            public: body.public,
        },
    });

    const handleSubmit = form.onSubmit((values) => {
        mutation.mutate(
            { body: values, serverId },
            {
                onError: (err) => {
                    toast.error({
                        message: err.message,
                        title: t('error.genericError', { postProcess: 'sentenceCase' }),
                    });
                },
                onSuccess: (data) => {
                    toast.success({
                        message: t('form.createPlaylist.success', { postProcess: 'sentenceCase' }),
                    });
                    onSuccess(data);
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
                {isPublicDisplayed && (
                    <Switch
                        label={t('form.createPlaylist.input', {
                            context: 'public',
                            postProcess: 'titleCase',
                        })}
                        {...form.getInputProps('public', { type: 'checkbox' })}
                    />
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
