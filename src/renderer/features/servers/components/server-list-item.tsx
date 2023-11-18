import { useCallback, useState } from 'react';
import { Stack, Group, Divider } from '@mantine/core';
import { Button, Text, TimeoutButton } from '/@/renderer/components';
import { useDisclosure } from '@mantine/hooks';
import isElectron from 'is-electron';
import { useTranslation } from 'react-i18next';
import { RiDeleteBin2Line, RiEdit2Fill } from 'react-icons/ri';
import { EditServerForm } from '/@/renderer/features/servers/components/edit-server-form';
import { ServerSection } from '/@/renderer/features/servers/components/server-section';
import { useAuthStoreActions } from '/@/renderer/store';
import { ServerListItem as ServerItem } from '/@/renderer/types';

const localSettings = isElectron() ? window.electron.localSettings : null;

interface ServerListItemProps {
    server: ServerItem;
}

export const ServerListItem = ({ server }: ServerListItemProps) => {
    const { t } = useTranslation();
    const [edit, editHandlers] = useDisclosure(false);
    const [savedPassword, setSavedPassword] = useState('');
    const { deleteServer } = useAuthStoreActions();

    const handleDeleteServer = () => {
        deleteServer(server.id);
        localSettings?.passwordRemove(server.name);
    };

    const handleEdit = useCallback(() => {
        if (!edit && localSettings && server.savePassword) {
            localSettings
                .passwordGet(server.id)
                .then((password: string | null) => {
                    if (password) {
                        setSavedPassword(password);
                    } else {
                        setSavedPassword('');
                    }
                    editHandlers.open();
                    return null;
                })
                .catch((error: any) => {
                    console.error(error);
                    setSavedPassword('');
                    editHandlers.open();
                });
        } else {
            setSavedPassword('');
            editHandlers.open();
        }
    }, [edit, editHandlers, server.id, server.savePassword]);

    return (
        <Stack>
            <ServerSection
                title={
                    <Group position="apart">
                        <Text>Server details</Text>
                    </Group>
                }
            >
                {edit ? (
                    <EditServerForm
                        password={savedPassword}
                        server={server}
                        onCancel={() => editHandlers.toggle()}
                    />
                ) : (
                    <Stack>
                        <Group noWrap>
                            <Stack>
                                <Text>
                                    {t('form.addServer.input', {
                                        context: 'url',
                                        postProcess: 'sentenceCase',
                                    })}
                                </Text>
                                <Text>
                                    {t('form.addServer.input', {
                                        context: 'username',
                                        postProcess: 'sentenceCase',
                                    })}
                                </Text>
                            </Stack>
                            <Stack>
                                <Text>{server.url}</Text>
                                <Text>{server.username}</Text>
                            </Stack>
                        </Group>
                        <Group grow>
                            <Button
                                leftIcon={<RiEdit2Fill />}
                                tooltip={{ label: 'Edit server details' }}
                                variant="subtle"
                                onClick={() => handleEdit()}
                            >
                                {t('common.edit', {
                                    postProcess: 'sentenceCase',
                                })}
                            </Button>
                        </Group>
                    </Stack>
                )}
            </ServerSection>
            <Divider my="sm" />
            <TimeoutButton
                leftIcon={<RiDeleteBin2Line />}
                timeoutProps={{ callback: handleDeleteServer, duration: 1000 }}
                variant="subtle"
            >
                {t('action.removeServer', {
                    postProcess: 'sentenceCase',
                })}
            </TimeoutButton>
        </Stack>
    );
};
