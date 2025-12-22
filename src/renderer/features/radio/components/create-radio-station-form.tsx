import { t } from 'i18next';
import { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { useCreateRadioStation } from '/@/renderer/features/radio/mutations/create-radio-station-mutation';
import { useCurrentServer } from '/@/renderer/store';
import { Group } from '/@/shared/components/group/group';
import { closeAllModals, openModal } from '/@/shared/components/modal/modal';
import { ModalButton } from '/@/shared/components/modal/model-shared';
import { Stack } from '/@/shared/components/stack/stack';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { toast } from '/@/shared/components/toast/toast';
import { useForm } from '/@/shared/hooks/use-form';
import { CreateInternetRadioStationBody, ServerListItem } from '/@/shared/types/domain-types';

interface CreateRadioStationFormProps {
    onCancel: () => void;
}

export const CreateRadioStationForm = ({ onCancel }: CreateRadioStationFormProps) => {
    const { t } = useTranslation();
    const mutation = useCreateRadioStation({});
    const server = useCurrentServer();

    const form = useForm<CreateInternetRadioStationBody>({
        initialValues: {
            homepageUrl: '',
            name: '',
            streamUrl: '',
        },
    });

    const handleSubmit = form.onSubmit((values) => {
        if (!server) return;

        mutation.mutate(
            {
                apiClientProps: { serverId: server.id },
                body: values,
            },
            {
                onError: (error) => {
                    toast.error({
                        message: (error as Error).message,
                        title: t('error.genericError', {
                            postProcess: 'sentenceCase',
                        }) as string,
                    });
                },
                onSuccess: () => {
                    closeAllModals();
                },
            },
        );
    });

    return (
        <form onSubmit={handleSubmit}>
            <Stack gap="md">
                <TextInput
                    label={t('form.createRadioStation.input', {
                        context: 'name',
                        postProcess: 'titleCase',
                    })}
                    required
                    {...form.getInputProps('name')}
                />
                <TextInput
                    label={t('form.createRadioStation.input', {
                        context: 'streamUrl',
                        postProcess: 'titleCase',
                    })}
                    required
                    {...form.getInputProps('streamUrl')}
                />
                <TextInput
                    label={t('form.createRadioStation.input', {
                        context: 'homepageUrl',
                        postProcess: 'titleCase',
                    })}
                    {...form.getInputProps('homepageUrl')}
                />
                <Group justify="flex-end">
                    <ModalButton onClick={onCancel} variant="subtle">
                        {t('common.cancel', { postProcess: 'sentenceCase' })}
                    </ModalButton>
                    <ModalButton loading={mutation.isPending} type="submit" variant="filled">
                        {t('common.create', { postProcess: 'sentenceCase' })}
                    </ModalButton>
                </Group>
            </Stack>
        </form>
    );
};

export const openCreateRadioStationModal = (
    server: null | ServerListItem,
    e?: MouseEvent<HTMLButtonElement>,
) => {
    e?.stopPropagation();

    if (!server) {
        toast.error({
            message: t('common.error.noServer', { postProcess: 'sentenceCase' }) as string,
        });
        return;
    }

    openModal({
        children: <CreateRadioStationForm onCancel={closeAllModals} />,
        title: t('action.createRadioStation', { postProcess: 'titleCase' }) as string,
    });
};
