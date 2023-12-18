import { useState } from 'react';
import { Stack, Group, Checkbox } from '@mantine/core';
import { Button, PasswordInput, SegmentedControl, TextInput, toast } from '/@/renderer/components';
import { useForm } from '@mantine/form';
import { useFocusTrap } from '@mantine/hooks';
import { closeAllModals } from '@mantine/modals';
import isElectron from 'is-electron';
import { nanoid } from 'nanoid/non-secure';
import { AuthenticationResponse } from '/@/renderer/api/types';
import { useAuthStoreActions } from '/@/renderer/store';
import { ServerType } from '/@/renderer/types';
import { api } from '/@/renderer/api';
import { useTranslation } from 'react-i18next';

const localSettings = isElectron() ? window.electron.localSettings : null;

const SERVER_TYPES = [
    { label: 'Jellyfin', value: ServerType.JELLYFIN },
    { label: 'Navidrome', value: ServerType.NAVIDROME },
    // { label: 'Subsonic', value: ServerType.SUBSONIC },
];

interface AddServerFormProps {
    onCancel: () => void;
}

export const AddServerForm = ({ onCancel }: AddServerFormProps) => {
    const { t } = useTranslation();
    const focusTrapRef = useFocusTrap(true);
    const [isLoading, setIsLoading] = useState(false);
    const { addServer, setCurrentServer } = useAuthStoreActions();

    const form = useForm({
        initialValues: {
            legacyAuth: false,
            name: !isElectron() ? window.SERVER_NAME : process?.env.SERVER_NAME?? '' ,
            password: '',
            savePassword: false,
            type: !isElectron() ? window.SERVER_TYPE?.toLowerCase() : process?.env.SERVER_TYPE?.toLowerCase() ?? ServerType.JELLYFIN,
            url: !isElectron() ? window.SERVER_URL : process?.env.SERVER_URL ?? 'https://',
            username: '',
        },
    });

    const isSubmitDisabled = !form.values.name || !form.values.url || !form.values.username;

    const handleSubmit = form.onSubmit(async (values) => {
        const authFunction = api.controller.authenticate;

        if (!authFunction) {
            return toast.error({
                message: t('error.invalidServer', { postProcess: 'sentenceCase' }),
            });
        }

        try {
            setIsLoading(true);
            const data: AuthenticationResponse | undefined = await authFunction(
                values.url,
                {
                    legacy: values.legacyAuth,
                    password: values.password,
                    username: values.username,
                },
                values.type as ServerType,
            );

            if (!data) {
                return toast.error({
                    message: t('error.authenticationFailed', { postProcess: 'sentenceCase' }),
                });
            }

            const serverItem = {
                credential: data.credential,
                id: nanoid(),
                name: values.name,
                ndCredential: data.ndCredential,
                type: values.type as ServerType,
                url: values.url.replace(/\/$/, ''),
                userId: data.userId,
                username: data.username,
            };

            addServer(serverItem);
            setCurrentServer(serverItem);
            closeAllModals();

            toast.success({
                message: t('form.addServer.success', { postProcess: 'sentenceCase' }),
            });

            if (localSettings && values.savePassword) {
                const saved = await localSettings.passwordSet(values.password, serverItem.id);
                if (!saved) {
                    toast.error({
                        message: t('form.addServer.error', {
                            context: 'savePassword',
                            postProcess: 'sentenceCase',
                        }),
                    });
                }
            }
        } catch (err: any) {
            setIsLoading(false);
            return toast.error({ message: err?.message });
        }

        return setIsLoading(false);
    });

    return (
        <form onSubmit={handleSubmit}>
            <Stack
                ref={focusTrapRef}
                m={5}
            >
                <SegmentedControl
                    data={SERVER_TYPES}
                    disabled = {!isElectron() ? !!window.SERVER_LOCK : !!process?.env.SERVER_LOCK ?? false}
                    {...form.getInputProps('type')}
                />
                <Group grow>
                    <TextInput
                        data-autofocus
                        label={t('form.addServer.input', {
                            context: 'name',
                            postProcess: 'titleCase',
                        })}
                        disabled = {!isElectron() ? !!window.SERVER_LOCK : !!process?.env.SERVER_LOCK ?? false}
                        {...form.getInputProps('name')}
                    />
                    <TextInput
                        label={t('form.addServer.input', {
                            context: 'url',
                            postProcess: 'titleCase',
                        })}
                        disabled = {!isElectron() ? !!window.SERVER_LOCK : !!process?.env.SERVER_LOCK ?? false}
                        {...form.getInputProps('url')}
                    />
                </Group>
                <TextInput
                    label={t('form.addServer.input', {
                        context: 'username',
                        postProcess: 'titleCase',
                    })}
                    {...form.getInputProps('username')}
                />
                <PasswordInput
                    label={t('form.addServer.input', {
                        context: 'password',
                        postProcess: 'titleCase',
                    })}
                    {...form.getInputProps('password')}
                />
                {localSettings && form.values.type === ServerType.NAVIDROME && (
                    <Checkbox
                        label={t('form.addServer.input', {
                            context: 'savePassword',
                            postProcess: 'titleCase',
                        })}
                        {...form.getInputProps('savePassword', {
                            type: 'checkbox',
                        })}
                    />
                )}
                {form.values.type === ServerType.SUBSONIC && (
                    <Checkbox
                        label={t('form.addServer.input', {
                            context: 'legacyAuthentication',
                            postProcess: 'titleCase',
                        })}
                        {...form.getInputProps('legacyAuth', { type: 'checkbox' })}
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
                        loading={isLoading}
                        type="submit"
                        variant="filled"
                    >
                        {t('common.add', { postProcess: 'titleCase' })}
                    </Button>
                </Group>
            </Stack>
        </form>
    );
};
