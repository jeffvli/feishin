import { t } from 'i18next';
import { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { useUpdateRadioStation } from '/@/renderer/features/radio/mutations/update-radio-station-mutation';
import { useCurrentServer } from '/@/renderer/store';
import { logFn } from '/@/renderer/utils/logger';
import { logMsg } from '/@/renderer/utils/logger-message';
import { Group } from '/@/shared/components/group/group';
import { closeAllModals, openModal } from '/@/shared/components/modal/modal';
import { ModalButton } from '/@/shared/components/modal/model-shared';
import { Stack } from '/@/shared/components/stack/stack';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { toast } from '/@/shared/components/toast/toast';
import { useForm } from '/@/shared/hooks/use-form';
import {
    InternetRadioStation,
    ServerListItem,
    UpdateInternetRadioStationBody,
} from '/@/shared/types/domain-types';

interface EditRadioStationFormProps {
    onCancel: () => void;
    station: InternetRadioStation;
}

export const EditRadioStationForm = ({ onCancel, station }: EditRadioStationFormProps) => {
    const { t } = useTranslation();
    const mutation = useUpdateRadioStation({});
    const server = useCurrentServer();

    const form = useForm<UpdateInternetRadioStationBody>({
        initialValues: {
            homepageUrl: station.homepageUrl || '',
            name: station.name,
            streamUrl: station.streamUrl,
        },
    });

    const handleSubmit = form.onSubmit((values) => {
        if (!server) return;

        mutation.mutate(
            {
                apiClientProps: { serverId: server.id },
                body: values,
                query: { id: station.id },
            },
            {
                onError: (error) => {
                    logFn.error(logMsg.other.error, {
                        meta: { error: error as Error },
                    });

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
                        {t('common.save', { postProcess: 'sentenceCase' })}
                    </ModalButton>
                </Group>
            </Stack>
        </form>
    );
};

export const openEditRadioStationModal = (
    station: InternetRadioStation,
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
        children: <EditRadioStationForm onCancel={closeAllModals} station={station} />,
        title: t('common.edit', { postProcess: 'titleCase' }) as string,
    });
};
