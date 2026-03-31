import { closeAllModals } from '@mantine/modals';
import isElectron from 'is-electron';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import i18n from '/@/i18n/i18n';
import { api } from '/@/renderer/api';
import { ensureSsoAuth } from '/@/renderer/api/sso-interceptor';
import { queryClient } from '/@/renderer/lib/react-query';
import { getServerById, useAuthStoreActions } from '/@/renderer/store';
import { Checkbox } from '/@/shared/components/checkbox/checkbox';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { ModalButton } from '/@/shared/components/modal/model-shared';
import { PasswordInput } from '/@/shared/components/password-input/password-input';
import { Stack } from '/@/shared/components/stack/stack';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { toast } from '/@/shared/components/toast/toast';
import { Tooltip } from '/@/shared/components/tooltip/tooltip';
import { SSO_COOKIE_KEYS } from '/@/shared/constants/sso-cookie-keys';
import { useFocusTrap } from '/@/shared/hooks/use-focus-trap';
import { useForm } from '/@/shared/hooks/use-form';
import {
    AuthenticationResponse,
    ServerListItem,
    ServerListItemWithCredential,
    ServerType,
} from '/@/shared/types/domain-types';

const localSettings = isElectron() ? window.api.localSettings : null;

interface EditServerFormProps {
    isUpdate?: boolean;
    onCancel: () => void;
    password: null | string;
    server: ServerListItem;
}

const ModifiedFieldIndicator = () => {
    return (
        <Tooltip label={i18n.t('common.modified', { postProcess: 'titleCase' }) as string}>
            <Icon color="warn" icon="info" />
        </Tooltip>
    );
};

