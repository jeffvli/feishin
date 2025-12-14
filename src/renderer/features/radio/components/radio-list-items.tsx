import clsx from 'clsx';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './radio-list-items.module.css';

import { openEditRadioStationModal } from '/@/renderer/features/radio/components/edit-radio-station-form';
import {
    useRadioControls,
    useRadioPlayer,
} from '/@/renderer/features/radio/hooks/use-radio-player';
import { useDeleteRadioStation } from '/@/renderer/features/radio/mutations/delete-radio-station-mutation';
import { useCurrentServer, usePermissions } from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { closeAllModals, ConfirmModal, openModal } from '/@/shared/components/modal/modal';
import { Paper } from '/@/shared/components/paper/paper';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';
import { InternetRadioStation } from '/@/shared/types/domain-types';

interface RadioListItemProps {
    station: InternetRadioStation;
}

interface RadioListItemsProps {
    data: InternetRadioStation[];
}

const RadioListItem = ({ station }: RadioListItemProps) => {
    const { t } = useTranslation();
    const { currentStreamUrl, isPlaying } = useRadioPlayer();
    const { play, stop } = useRadioControls();
    const server = useCurrentServer();
    const permissions = usePermissions();
    const deleteRadioStationMutation = useDeleteRadioStation({});

    const isCurrentStation = currentStreamUrl === station.streamUrl;
    const stationIsPlaying = isCurrentStation && isPlaying;

    const handleClick = () => {
        if (stationIsPlaying) {
            stop();
        } else {
            play(station.streamUrl, station.name);
        }
    };

    const handleEditClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        openEditRadioStationModal(station, server, e);
    };

    const handleDeleteClick = useCallback(
        async (e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();

            if (!server) return;

            openModal({
                children: (
                    <ConfirmModal
                        labels={{
                            cancel: t('common.cancel', { postProcess: 'sentenceCase' }),
                            confirm: t('common.delete', { postProcess: 'sentenceCase' }),
                        }}
                        loading={deleteRadioStationMutation.isPending}
                        onConfirm={async () => {
                            try {
                                await deleteRadioStationMutation.mutateAsync({
                                    apiClientProps: { serverId: server.id },
                                    query: { id: station.id },
                                });

                                // Stop playback if this station is currently playing
                                if (isCurrentStation) {
                                    stop();
                                }
                            } catch (err: any) {
                                toast.error({
                                    message: err.message,
                                    title: t('error.genericError', {
                                        postProcess: 'sentenceCase',
                                    }),
                                });
                            }

                            closeAllModals();
                        }}
                    >
                        <Text>{t('common.areYouSure', { postProcess: 'sentenceCase' })}</Text>
                    </ConfirmModal>
                ),
                title: t('common.delete', { postProcess: 'titleCase' }),
            });
        },
        [deleteRadioStationMutation, isCurrentStation, server, station.id, stop, t],
    );

    return (
        <Paper
            className={clsx(styles['radio-item'], {
                [styles['radio-item-active']]: isCurrentStation,
            })}
            p="md"
        >
            <Flex align="flex-start" gap="md" justify="space-between">
                <button className={styles['radio-item-button']} onClick={handleClick} role="button">
                    <Stack gap="xs">
                        <Group gap="xs">
                            <Icon color="muted" icon="radio" size="md" />
                            <Text fw={500} size="md">
                                {station.name}
                            </Text>
                        </Group>
                        <Text isMuted size="sm">
                            {station.streamUrl}
                        </Text>
                        {station.homepageUrl && (
                            <Text isMuted size="sm">
                                {station.homepageUrl}
                            </Text>
                        )}
                    </Stack>
                </button>
                {(permissions.radio.edit || permissions.radio.delete) && (
                    <Group gap="xs">
                        {permissions.radio.edit && (
                            <ActionIcon
                                icon="edit"
                                onClick={handleEditClick}
                                size="sm"
                                tooltip={{
                                    label: t('common.edit', { postProcess: 'sentenceCase' }),
                                }}
                                variant="subtle"
                            />
                        )}
                        {permissions.radio.delete && (
                            <ActionIcon
                                icon="delete"
                                iconProps={{ color: 'error' }}
                                onClick={handleDeleteClick}
                                size="sm"
                                tooltip={{
                                    label: t('common.delete', { postProcess: 'sentenceCase' }),
                                }}
                                variant="subtle"
                            />
                        )}
                    </Group>
                )}
            </Flex>
        </Paper>
    );
};

export const RadioListItems = ({ data }: RadioListItemsProps) => {
    const items = useMemo(
        () => data.map((station) => <RadioListItem key={station.id} station={station} />),
        [data],
    );

    return <Stack gap="sm">{items}</Stack>;
};
