import { closeAllModals } from '@mantine/modals';
import isElectron from 'is-electron';
import { nanoid } from 'nanoid/non-secure';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { api } from '/@/renderer/api';
import {
    isLegacyAuth,
    isServerLock,
} from '/@/renderer/features/action-required/utils/window-properties';
import JellyfinIcon from '/@/renderer/features/servers/assets/jellyfin.png';
import NavidromeIcon from '/@/renderer/features/servers/assets/navidrome.png';
import SubsonicIcon from '/@/renderer/features/servers/assets/opensubsonic.png';
import { IgnoreCorsSslSwitches } from '/@/renderer/features/servers/components/ignore-cors-ssl-switches';
import { useAuthStoreActions, useServerList } from '/@/renderer/store';
import { Accordion } from '/@/shared/components/accordion/accordion';
import { Checkbox } from '/@/shared/components/checkbox/checkbox';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { ModalButton } from '/@/shared/components/modal/model-shared';
import { Paper } from '/@/shared/components/paper/paper';
import { PasswordInput } from '/@/shared/components/password-input/password-input';
import { SegmentedControl } from '/@/shared/components/segmented-control/segmented-control';
import { Stack } from '/@/shared/components/stack/stack';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';
import { useFocusTrap } from '/@/shared/hooks/use-focus-trap';
import { useForm } from '/@/shared/hooks/use-form';
import {
    AuthenticationResponse,
    OAuthRedirectScheme,
    ServerListItemWithCredential,
} from '/@/shared/types/domain-types';
import { AuthType, DiscoveredServerItem, ServerType, toServerType } from '/@/shared/types/types';

const autodiscover = isElectron() ? window.api.autodiscover : null;
const localSettings = isElectron() ? window.api.localSettings : null;

interface AddServerFormProps {
    onCancel: (() => void) | null;
}

interface ServerDetails {
    icon: string;
    name: string;
}

function ServerIconWithLabel({ icon, label }: { icon: string; label: string }) {
    return (
        <Stack align="center" justify="center">
            <img height="50" src={icon} width="50" />
            <Text>{label}</Text>
        </Stack>
    );
}

function useAutodiscovery() {
    const [isDone, setDone] = useState(false);
    const [servers, setServers] = useState<DiscoveredServerItem[]>([]);

    useEffect(() => {
        setServers([]);

        autodiscover
            ?.discover((newServer) => {
                setServers((tail) => [...tail, newServer]);
            })
            .then(() => {
                setDone(true);
            });
    }, []);

    return { isDone, servers };
}

const SERVER_TYPES: Record<ServerType, ServerDetails> = {
    [ServerType.JELLYFIN]: {
        icon: JellyfinIcon,
        name: 'Jellyfin',
    },
    [ServerType.NAVIDROME]: {
        icon: NavidromeIcon,
        name: 'Navidrome',
    },
    [ServerType.SUBSONIC]: {
        icon: SubsonicIcon,
        name: 'OpenSubsonic',
    },
};

const ALL_SERVERS = Object.keys(SERVER_TYPES).map((serverType) => {
    const info = SERVER_TYPES[serverType];
    return {
        label: <ServerIconWithLabel icon={info.icon} label={info.name} />,
        value: serverType,
    };
});

const ALL_AUTH_TYPES = (t) => {
    return Object.values(AuthType).map((authType) => {
        return {
            label: t('form.addServer.input', { context: authType }),
            value: authType,
        };
    });
};

