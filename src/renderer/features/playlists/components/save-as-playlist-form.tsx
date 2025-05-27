import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';

import { useCreatePlaylist } from '/@/renderer/features/playlists/mutations/create-playlist-mutation';
import { useCurrentServer } from '/@/renderer/store';
import { hasFeature } from '/@/shared/api/utils';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { Switch } from '/@/shared/components/switch/switch';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { toast } from '/@/shared/components/toast/toast';
import {
    CreatePlaylistBody,
    CreatePlaylistResponse,
    ServerType,
} from '/@/shared/types/domain-types';
import { ServerFeature } from '/@/shared/types/features-types';

interface SaveAsPlaylistFormProps {
    body: Partial<CreatePlaylistBody>;
    onCancel: () => void;
    onSuccess: (data: CreatePlaylistResponse) => void;
    serverId: string | undefined;
}

export const SaveAsPlaylistForm = ({
    body,
    onCancel,
    onSuccess,
    serverId,
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
                {isPublicDisplayed && (
                    <Switch
                        label={t('form.createPlaylist.input', {
                            context: 'public',
                            postProcess: 'titleCase',
                        })}
                        {...form.getInputProps('public', { type: 'checkbox' })}
                    />
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
