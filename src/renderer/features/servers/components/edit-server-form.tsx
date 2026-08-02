import { closeAllModals } from '@mantine/modals';
import isElectron from 'is-electron';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import i18n from '/@/i18n/i18n';
import { api } from '/@/renderer/api';
import { CancelSSOLoginButton } from '/@/renderer/features/sso/components/cancel-sso-button';
import { queryClient } from '/@/renderer/lib/react-query';
import { getServerById, useAuthStoreActions } from '/@/renderer/store';
import { Accordion } from '/@/shared/components/accordion/accordion';
import { Checkbox } from '/@/shared/components/checkbox/checkbox';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { ModalButton } from '/@/shared/components/modal/model-shared';
import { PasswordInput } from '/@/shared/components/password-input/password-input';
import { SegmentedControl } from '/@/shared/components/segmented-control/segmented-control';
import { Stack } from '/@/shared/components/stack/stack';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';
import { Tooltip } from '/@/shared/components/tooltip/tooltip';
import { useFocusTrap } from '/@/shared/hooks/use-focus-trap';
import { useForm } from '/@/shared/hooks/use-form';
import {
    AuthenticationResponse,
    ServerListItem,
    ServerListItemWithCredential,
    ServerType,
} from '/@/shared/types/domain-types';
import { AuthType } from '/@/shared/types/types';

const localSettings = isElectron() ? window.api.localSettings : null;

const ALL_AUTH_TYPES = (t) => {
    return Object.values(AuthType).map((authType) => {
        return {
            label: t('form.addServer.input', { context: authType }),
            value: authType,
        };
    });
};
interface EditServerFormProps {
    isUpdate?: boolean;
    onCancel: () => void;
    password: null | string;
    server: ServerListItem;
}

const ModifiedFieldIndicator = () => {
    return (
        <Tooltip label={i18n.t('common.modified') as string}>
            <Icon color="warn" icon="info" />
        </Tooltip>
    );
};

