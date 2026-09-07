import { useIsFetching } from '@tanstack/react-query';
import clsx from 'clsx';
import { MouseEvent, RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './play-queue-list-controls.module.css';

import { queryKeys } from '/@/renderer/api/query-keys';
import { SONG_TABLE_COLUMNS } from '/@/renderer/components/item-list/item-table-list/default-columns';
import { ItemListHandle } from '/@/renderer/components/item-list/types';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { useRestoreQueue, useSaveQueue } from '/@/renderer/features/player/hooks/use-queue-restore';
import { openCreatePrefilledPlaylistModal } from '/@/renderer/features/playlists/components/create-playlist-form';
import {
    ListConfigMenu,
    SONG_DISPLAY_TYPES,
} from '/@/renderer/features/shared/components/list-config-menu';
import { MoreButton } from '/@/renderer/features/shared/components/more-button';
import { SearchInput } from '/@/renderer/features/shared/components/search-input';
import { useCurrentServer, usePlayerStoreBase } from '/@/renderer/store';
import { hasFeature } from '/@/shared/api/utils';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Box } from '/@/shared/components/box/box';
import { Divider } from '/@/shared/components/divider/divider';
import { DropdownMenu } from '/@/shared/components/dropdown-menu/dropdown-menu';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { toast } from '/@/shared/components/toast/toast';
import { ServerFeature } from '/@/shared/types/features-types';
import { ItemListKey, ListDisplayType } from '/@/shared/types/types';

const TIER_1_MAX = 480;
const TIER_2_MAX = 380;
const TIER_3_MAX = 300;

type OverflowTier = 0 | 1 | 2 | 3;

const getOverflowTier = (width: number): OverflowTier => {
    if (width <= TIER_3_MAX) return 3;
    if (width <= TIER_2_MAX) return 2;
    if (width <= TIER_1_MAX) return 1;
    return 0;
};

interface PlayQueueListOptionsProps {
    handleSearch: (value: string) => void;
    searchTerm?: string;
    tableRef: RefObject<ItemListHandle | null>;
    type: ItemListKey;
}

