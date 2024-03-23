import { Box, Group, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { closeModal, ContextModalProps } from '@mantine/modals';
import { Button, Switch, toast } from '/@/renderer/components';
import { useCurrentServer } from '/@/renderer/store';
import { useTranslation } from 'react-i18next';
import { useShareItem } from '../mutations/share-item-mutation';

export const ShareItemContextModal = ({
    id,
    innerProps,
}: ContextModalProps<{
    itemIds: string[];
    resourceType: string;
}>) => {
    const { t } = useTranslation();
    const { itemIds, resourceType } = innerProps;
    const server = useCurrentServer();

    const shareItemMutation = useShareItem({});

    const form = useForm({
        initialValues: {
            allowDownloading: false,
            description: '',
        },
    });

    const handleSubmit = form.onSubmit(async (values) => {
        shareItemMutation.mutate({
            body: {
                description: values.description,
                downloadable: values.allowDownloading,
                resourceIds: itemIds.join(),
                resourceType,
            },
            serverId: server?.id,
        });

        toast.success({
            message: t('form.shareItem.success', {
                postProcess: 'sentenceCase',
            }),
        });
        closeModal(id);
        return null;
    });

    return (
        <Box p="1rem">
            <form onSubmit={handleSubmit}>
                <Stack>
                    <TextInput
                        label={t('form.shareItem.description', {
                            postProcess: 'titleCase',
                        })}
                        {...form.getInputProps('description')}
                    />
                    <Switch
                        defaultChecked={false}
                        label={t('form.shareItem.allowDownloading', {
                            postProcess: 'titleCase',
                        })}
                        {...form.getInputProps('allowDownloading')}
                    />
                    <Group position="right">
                        <Group>
                            <Button
                                size="md"
                                variant="subtle"
                                onClick={() => closeModal(id)}
                            >
                                {t('common.cancel', { postProcess: 'titleCase' })}
                            </Button>
                            <Button
                                size="md"
                                type="submit"
                                variant="filled"
                            >
                                {t('common.share', { postProcess: 'titleCase' })}
                            </Button>
                        </Group>
                    </Group>
                </Stack>
            </form>
        </Box>
    );
};
