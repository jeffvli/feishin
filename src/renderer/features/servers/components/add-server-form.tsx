import { useForm } from '@mantine/form';
import { closeAllModals } from '@mantine/modals';
import isElectron from 'is-electron';
import { nanoid } from 'nanoid/non-secure';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { api } from '/@/renderer/api';
import JellyfinIcon from '/@/renderer/features/servers/assets/jellyfin.png';
import NavidromeIcon from '/@/renderer/features/servers/assets/navidrome.png';
import SubsonicIcon from '/@/renderer/features/servers/assets/opensubsonic.png';
import { useAuthStoreActions } from '/@/renderer/store';
import { Checkbox } from '/@/shared/components/checkbox/checkbox';
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
import { AuthenticationResponse, ServerListItemWithCredential } from '/@/shared/types/domain-types';
import { DiscoveredServerItem, ServerType, toServerType } from '/@/shared/types/types';

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

export const AddServerForm = ({ onCancel }: AddServerFormProps) => {
    const { t } = useTranslation();
    const focusTrapRef = useFocusTrap(true);
    const [isLoading, setIsLoading] = useState(false);
    const { addServer, setCurrentServer } = useAuthStoreActions();
    const { servers: discovered } = useAutodiscovery();

    const form = useForm({
        initialValues: {
            legacyAuth: false,
            name: (localSettings ? localSettings.env.SERVER_NAME : window.SERVER_NAME) ?? '',
            password: '',
            preferInstantMix: undefined,
            savePassword: undefined,
            type:
                (localSettings
                    ? localSettings.env.SERVER_TYPE
                    : toServerType(window.SERVER_TYPE)) ?? ServerType.NAVIDROME,
            url: (localSettings ? localSettings.env.SERVER_URL : window.SERVER_URL) ?? 'https://',
            username: '',
        },
    });

    // server lock for web is only true if lock is true *and* all other properties are set
    const serverLock =
        (localSettings
            ? !!localSettings.env.SERVER_LOCK
            : !!window.SERVER_LOCK &&
              window.SERVER_TYPE &&
              window.SERVER_NAME &&
              window.SERVER_URL) || false;

    const isSubmitDisabled = !form.values.name || !form.values.url || !form.values.username;

    const fillServerDetails = (server: DiscoveredServerItem) => {
        form.setValues({ ...server });
    };

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

            const serverItem: ServerListItemWithCredential = {
                credential: data.credential,
                id: nanoid(),
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

            if (data.ndCredential !== undefined) {
                serverItem.ndCredential = data.ndCredential;
            }

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
                        disabled={Boolean(serverLock)}
                        p="md"
                        withItemsBorders={false}
                        {...form.getInputProps('type')}
                    />
                    <Group grow>
                        <TextInput
                            data-autofocus
                            disabled={Boolean(serverLock)}
                            label={t('form.addServer.input', {
                                context: 'name',
                                postProcess: 'titleCase',
                            })}
                            required
                            {...form.getInputProps('name')}
                        />
                        <TextInput
                            disabled={Boolean(serverLock)}
                            label={t('form.addServer.input', {
                                context: 'url',
                                postProcess: 'titleCase',
                            })}
                            required
                            {...form.getInputProps('url')}
                        />
                    </Group>
                    <TextInput
                        label={t('form.addServer.input', {
                            context: 'username',
                            postProcess: 'titleCase',
                        })}
                        required
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
                    <Group grow>
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
                </Stack>
            </form>
        </>
    );
};
