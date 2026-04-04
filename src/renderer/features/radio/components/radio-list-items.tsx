import clsx from 'clsx';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './radio-list-items.module.css';

import { ItemImage } from '/@/renderer/components/item-image/item-image';
import { openEditRadioStationModal } from '/@/renderer/features/radio/components/edit-radio-station-form';
import {
    useRadioControls,
    useRadioPlayer,
} from '/@/renderer/features/radio/hooks/use-radio-player';
import { useDeleteRadioStation } from '/@/renderer/features/radio/mutations/delete-radio-station-mutation';
import { useCurrentServer, usePermissions } from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Box } from '/@/shared/components/box/box';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { closeAllModals, ConfirmModal, openModal } from '/@/shared/components/modal/modal';
import { Paper } from '/@/shared/components/paper/paper';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';
import { InternetRadioStation, LibraryItem } from '/@/shared/types/domain-types';

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
        } else if (server?.id) {
            play(station.streamUrl, station.name, {
                id: station.id,
                imageId: station.imageId,
                imageUrl: station.imageUrl,
                serverId: server.id,
            });
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
            <Flex align="center" gap="md" justify="space-between" wrap="nowrap">
                <button className={styles['radio-item-button']} onClick={handleClick} type="button">
                    <Group align="center" gap="md" wrap="nowrap">
                        <Box className={styles.thumbnail}>
                            <ItemImage
                                enableViewport={false}
                                id={station.imageId ?? undefined}
                                imageContainerProps={{
                                    className: styles['image-container'],
                                }}
                                itemType={LibraryItem.RADIO_STATION}
                                serverId={server?.id}
                                src={station.imageUrl ?? ''}
                                type="table"
                            />
                        </Box>
                        <Stack className={styles.meta} gap={4}>
                            <Text fw={500} size="md">
                                {station.name}
                            </Text>
                            <Text className={styles['meta-line']} isMuted size="sm">
                                {station.streamUrl}
                            </Text>
                            {station.homepageUrl ? (
                                <Text className={styles['meta-line']} isMuted size="sm">
                                    {station.homepageUrl}
                                </Text>
                            ) : null}
                        </Stack>
                    </Group>
                </button>
                {(permissions.radio.edit || permissions.radio.delete) && (
                    <Group className={styles['radio-item-actions']} gap="xs">
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