export const PlayQueueListControls = ({
    handleSearch,
    searchTerm,
    tableRef,
    type,
}: PlayQueueListOptionsProps) => {
    const { t } = useTranslation();
    const server = useCurrentServer();
    const player = usePlayer();
    const supportsQueue = hasFeature(server, ServerFeature.SERVER_PLAY_QUEUE);
    const toolbarRef = useRef<HTMLDivElement>(null);
    const [overflowTier, setOverflowTier] = useState<OverflowTier>(0);

    useEffect(() => {
        const element = toolbarRef.current;
        if (!element) return;

        const updateTier = (width: number) => {
            setOverflowTier(getOverflowTier(width));
        };

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (!entry) return;
            updateTier(entry.contentRect.width);
        });

        observer.observe(element);

        const style = getComputedStyle(element);
        const horizontalPadding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
        updateTier(element.getBoundingClientRect().width - horizontalPadding);

        return () => observer.disconnect();
    }, []);

    const isFetching = useIsFetching({ queryKey: queryKeys.player.fetch({ type: 'queue' }) });
    const { isPending: isSavingQueue, mutate: saveQueue } = useSaveQueue();
    const handleRestoreQueue = useRestoreQueue();

    const handleSaveQueue = useCallback(() => {
        saveQueue(undefined, {
            onSuccess: () => {
                toast.success({
                    message: t('form.saveQueue.success'),
                });
            },
        });
    }, [saveQueue, t]);

    const handleClearQueue = () => {
        player.clearQueue();
    };

    const handleJumpToCurrent = () => {
        const index = usePlayerStoreBase.getState().player.index;
        if (index !== -1) {
            tableRef.current?.scrollToIndex(index);
        }
    };

    const handleShuffleQueue = () => {
        player.shuffleAll();
    };

    const handleCreatePlaylistFromQueue = (e?: MouseEvent<HTMLButtonElement>) => {
        const queueSongs = player.getQueue();
        openCreatePrefilledPlaylistModal(server, queueSongs, e);
    };

    const isRestoreBusy = isSavingQueue || Boolean(isFetching);
    const showTier1Menu = supportsQueue && overflowTier >= 1;
    const showTier2Menu = overflowTier >= 2;
    const showTier3Menu = overflowTier >= 3;

    return (
        <Group
            align="center"
            className={clsx(styles.toolbar, {
                [styles.hasRestore]: supportsQueue,
            })}
            data-overflow-tier={overflowTier}
            gap="sm"
            justify="flex-start"
            px="md"
            py="xs"
            ref={toolbarRef}
            style={{ borderBottom: '1px solid var(--theme-colors-border)' }}
            w="100%"
            wrap="nowrap"
        >
            <Group gap="xs" style={{ flexShrink: 0 }} wrap="nowrap">
                {supportsQueue && (
                    <span className={styles.overflowTier1}>
                        <ActionIcon
                            disabled={Boolean(isFetching)}
                            icon="upload"
                            iconProps={{ size: 'lg' }}
                            loading={isSavingQueue}
                            onClick={() => handleSaveQueue()}
                            tooltip={{
                                label: t('player.saveQueueToServer'),
                            }}
                            variant="subtle"
                        />
                        <ActionIcon
                            disabled={isRestoreBusy}
                            icon="download"
                            iconProps={{ size: 'lg' }}
                            loading={Boolean(isFetching)}
                            onClick={handleRestoreQueue}
                            tooltip={{
                                label: t('player.restoreQueueFromServer'),
                            }}
                            variant="subtle"
                        />
                    </span>
                )}
                <span className={styles.overflowTier3}>
                    <ActionIcon
                        icon="mediaShuffle"
                        iconProps={{ size: 'lg' }}
                        onClick={handleShuffleQueue}
                        tooltip={{ label: t('player.shuffle') }}
                        variant="subtle"
                    />
                    <ActionIcon
                        icon="delete"
                        iconProps={{ size: 'lg' }}
                        onClick={handleClearQueue}
                        tooltip={{ label: t('action.clearQueue') }}
                        variant="subtle"
                    />
                </span>
                <span className={styles.overflowTier2}>
                    <ActionIcon
                        icon="goToItem"
                        iconProps={{ size: 'lg' }}
                        onClick={handleJumpToCurrent}
                        tooltip={{ label: t('action.goToCurrent') }}
                        variant="subtle"
                    />
                    <ActionIcon
                        icon="playlistAdd"
                        iconProps={{ size: 'lg' }}
                        onClick={handleCreatePlaylistFromQueue}
                        tooltip={{ label: t('action.createPlaylistFromQueue') }}
                        variant="subtle"
                    />
                </span>
                <span className={styles.moreTrigger}>
                    <DropdownMenu position="bottom-start">
                        <DropdownMenu.Target>
                            <MoreButton />
                        </DropdownMenu.Target>
                        <DropdownMenu.Dropdown>
                            {showTier1Menu && (
                                <>
                                    <DropdownMenu.Item
                                        disabled={Boolean(isFetching) || isSavingQueue}
                                        leftSection={<Icon icon="upload" />}
                                        onClick={() => handleSaveQueue()}
                                    >
                                        {t('player.saveQueueToServer')}
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Item
                                        disabled={isRestoreBusy}
                                        leftSection={<Icon icon="download" />}
                                        onClick={handleRestoreQueue}
                                    >
                                        {t('player.restoreQueueFromServer')}
                                    </DropdownMenu.Item>
                                </>
                            )}
                            {showTier3Menu && (
                                <>
                                    <DropdownMenu.Item
                                        leftSection={<Icon icon="mediaShuffle" />}
                                        onClick={handleShuffleQueue}
                                    >
                                        {t('player.shuffle')}
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Item
                                        leftSection={<Icon icon="delete" />}
                                        onClick={handleClearQueue}
                                    >
                                        {t('action.clearQueue')}
                                    </DropdownMenu.Item>
                                </>
                            )}
                            {showTier2Menu && (
                                <>
                                    <DropdownMenu.Item
                                        leftSection={<Icon icon="goToItem" />}
                                        onClick={handleJumpToCurrent}
                                    >
                                        {t('action.goToCurrent')}
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Item
                                        leftSection={<Icon icon="playlistAdd" />}
                                        onClick={() => handleCreatePlaylistFromQueue()}
                                    >
                                        {t('action.createPlaylistFromQueue')}
                                    </DropdownMenu.Item>
                                </>
                            )}
                        </DropdownMenu.Dropdown>
                    </DropdownMenu>
                </span>
            </Group>
            <Divider h="60%" orientation="vertical" style={{ alignSelf: 'center' }} />
            <Box style={{ display: 'flex', flex: 1, minWidth: 0 }}>
                <SearchInput
                    enableHotkey={false}
                    fillContainer
                    onChange={(e) => handleSearch(e.target.value)}
                    value={searchTerm}
                />
            </Box>
            <Divider h="60%" orientation="vertical" style={{ alignSelf: 'center' }} />
            <Box style={{ flexShrink: 0 }}>
                <ListConfigMenu
                    displayTypes={[
                        { hidden: true, value: ListDisplayType.GRID },
                        ...SONG_DISPLAY_TYPES,
                    ]}
                    listKey={type}
                    optionsConfig={{
                        table: {
                            itemsPerPage: { hidden: true },
                            pagination: { hidden: true },
                        },
                    }}
                    tableColumnsData={SONG_TABLE_COLUMNS}
                />
            </Box>
        </Group>
    );
};
