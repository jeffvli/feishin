import { useState } from 'react';
import { Stack, Group } from '@mantine/core';
import { Button, Checkbox, PasswordInput, TextInput, toast, Tooltip } from '/@/renderer/components';
import { useForm } from '@mantine/form';
import { useFocusTrap } from '@mantine/hooks';
import { closeAllModals } from '@mantine/modals';
import isElectron from 'is-electron';
import { useTranslation } from 'react-i18next';
import { RiInformationLine } from 'react-icons/ri';
import { AuthenticationResponse } from '/@/renderer/api/types';
import { useAuthStoreActions } from '/@/renderer/store';
import { ServerListItem, ServerType } from '/@/renderer/types';
import { api } from '/@/renderer/api';
import i18n from '/@/i18n/i18n';
import { queryClient } from '/@/renderer/lib/react-query';
import { queryKeys } from '/@/renderer/api/query-keys';

const localSettings = isElectron() ? window.electron.localSettings : null;

interface EditServerFormProps {
    isUpdate?: boolean;
    onCancel: () => void;
    password: string | null;
    server: ServerListItem;
}

const ModifiedFieldIndicator = () => {
    return (
        <Tooltip label={i18n.t('common.modified', { postProcess: 'titleCase' }) as string}>
            <span>
                <RiInformationLine color="red" />
            </span>
        </Tooltip>
    );
};

export const EditServerForm = ({ isUpdate, password, server, onCancel }: EditServerFormProps) => {
    const { t } = useTranslation();
    const { updateServer } = useAuthStoreActions();
    const focusTrapRef = useFocusTrap();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm({
        initialValues: {
            legacyAuth: false,
            name: server?.name,
            password: password || '',
            savePassword: server.savePassword || false,
            type: server?.type,
            url: server?.url,
            username: server?.username,
        },
    });

    const isSubsonic = form.values.type === ServerType.SUBSONIC;
    const isNavidrome = form.values.type === ServerType.NAVIDROME;

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
                values.type,
            );

            if (!data) {
                return toast.error({
                    message: t('error.authenticationFailed', { postProcess: 'sentenceCase' }),
                });
            }

            const serverItem = {
                credential: data.credential,
                name: values.name,
                ndCredential: data.ndCredential,
                savePassword: values.savePassword,
                type: values.type,
                url: values.url,
                userId: data.userId,
                username: data.username,
            };

            updateServer(server.id, serverItem);
            toast.success({
                message: t('form.updateServer.title', { postProcess: 'sentenceCase' }),
            });

            if (localSettings) {
                if (values.savePassword) {
                    const saved = await localSettings.passwordSet(values.password, server.id);
                    if (!saved) {
                        toast.error({
                            message: t('form.addServer.error', {
                                context: 'savePassword',
                                postProcess: 'sentenceCase',
                            }),
                        });
                    }
                } else {
                    localSettings.passwordRemove(server.id);
                }
            }

            queryClient.invalidateQueries({ queryKey: queryKeys.server.root(server.id) });
        } catch (err: any) {
            setIsLoading(false);
            return toast.error({ message: err?.message });
        }

        if (isUpdate) closeAllModals();
        return setIsLoading(false);
    });

    return (
        <form onSubmit={handleSubmit}>
            <Stack ref={focusTrapRef}>
                <TextInput
                    required
                    label={t('form.addServer.input', {
                        context: 'name',
                        postProcess: 'titleCase',
                    })}
                    rightSection={form.isDirty('name') && <ModifiedFieldIndicator />}
                    {...form.getInputProps('name')}
                />
                <TextInput
                    required
                    label={t('form.addServer.input', {
                        context: 'url',
                        postProcess: 'titleCase',
                    })}
                    rightSection={form.isDirty('url') && <ModifiedFieldIndicator />}
                    {...form.getInputProps('url')}
                />
                <TextInput
                    required
                    label={t('form.addServer.input', {
                        context: 'username',
                        postProcess: 'titleCase',
                    })}
                    rightSection={form.isDirty('username') && <ModifiedFieldIndicator />}
                    {...form.getInputProps('username')}
                />
                <PasswordInput
                    data-autofocus
                    label={t('form.addServer.input', {
                        context: 'password',
                        postProcess: 'titleCase',
                    })}
                    required={isNavidrome || isSubsonic}
                    {...form.getInputProps('password')}
                />
                {localSettings && isNavidrome && (
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
                {isSubsonic && (
                    <Checkbox
                        label={t('form.addServer.input', {
                            context: 'legacyAuthentication',
                            postProcess: 'titleCase',
                        })}
                        {...form.getInputProps('legacyAuth', {
                            type: 'checkbox',
                        })}
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
                        loading={isLoading}
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