export const AddServerForm = ({ onCancel }: AddServerFormProps) => {
    const { t } = useTranslation();
    const focusTrapRef = useFocusTrap(true);
    const [isLoading, setIsLoading] = useState(false);
    const { addServer, setCurrentServer } = useAuthStoreActions();
    const serverList = useServerList();
    const { servers: discovered } = useAutodiscovery();
    const [externalSSOPageOpen, setExternalSSOPageOpen] = useState(false);

    const serverLock = isServerLock();

    useEffect(() => {
        const pageOpened = () => {
            setExternalSSOPageOpen(true);
        };
        const gotSSOResponse = () => {
            setExternalSSOPageOpen(false);
        };
        const gotSSOError = () => {
            if (!externalSSOPageOpen) return;

            setExternalSSOPageOpen(false);
            setIsLoading(false);
            toast.error({
                message: t('error.ssoError'),
            });
        };

        window.api.oauth.externalPageOpenedCallback(pageOpened);
        window.api.oauth.oauthCallback(gotSSOResponse);
        window.api.oauth.oauthCallbackError(gotSSOError);
    }, []);

    const form = useForm({
        initialValues: {
            authType: AuthType.BASIC,
            clientId: OAuthRedirectScheme,
            issuerUrl: '',
            legacyAuth: isLegacyAuth(),
            name:
                (localSettings ? localSettings.env.SERVER_NAME : window.SERVER_NAME) || 'My Server',
            password: '',
            preferInstantMix: undefined,
            preferRemoteUrl: false,
            remoteUrl: '',
            savePassword: undefined,
            type:
                (localSettings
                    ? localSettings.env.SERVER_TYPE
                    : toServerType(window.SERVER_TYPE)) ?? ServerType.NAVIDROME,
            url: (localSettings ? localSettings.env.SERVER_URL : window.SERVER_URL) ?? 'https://',
            username: '',
        },
    });

    const useOAuth =
        form.values.type === ServerType.NAVIDROME && form.values.authType === AuthType.OAUTH;
    const isBasicAuth =
        (form.values.authType === AuthType.BASIC && form.values.type === ServerType.NAVIDROME) ||
        form.values.type !== ServerType.NAVIDROME;

    const usernameRequired = !form.values.username && isBasicAuth;
    const isSubmitDisabled = !form.values.name || usernameRequired;

    const fillServerDetails = (server: DiscoveredServerItem) => {
        form.setValues({ ...server });
    };

    const handleSubmit = form.onSubmit(async (values) => {
        if (serverLock && Object.keys(serverList).length >= 1) {
            toast.error({
                message: t('error.serverLockSingleServer'),
            });
            return;
        }

        let authFunction = useOAuth
            ? api.controller.authenticateOAuth
            : api.controller.authenticate;
        if (!authFunction) {
            return toast.error({
                message: t('error.invalidServer'),
            });
        }

        try {
            setIsLoading(true);
            let data: AuthenticationResponse | undefined;
            if (useOAuth) {
                authFunction = api.controller.authenticateOAuth;
                data = await authFunction?.(
                    values.url,
                    values.issuerUrl,
                    values.clientId,
                    values.type as ServerType,
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

            const serverItem: ServerListItemWithCredential = {
                authType: values.type === ServerType.NAVIDROME ? values.authType : AuthType.BASIC,
                clientId: values.clientId,
                credential: data.credential,
                id: nanoid(),
                isAdmin: data.isAdmin,
                issuerUrl: values.issuerUrl,
                name: values.name,
                type: values.type as ServerType,
                url: values.url.replace(/\/$/, ''),
                userId: data.userId,
                username: data.username,
            };

            if (values.preferInstantMix !== undefined) {
                serverItem.preferInstantMix = values.preferInstantMix;
            }

            if (values.savePassword !== undefined) {
                serverItem.savePassword = values.savePassword;
            }

            if (values.remoteUrl?.trim()) {
                serverItem.remoteUrl = values.remoteUrl.trim().replace(/\/$/, '');
            }

            if (values.preferRemoteUrl !== undefined) {
                serverItem.preferRemoteUrl = values.preferRemoteUrl;
            }

            if (data.ndCredential !== undefined) {
                serverItem.ndCredential = data.ndCredential;
            }

            addServer(serverItem);
            setCurrentServer(serverItem);
            closeAllModals();

            toast.success({
                message: t('form.addServer.success'),
            });

            if (localSettings && values.savePassword) {
                const saved = await localSettings.passwordSet(values.password, serverItem.id);
                if (!saved) {
                    toast.error({
                        message: t('form.addServer.error', {
                            context: 'savePassword',
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

    const cancelSSOLogin = () => {
        setExternalSSOPageOpen(false);
        setIsLoading(false);
        window.api.oauth.cancelSSOLogin();
    };

    return (
        <>
            <Stack>
                {discovered.map((server) => (
                    <Paper key={server.url} p="10px">
                        <Group>
                            <img height="32" src={SERVER_TYPES[server.type].icon} width="32" />
                            <div
                                onClick={() => fillServerDetails(server)}
                                style={{ cursor: 'pointer' }}
                            >
                                <Text fw={700}>{server.name}</Text>
                                <Text>
                                    {SERVER_TYPES[server.type].name} server at {server.url}
                                </Text>
                            </div>
                        </Group>
                    </Paper>
                ))}
            </Stack>
            <form onSubmit={handleSubmit}>
                <Stack m={5} ref={focusTrapRef}>
                    <SegmentedControl
                        data={ALL_SERVERS}
                        disabled={serverLock}
                        p="md"
                        withItemsBorders={false}
                        {...form.getInputProps('type')}
                    />
                    <Group grow>
                        <TextInput
                            data-autofocus
                            disabled={serverLock}
                            label={t('form.addServer.input', {
                                context: 'name',
                            })}
                            required
                            {...form.getInputProps('name')}
                        />
                        <TextInput
                            disabled={serverLock}
                            label={t('form.addServer.input', {
                                context: 'url',
                            })}
                            required
                            {...form.getInputProps('url')}
                        />
                    </Group>
                    <TextInput
                        disabled={serverLock}
                        label={t('form.addServer.input', {
                            context: 'remoteUrl',
                        })}
                        placeholder={t('form.addServer.input', {
                            context: 'remoteUrlPlaceholder',
                        })}
                        {...form.getInputProps('remoteUrl')}
                    />
                    {form.values.remoteUrl && (
                        <Checkbox
                            label={t('form.addServer.input', {
                                context: 'preferRemoteUrl',
                            })}
                            {...form.getInputProps('preferRemoteUrl', {
                                type: 'checkbox',
                            })}
                        />
                    )}
                    {form.values.type === ServerType.NAVIDROME && (
                        <>
                            <Divider my="lg" />
                            <SegmentedControl
                                data={ALL_AUTH_TYPES(t)}
                                fullWidth
                                size="md"
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
                                {...form.getInputProps('username')}
                            />

                            <PasswordInput
                                description={
                                    form.values.type === ServerType.NAVIDROME &&
                                    t('form.addServer.input', { context: 'passwordNoSSO' })
                                }
                                label={t('form.addServer.input', {
                                    context: 'password',
                                })}
                                {...form.getInputProps('password')}
                            />
                            {localSettings && form.values.type === ServerType.NAVIDROME && (
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
                                            {t('form.addServer.advancedSSOOptions')}
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
                                                {...form.getInputProps('clientId')}
                                            />
                                        </Stack>
                                    </Accordion.Panel>
                                </Accordion.Item>
                            </Accordion>{' '}
                        </>
                    )}
                    {form.values.type === ServerType.SUBSONIC && (
                        <Checkbox
                            disabled={serverLock}
                            label={t('form.addServer.input', {
                                context: 'legacyAuthentication',
                            })}
                            {...form.getInputProps('legacyAuth', { type: 'checkbox' })}
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
                    {isElectron() && (
                        <>
                            <Divider />
                            <IgnoreCorsSslSwitches />
                            <Divider />
                        </>
                    )}
                    <Group grow justify="flex-end">
                        {onCancel && (
                            <ModalButton onClick={onCancel}>{t('common.cancel')}</ModalButton>
                        )}
                        <ModalButton
                            disabled={isSubmitDisabled}
                            loading={isLoading}
                            type="submit"
                            variant="filled"
                        >
                            {t('common.add')}
                        </ModalButton>
                    </Group>
                    {externalSSOPageOpen && (
                        <ModalButton onClick={cancelSSOLogin} variant="default">
                            {t('form.addServer.cancelSSO')}
                        </ModalButton>
                    )}
                </Stack>
            </form>
        </>
    );
};
