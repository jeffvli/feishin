import { closeModal, ContextModalProps } from '@mantine/modals';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

import { useShareItem } from '/@/renderer/features/sharing/mutations/share-item-mutation';
import { useCurrentServer } from '/@/renderer/store';
import { getServerUrl } from '/@/renderer/utils/normalize-server-url';
import { DateTimePicker } from '/@/shared/components/date-time-picker/date-time-picker';
import { Group } from '/@/shared/components/group/group';
import { ModalButton } from '/@/shared/components/modal/model-shared';
import { Stack } from '/@/shared/components/stack/stack';
import { Switch } from '/@/shared/components/switch/switch';
import { Textarea } from '/@/shared/components/textarea/textarea';
import { toast } from '/@/shared/components/toast/toast';
import { useForm } from '/@/shared/hooks/use-form';

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
                apiClientProps: { serverId: server?.id || '' },
                body: {
                    description: values.description,
                    downloadable: values.allowDownloading,
                    expires: dayjs(values.expires).valueOf(),
                    resourceIds: itemIds.join(),
                    resourceType,
                },
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

                    const serverUrl = getServerUrl(server, true);
                    if (!serverUrl) throw new Error('Server URL not found');
                    const shareUrl = `${serverUrl}/share/${_data.id}`;

                    const canUseClipboard = navigator.clipboard && window.isSecureContext;
                    if (canUseClipboard) {
                        navigator.clipboard.writeText(shareUrl);
                    }

                    toast.success({
                        autoClose: canUseClipboard ? 5000 : 15000,
                        id: 'share-item-toast',
                        message: t(
                            canUseClipboard
                                ? 'form.shareItem.success'
                                : 'form.shareItem.successMustClick',
                            {
                                postProcess: 'sentenceCase',
                            },
                        ),
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