export const EditServerForm = ({ isUpdate, onCancel, password, server }: EditServerFormProps) => {
    const { t } = useTranslation();
    const { setCurrentServer, updateServer } = useAuthStoreActions();
    const focusTrapRef = useFocusTrap();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm({
        initialValues: {
            authType: server?.authType || AuthType.BASIC,
            clientId: server?.clientId,
            isAdmin: server?.isAdmin,
            issuerUrl: server?.issuerUrl,
            legacyAuth: false,
            name: server?.name,
            password: password || '',
            preferInstantMix: server.preferInstantMix,
            preferRemoteUrl: server?.preferRemoteUrl || false,
            remoteUrl: server?.remoteUrl || '',
            savePassword: server.savePassword,
            type: server?.type,
            url: server?.url,
            username: server?.username,
        },
    });

    const isSubsonic = form.values.type === ServerType.SUBSONIC;
    const isNavidrome = form.values.type === ServerType.NAVIDROME;
    const isBasicAuth = (form.values.authType === AuthType.BASIC && isNavidrome) || !isNavidrome;
    const isOAuth =
        form.values.type === ServerType.NAVIDROME && form.values.authType === AuthType.OAUTH;

    const handleSubmit = form.onSubmit(async (values) => {
        try {
            setIsLoading(true);

            // Check if we can skip authentication
            const usernameChanged = values.username !== server.username;
            const passwordProvided = values.password && values.password.trim() !== '';
            const urlChanged = values.url !== server.url;
            const typeChanged = values.type !== server.type;
            const clientIDChanged =
                values.clientId !== server.clientId &&
                values.clientId?.trim() !== '' &&
                server.clientId;
            const issuerUrlChanged = values.issuerUrl !== server.issuerUrl;

            // Skip authentication if username hasn't changed, password is empty, and URL/type haven't changed
            const canSkipBasicAuth =
                isBasicAuth && !usernameChanged && !passwordProvided && !urlChanged && !typeChanged;

            const canSkipOAuth = isOAuth && !clientIDChanged && !issuerUrlChanged && !urlChanged;
            const canSkipAuth =
                server.authType === AuthType.BASIC ? canSkipBasicAuth : canSkipOAuth;

            let data: AuthenticationResponse | undefined;
            let serverItem: ServerListItemWithCredential;

            if (canSkipAuth) {
                // Use existing server credentials
                const existingServer = getServerById(server.id);
                if (!existingServer) {
                    return toast.error({
                        message: t('error.invalidServer'),
                    });
                }

                serverItem = {
                    ...existingServer,
                    authType:
                        values.type === ServerType.NAVIDROME ? values.authType : AuthType.BASIC,
                    clientId: values.clientId,
                    id: server.id,
                    issuerUrl: values.issuerUrl,
                    name: values.name,
                    type: values.type,
                    url: values.url,
                };
            } else {
                // Need to authenticate

                let authFunction = isOAuth
                    ? api.controller.authenticateOAuth
                    : api.controller.authenticate;

                if (!authFunction) {
                    return toast.error({
                        message: t('error.invalidServer'),
                    });
                }

                if (isOAuth) {
                    if (!values.clientId) {
                        return toast.error({
                            message: t('error.invalidServer'),
                        });
                    }
                    authFunction = api.controller.authenticateOAuth;
                    data = await authFunction?.(
                        values.url,
                        values.clientId,
                        values.type as ServerType,
                        values.issuerUrl,
                    );
                } else {
                    authFunction = api.controller.authenticate;
                    data = await authFunction(
                        values.url,
                        {
                            legacy: values.legacyAuth,
                            password: values.password,
                            username: values.username,
                        },
                        values.type as ServerType,
                    );
                }

                if (!data) {
                    return toast.error({
                        message: t('error.authenticationFailed'),
                    });
                }

                serverItem = {
                    authType: values.authType,
                    clientId: values.clientId,
                    credential: data.credential,
                    id: server.id,
                    isAdmin: data.isAdmin,
                    name: values.name,
                    type: values.type,
                    url: values.url,
                    userId: data.userId,
                    username: data.username,
                };

                if (data.ndCredential !== undefined) {
                    serverItem.ndCredential = data.ndCredential;
                }

                if (isOAuth && data.issuerUrl) {
                    serverItem.issuerUrl = data.issuerUrl;
                }

                if (isOAuth && data.accessToken) {
                    // Test API Access Token and store it in the server item if valid
                    const testResponse = await api.controller.testOAuthAccessToken({
                        apiClientProps: { server: serverItem, serverId: serverItem.id },
                    });
                    if (!testResponse) {
                        return toast.error({
                            message: t('error.ssoError'),
                        });
                    }
                    serverItem.accessToken = data.accessToken;
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

            // After re-authenticating, switch to the updated server so the user
            // isn't left on the credentials / server-required screen.
            if (!canSkipAuth) {
                const updated = getServerById(server.id);
                if (updated) {
                    setCurrentServer(updated);
                }
            }

            toast.success({
                message: t('form.updateServer.title'),
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
                    })}
                    required
                    rightSection={form.isDirty('name') && <ModifiedFieldIndicator />}
                    {...form.getInputProps('name')}
                />
                <TextInput
                    label={t('form.addServer.input', {
                        context: 'url',
                    })}
                    required
                    rightSection={form.isDirty('url') && <ModifiedFieldIndicator />}
                    {...form.getInputProps('url')}
                />
                <TextInput
                    label={t('form.addServer.input', {
                        context: 'remoteUrl',
                    })}
                    placeholder={t('form.addServer.input', {
                        context: 'remoteUrlPlaceholder',
                    })}
                    rightSection={form.isDirty('remoteUrl') && <ModifiedFieldIndicator />}
                    {...form.getInputProps('remoteUrl')}
                />
                {form.values.remoteUrl && (
                    <Group gap="xs">
                        <Checkbox
                            label={t('form.addServer.input', {
                                context: 'preferRemoteUrl',
                            })}
                            {...form.getInputProps('preferRemoteUrl', {
                                type: 'checkbox',
                            })}
                        />
                        {form.isDirty('preferRemoteUrl') && <ModifiedFieldIndicator />}
                    </Group>
                )}
                {isNavidrome && (
                    <>
                        <Divider my="lg" />
                        <SegmentedControl
                            data={ALL_AUTH_TYPES(t)}
                            defaultValue={form.values.authType}
                            fullWidth
                            size="sm"
                            {...form.getInputProps('authType')}
                        />
                    </>
                )}
                {isBasicAuth ? (
                    <>
                        <TextInput
                            label={t('form.addServer.input', {
                                context: 'username',
                            })}
                            required
                            rightSection={form.isDirty('username') && <ModifiedFieldIndicator />}
                            {...form.getInputProps('username')}
                        />
                        <PasswordInput
                            data-autofocus
                            label={t('form.addServer.input', {
                                context: 'password',
                            })}
                            {...form.getInputProps('password')}
                        />
                        {localSettings && isNavidrome && (
                            <Checkbox
                                label={t('form.addServer.input', {
                                    context: 'savePassword',
                                })}
                                {...form.getInputProps('savePassword', {
                                    type: 'checkbox',
                                })}
                            />
                        )}
                    </>
                ) : (
                    <>
                        <Text isMuted size="sm">
                            {t('form.addServer.ssoAuthenticationDescription')}
                        </Text>
                        <Accordion chevronPosition="left" variant="filled">
                            <Accordion.Item value="options">
                                <Accordion.Control>
                                    <Text isMuted size="md">
                                        {t('table.config.general.advancedSettings')}
                                    </Text>
                                </Accordion.Control>
                                <Accordion.Panel>
                                    <Stack m={5}>
                                        <TextInput
                                            description={t('form.addServer.input', {
                                                context: 'issuerUrlDescription',
                                            })}
                                            label={t('form.addServer.input', {
                                                context: 'issuerUrl',
                                            })}
                                            placeholder={t('form.addServer.input', {
                                                context: 'issuerUrlPlaceholder',
                                            })}
                                            {...form.getInputProps('issuerUrl')}
                                        />
                                        <TextInput
                                            description={t('form.addServer.input', {
                                                context: 'clientIdDescription',
                                            })}
                                            label={t('form.addServer.input', {
                                                context: 'clientId',
                                            })}
                                            required
                                            {...form.getInputProps('clientId')}
                                        />
                                    </Stack>
                                </Accordion.Panel>
                            </Accordion.Item>
                        </Accordion>{' '}
                    </>
                )}
                {isSubsonic && (
                    <Checkbox
                        label={t('form.addServer.input', {
                            context: 'legacyAuthentication',
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
                        })}
                        label={t('form.addServer.input', {
                            context: 'preferInstantMix',
                        })}
                        {...form.getInputProps('preferInstantMix', {
                            type: 'checkbox',
                        })}
                    />
                )}
                <Group justify="flex-end">
                    {isLoading && isOAuth && (
                        <ModalButton onClick={onCancel}>{t('common.cancel')}</ModalButton>
                    )}
                    <CancelSSOLoginButton setIsLoading={setIsLoading} />
                    <ModalButton loading={isLoading} type="submit" variant="filled">
                        {t('common.save')}
                    </ModalButton>
                </Group>
            </Stack>
        </form>
    );
};
