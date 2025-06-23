import { useForm } from '@mantine/form';
import { useFocusTrap } from '@mantine/hooks';
import { closeAllModals } from '@mantine/modals';
import isElectron from 'is-electron';
import { nanoid } from 'nanoid/non-secure';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { api } from '/@/renderer/api';
import JellyfinIcon from '/@/renderer/features/servers/assets/jellyfin.png';
import NavidromeIcon from '/@/renderer/features/servers/assets/navidrome.png';
import SubsonicIcon from '/@/renderer/features/servers/assets/opensubsonic.png';
import { useAuthStoreActions } from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';
import { Checkbox } from '/@/shared/components/checkbox/checkbox';
import { Group } from '/@/shared/components/group/group';
import { PasswordInput } from '/@/shared/components/password-input/password-input';
import { SegmentedControl } from '/@/shared/components/segmented-control/segmented-control';
import { Stack } from '/@/shared/components/stack/stack';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';
import { AuthenticationResponse } from '/@/shared/types/domain-types';
import { ServerType, toServerType } from '/@/shared/types/types';

const localSettings = isElectron() ? window.api.localSettings : null;

interface AddServerFormProps {
    onCancel: (() => void) | null;
}

function ServerIconWithLabel({ icon, label }: { icon: string; label: string }) {
    return (
        <Stack
            align="center"
            justify="center"
        >
            <img
                height="50"
                src={icon}
                width="50"
            />
            <Text>{label}</Text>
        </Stack>
    );
}

const SERVER_TYPES = [
    {
        label: (
            <ServerIconWithLabel
                icon={JellyfinIcon}
                label="Jellyfin"
            />
        ),
        value: ServerType.JELLYFIN,
    },
    {
        label: (
            <ServerIconWithLabel
                icon={NavidromeIcon}
                label="Navidrome"
            />
        ),
        value: ServerType.NAVIDROME,
    },
    {
        label: (
            <ServerIconWithLabel
                icon={SubsonicIcon}
                label="OpenSubsonic"
            />
        ),
        value: ServerType.SUBSONIC,
    },
];

export const AddServerForm = ({ onCancel }: AddServerFormProps) => {
    const { t } = useTranslation();
    const focusTrapRef = useFocusTrap(true);
    const [isLoading, setIsLoading] = useState(false);
    const { addServer, setCurrentServer } = useAuthStoreActions();

    const form = useForm({
        initialValues: {
            legacyAuth: false,
            name: (localSettings ? localSettings.env.SERVER_NAME : window.SERVER_NAME) ?? '',
            password: '',
            savePassword: false,
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
                m={5}
                ref={focusTrapRef}
            >
                <SegmentedControl
                    data={SERVER_TYPES}
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
                        {...form.getInputProps('name')}
                    />
                    <TextInput
                        disabled={Boolean(serverLock)}
                        label={t('form.addServer.input', {
                            context: 'url',
                            postProcess: 'titleCase',
                        })}
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
                <Group
                    grow
                    justify="flex-end"
                >
                    {onCancel && (
                        <Button
                            onClick={onCancel}
                            variant="subtle"
                        >
                            {t('common.cancel', { postProcess: 'titleCase' })}
                        </Button>
                    )}
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