export const EditServerForm = ({ isUpdate, onCancel, password, server }: EditServerFormProps) => {
    const { t } = useTranslation();
    const { updateServer } = useAuthStoreActions();
    const focusTrapRef = useFocusTrap();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm({
        initialValues: {
            isAdmin: server?.isAdmin,
            isSsoProxy: server?.isSsoProxy || false,
            legacyAuth: false,
            name: server?.name,
            password: password || '',
            preferInstantMix: server.preferInstantMix,
            preferRemoteUrl: server?.preferRemoteUrl || false,
            remoteUrl: server?.remoteUrl || '',
            savePassword: server.savePassword,
            ssoCookieName: server?.ssoCookieName || '',
            type: server?.type,
            url: server?.url,
            username: server?.username,
        },
    });

    const isSubsonic = form.values.type === ServerType.SUBSONIC;
    const isNavidrome = form.values.type === ServerType.NAVIDROME;

    const handleSubmit = form.onSubmit(async (values) => {
        try {
            setIsLoading(true);

            // Check if we can skip authentication
            const usernameChanged = values.username !== server.username;
            const passwordProvided = values.password && values.password.trim() !== '';
            const urlChanged = values.url !== server.url;
            const typeChanged = values.type !== server.type;
            const isSsoProxyChanged = values.isSsoProxy !== server.isSsoProxy;
            const ssoCookieNameChanged = values.ssoCookieName !== server.ssoCookieName;

            // Skip authentication if username hasn't changed, password is empty, and URL/type haven't changed
            const canSkipAuth =
                !usernameChanged &&
                !passwordProvided &&
                !urlChanged &&
                !typeChanged &&
                !isSsoProxyChanged &&
                !ssoCookieNameChanged;

            let data: AuthenticationResponse | undefined;
            let serverItem: ServerListItemWithCredential;

            if (canSkipAuth) {
                // Use existing server credentials
                const existingServer = getServerById(server.id);
                if (!existingServer) {
                    return toast.error({
                        message: t('error.invalidServer', { postProcess: 'sentenceCase' }),
                    });
                }

                serverItem = {
                    ...existingServer,
                    id: server.id,
                    isSsoProxy: values.isSsoProxy,
                    name: values.name,
                    ssoCookieName: values.ssoCookieName,
                    type: values.type,
                    url: values.url,
                };
            } else {
                // Need to authenticate
                const authFunction = api.controller.authenticate;

                if (!authFunction) {
                    return toast.error({
                        message: t('error.invalidServer', { postProcess: 'sentenceCase' }),
                    });
                }

                let ssoCookies: Record<string, string> | undefined = server.ssoCookies;
                if (
                    values.isSsoProxy &&
                    (isSsoProxyChanged || urlChanged || ssoCookieNameChanged)
                ) {
                    if (isElectron()) {
                        const loginResult = await window.api.sso.login(
                            values.url,
                            values.ssoCookieName || SSO_COOKIE_KEYS.CLOUDFLARE_ACCESS,
                        );
                        if (!loginResult.success) {
                            setIsLoading(false);
                            return toast.error({
                                message: t('error.authenticationFailed', {
                                    postProcess: 'sentenceCase',
                                }),
                            });
                        }
                        ssoCookies = loginResult.cookies;
                    } else {
                        const dummyServer = {
                            id: server.id,
                            isSsoProxy: true,
                            ssoCookieName: values.ssoCookieName,
                            url: values.url,
                        } as any;
                        const authenticated = await ensureSsoAuth(dummyServer);
                        if (!authenticated) {
                            setIsLoading(false);
                            return;
                        }
                    }
                }

                data = await authFunction(
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

                serverItem = {
                    credential: data.credential,
                    id: server.id,
                    isAdmin: data.isAdmin,
                    isSsoProxy: values.isSsoProxy,
                    name: values.name,
                    ssoCookieName: values.ssoCookieName,
                    ssoCookies,
                    type: values.type,
                    url: values.url,
                    userId: data.userId,
                    username: data.username,
                };

                if (data.ndCredential !== undefined) {
                    serverItem.ndCredential = data.ndCredential;
                }
            }

            // Update optional fields
            if (values.preferInstantMix !== undefined) {
                serverItem.preferInstantMix = values.preferInstantMix;
            }

            if (values.savePassword !== undefined) {
                serverItem.savePassword = values.savePassword;
            }

            if (values.remoteUrl?.trim()) {
                serverItem.remoteUrl = values.remoteUrl.trim().replace(/\/$/, '');
            } else {
                serverItem.remoteUrl = undefined;
            }

            if (values.preferRemoteUrl !== undefined) {
                serverItem.preferRemoteUrl = values.preferRemoteUrl;
            }

            updateServer(server.id, serverItem);
            toast.success({
                message: t('form.updateServer.title', { postProcess: 'sentenceCase' }),
            });

            // Handle password saving in local settings
            if (localSettings) {
                if (canSkipAuth) {
                    // If we skipped auth, only update savePassword preference
                    // Don't change the actual saved password
                    if (!values.savePassword) {
                        localSettings.passwordRemove(server.id);
                    }
                } else {
                    // If we authenticated, update password if savePassword is enabled
                    if (values.savePassword && passwordProvided) {
                        const saved = await localSettings.passwordSet(values.password, server.id);
                        if (!saved) {
                            toast.error({
                                message: t('form.addServer.error', {
                                    context: 'savePassword',
                                    postProcess: 'sentenceCase',
                                }),
                            });
                        }
                    } else if (!values.savePassword) {
                        localSettings.passwordRemove(server.id);
                    }
                }
            }

            queryClient.removeQueries();
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
                    label={t('form.addServer.input', {
                        context: 'name',
                        postProcess: 'titleCase',
                    })}
                    required
                    rightSection={form.isDirty('name') && <ModifiedFieldIndicator />}
                    {...form.getInputProps('name')}
                />
                <TextInput
                    label={t('form.addServer.input', {
                        context: 'url',
                        postProcess: 'titleCase',
                    })}
                    required
                    rightSection={form.isDirty('url') && <ModifiedFieldIndicator />}
                    {...form.getInputProps('url')}
                />
                <Stack gap="xs">
                    <Group gap="xs">
                        <Checkbox
                            description={
                                !isElectron()
                                    ? t('form.addServer.input', {
                                          context: 'isSsoProxyDescription',
                                      })
                                    : undefined
                            }
                            label={t('form.addServer.input', {
                                context: 'isSsoProxy',
                            })}
                            {...form.getInputProps('isSsoProxy', {
                                type: 'checkbox',
                            })}
                        />
                        {form.isDirty('isSsoProxy') && <ModifiedFieldIndicator />}
                    </Group>
                    {form.values.isSsoProxy && (
                        <TextInput
                            label={t('form.addServer.input', {
                                context: 'ssoCookieName',
                            })}
                            placeholder={SSO_COOKIE_KEYS.CLOUDFLARE_ACCESS}
                            rightSection={
                                form.isDirty('ssoCookieName') && <ModifiedFieldIndicator />
                            }
                            {...form.getInputProps('ssoCookieName')}
                        />
                    )}
                </Stack>
                <TextInput
                    label={t('form.addServer.input', {
                        context: 'remoteUrl',
                        postProcess: 'titleCase',
                    })}
                    placeholder={t('form.addServer.input', {
                        context: 'remoteUrlPlaceholder',
                        postProcess: 'sentenceCase',
                    })}
                    rightSection={form.isDirty('remoteUrl') && <ModifiedFieldIndicator />}
                    {...form.getInputProps('remoteUrl')}
                />
                {form.values.remoteUrl && (
                    <Group gap="xs">
                        <Checkbox
                            label={t('form.addServer.input', {
                                context: 'preferRemoteUrl',
                                postProcess: 'titleCase',
                            })}
                            {...form.getInputProps('preferRemoteUrl', {
                                type: 'checkbox',
                            })}
                        />
                        {form.isDirty('preferRemoteUrl') && <ModifiedFieldIndicator />}
                    </Group>
                )}
                <TextInput
                    label={t('form.addServer.input', {
                        context: 'username',
                        postProcess: 'titleCase',
                    })}
                    required
                    rightSection={form.isDirty('username') && <ModifiedFieldIndicator />}
                    {...form.getInputProps('username')}
                />
                <PasswordInput
                    data-autofocus
                    label={t('form.addServer.input', {
                        context: 'password',
                        postProcess: 'titleCase',
                    })}
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
                {form.values.type === ServerType.JELLYFIN && (
                    <Checkbox
                        description={t('form.addServer.input', {
                            context: 'preferInstantMixDescription',
                            postProcess: 'sentenceCase',
                        })}
                        label={t('form.addServer.input', {
                            context: 'preferInstantMix',
                            postProcess: 'titleCase',
                        })}
                        {...form.getInputProps('preferInstantMix', {
                            type: 'checkbox',
                        })}
                    />
                )}
                <Group justify="flex-end">
                    <ModalButton onClick={onCancel}>{t('common.cancel')}</ModalButton>
                    <ModalButton loading={isLoading} type="submit" variant="filled">
                        {t('common.save')}
                    </ModalButton>
                </Group>
            </Stack>
        </form>
    );
};
