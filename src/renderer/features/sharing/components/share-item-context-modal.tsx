import { useForm } from '@mantine/form';
import { closeModal, ContextModalProps } from '@mantine/modals';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

import { useShareItem } from '/@/renderer/features/sharing/mutations/share-item-mutation';
import { useCurrentServer } from '/@/renderer/store';
import { DateTimePicker } from '/@/shared/components/date-time-picker/date-time-picker';
import { Group } from '/@/shared/components/group/group';
import { ModalButton } from '/@/shared/components/modal/model-shared';
import { Stack } from '/@/shared/components/stack/stack';
import { Switch } from '/@/shared/components/switch/switch';
import { Textarea } from '/@/shared/components/textarea/textarea';
import { toast } from '/@/shared/components/toast/toast';

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

    // Uses the same default as Navidrome: 1 year
    const defaultDate = dayjs().add(1, 'year').format('YYYY-MM-DD HH:mm:ss');

    const form = useForm({
        initialValues: {
            allowDownloading: false,
            description: '',
            expires: defaultDate,
        },
        validate: {
            expires: (value) =>
                dayjs(value).isAfter(dayjs())
                    ? null
                    : t('form.shareItem.expireInvalid', {
                          postProcess: 'sentenceCase',
                      }),
        },
    });

    const handleSubmit = form.onSubmit(async (values) => {
        shareItemMutation.mutate(
            {
                body: {
                    description: values.description,
                    downloadable: values.allowDownloading,
                    expires: dayjs(values.expires).valueOf(),
                    resourceIds: itemIds.join(),
                    resourceType,
                },
                serverId: server?.id,
            },
            {
                onError: () => {
                    toast.error({
                        message: t('form.shareItem.createFailed', {
                            postProcess: 'sentenceCase',
                        }),
                    });
                },
                onSuccess: (_data) => {
                    if (!server) throw new Error('Server not found');
                    if (!_data?.id) throw new Error('Failed to share item');

                    const shareUrl = `${server.url}/share/${_data.id}`;

                    navigator.clipboard.writeText(shareUrl);
                    toast.success({
                        autoClose: 5000,
                        id: 'share-item-toast',
                        message: t('form.shareItem.success', {
                            postProcess: 'sentenceCase',
                        }),
                        onClick: (a) => {
                            if (!(a.target instanceof HTMLElement)) return;

                            // Make sure we weren't clicking close (otherwise clicking close /also/ opens the url)
                            if (a.target.nodeName !== 'svg') {
                                window.open(shareUrl);
                                toast.hide('share-item-toast');
                            }
                        },
                    });
                },
            },
        );

        closeModal(id);
        return null;
    });

    return (
        <form onSubmit={handleSubmit}>
            <Stack>
                <DateTimePicker
                    clearable
                    label={t('form.shareItem.setExpiration', {
                        postProcess: 'titleCase',
                    })}
                    minDate={new Date()}
                    placeholder={defaultDate}
                    popoverProps={{ withinPortal: true }}
                    valueFormat="MM/DD/YYYY HH:mm"
                    {...form.getInputProps('expires')}
                />
                <Textarea
                    autosize
                    label={t('form.shareItem.description', {
                        postProcess: 'titleCase',
                    })}
                    minRows={5}
                    {...form.getInputProps('description')}
                />
                <Switch
                    defaultChecked={false}
                    label={t('form.shareItem.allowDownloading', {
                        postProcess: 'titleCase',
                    })}
                    {...form.getInputProps('allowDownloading')}
                />

                <Group justify="flex-end">
                    <ModalButton onClick={() => closeModal(id)}>{t('common.cancel')}</ModalButton>
                    <ModalButton type="submit" variant="filled">
                        {t('common.share')}
                    </ModalButton>
                </Group>
            </Stack>
        </form>
    );
};
