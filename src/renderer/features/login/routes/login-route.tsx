import { useForm } from '@mantine/form';
import isElectron from 'is-electron';
import { nanoid } from 'nanoid/non-secure';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router';

import { api } from '/@/renderer/api';
import { PageHeader } from '/@/renderer/components/page-header/page-header';
import JellyfinIcon from '/@/renderer/features/servers/assets/jellyfin.png';
import NavidromeIcon from '/@/renderer/features/servers/assets/navidrome.png';
import SubsonicIcon from '/@/renderer/features/servers/assets/opensubsonic.png';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';
import { AppRoute } from '/@/renderer/router/routes';
import { useAuthStoreActions, useCurrentServer } from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';
import { Center } from '/@/shared/components/center/center';
import { Paper } from '/@/shared/components/paper/paper';
import { PasswordInput } from '/@/shared/components/password-input/password-input';
import { Stack } from '/@/shared/components/stack/stack';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';
import { AuthenticationResponse, ServerListItemWithCredential } from '/@/shared/types/domain-types';
import { ServerType, toServerType } from '/@/shared/types/types';

const localSettings = isElectron() ? window.api.localSettings : null;

const SERVER_ICONS: Record<ServerType, string> = {
    [ServerType.JELLYFIN]: JellyfinIcon,
    [ServerType.NAVIDROME]: NavidromeIcon,
    [ServerType.SUBSONIC]: SubsonicIcon,
};

const SERVER_NAMES: Record<ServerType, string> = {
    [ServerType.JELLYFIN]: 'Jellyfin',
    [ServerType.NAVIDROME]: 'Navidrome',
    [ServerType.SUBSONIC]: 'OpenSubsonic',
};

const LoginRoute = () => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const { addServer, setCurrentServer } = useAuthStoreActions();
    const currentServer = useCurrentServer();

    // Check if server lock is configured
    const serverLock = localSettings?.env.SERVER_LOCK || false;
    const serverType = localSettings?.env.SERVER_TYPE
        ? toServerType(localSettings.env.SERVER_TYPE)
        : null;
    const serverName = localSettings?.env.SERVER_NAME || '';
    const serverUrl = localSettings?.env.SERVER_URL || '';

    const form = useForm({
        initialValues: {
            password: '',
            username: '',
        },
    });

    if (!serverLock || !serverType || currentServer) {
        return <Navigate replace to={AppRoute.HOME} />;
    }

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
                serverUrl,
                {
                    legacy: false,
                    password: values.password,
                    username: values.username,
                },
                serverType,
            );

            if (!data) {
                return toast.error({
                    message: t('error.authenticationFailed', { postProcess: 'sentenceCase' }),
                });
            }

            const serverItem: ServerListItemWithCredential = {
                credential: data.credential,
                id: nanoid(),
                name: serverName,
                type: serverType,
                url: serverUrl.replace(/\/$/, ''),
                userId: data.userId,
                username: data.username,
            };

            if (data.ndCredential !== undefined) {
                serverItem.ndCredential = data.ndCredential;
            }

            addServer(serverItem);
            setCurrentServer(serverItem);

            toast.success({
                message: t('form.addServer.success', { postProcess: 'sentenceCase' }),
            });

            if (localSettings && values.password) {
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

    const isSubmitDisabled = !form.values.username || !form.values.password;
    const serverIcon = SERVER_ICONS[serverType];
    const serverDisplayName = SERVER_NAMES[serverType];

    return (
        <AnimatedPage>
            <PageHeader />
            <Center style={{ height: '100%', width: '100vw' }}>
                <Paper p="xl" style={{ maxWidth: '400px', width: '100%' }}>
                    <form onSubmit={handleSubmit}>
                        <Stack gap="xl">
                            <Stack align="center" gap="md">
                                <img
                                    alt={serverDisplayName}
                                    height="80"
                                    src={serverIcon}
                                    width="80"
                                />
                                <Text fw={600} size="xl">
                                    {serverDisplayName}
                                </Text>
                                {serverName && (
                                    <Text c="dimmed" size="sm">
                                        {serverName}
                                    </Text>
                                )}
                            </Stack>

                            <Stack gap="md">
                                <TextInput
                                    data-autofocus
                                    label={t('form.addServer.input', {
                                        context: 'username',
                                        postProcess: 'titleCase',
                                    })}
                                    required
                                    variant="filled"
                                    {...form.getInputProps('username')}
                                />
                                <PasswordInput
                                    label={t('form.addServer.input', {
                                        context: 'password',
                                        postProcess: 'titleCase',
                                    })}
                                    required
                                    variant="filled"
                                    {...form.getInputProps('password')}
                                />
                            </Stack>

                            <Button
                                disabled={isSubmitDisabled}
                                fullWidth
                                loading={isLoading}
                                type="submit"
                                variant="filled"
                            >
                                {t('common.login', {
                                    defaultValue: 'Login',
                                    postProcess: 'titleCase',
                                })}
                            </Button>
                        </Stack>
                    </form>
                </Paper>
            </Center>
        </AnimatedPage>
    );
};

export default LoginRoute;
