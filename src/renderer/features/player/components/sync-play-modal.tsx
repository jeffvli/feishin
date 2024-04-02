import { useMemo } from 'react';
import { Divider, Group, Stack, Stack } from '@mantine/core';
import { closeAllModals, openModal } from '@mantine/modals';
import { QueryClient } from '@tanstack/react-query';
import merge from 'lodash/merge';
import { RiAddBoxFill, RiPlayFill, RiAddCircleFill } from 'react-icons/ri';
import { Button, Select, Text } from '/@/renderer/components';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
    GenreListResponse,
    RandomSongListQuery,
    MusicFolderListResponse,
    ServerType,
    GenreListSort,
    SortOrder,
    ServerListItem,
} from '/@/renderer/api/types';
import { api } from '/@/renderer/api';
import { useAuthStore, usePlayerControls } from '/@/renderer/store';
import { queryKeys } from '/@/renderer/api/query-keys';
import { Play, PlayQueueAddOptions, SyncPlayGroup, SyncPlayList } from '/@/renderer/types';
import i18n from '/@/i18n/i18n';

interface SyncPlayModalProps {
    syncPlayList: SyncPlayList;
}

const SyncPlayModal = ({ syncPlayList }: SyncPlayModalProps) => {
    const { syncPlayStart } = usePlayerControls();
    async function joinGroup(item: SyncPlayGroup) {
        console.log('Joining group...');
        syncPlayStart(item);
    }

    async function createGroup() {
        console.log('Creating group...');
        syncPlayStart(null);
    }
    return (
        <Stack spacing="md">
            {syncPlayList.map((item, index) => (
                <div key={index}>
                    <Button
                        fullWidth
                        size="xl"
                        type="submit"
                        variant="default"
                        onClick={() => joinGroup(item)}
                    >
                        <div style={{ fontSize: '22px', fontWeight: 'bold', textAlign: 'left' }}>
                            {item.GroupName}
                        </div>
                        <div>{item.Participants.join(', ')}</div>
                    </Button>
                    <Divider />
                </div>
            ))}
            <Button
                fullWidth
                size="xl"
                type="submit"
                variant="default"
                onClick={() => createGroup()}
            >
                <div style={{ fontSize: '22px', fontWeight: 'bold', textAlign: 'left' }}>
                    Create new group
                </div>
            </Button>
            <Text>graphic design is my passion</Text>
        </Stack>
    );
};

export const openSyncPlayModal = async (props: { queryClient: QueryClient }) => {
    const server = useAuthStore.getState().currentServer;

    console.log('Getting syncplay data...');
    const syncPlayData = await props.queryClient.fetchQuery({
        queryFn: ({ signal }) =>
            api.controller.getSyncPlayList({
                apiClientProps: {
                    server,
                    signal,
                },
            }),
        queryKey: [queryKeys.syncPlayList],
    });

    console.log('Syncplay data:', syncPlayData);

    openModal({
        children: <SyncPlayModal syncPlayList={syncPlayData[0]} />,
        size: 'sm',
        title: i18n.t('player.syncPlay', { postProcess: 'sentenceCase' }) as string,
    });
};
