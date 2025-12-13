import { t } from 'i18next';
import { useTranslation } from 'react-i18next';

import { SONG_TABLE_COLUMNS } from '/@/renderer/components/item-list/item-table-list/default-columns';
import { useIsPlayerFetching, usePlayer } from '/@/renderer/features/player/context/player-context';
import { useRestoreQueue, useSaveQueue } from '/@/renderer/features/player/hooks/use-queue-restore';
import { ListConfigMenu } from '/@/renderer/features/shared/components/list-config-menu';
import { SearchInput } from '/@/renderer/features/shared/components/search-input';
import { useCurrentServer } from '/@/renderer/store';
import { hasFeature } from '/@/shared/api/utils';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Group } from '/@/shared/components/group/group';
import { ServerFeature } from '/@/shared/types/features-types';
import { ItemListKey, ListDisplayType } from '/@/shared/types/types';

interface PlayQueueListOptionsProps {
    handleSearch: (value: string) => void;
    searchTerm?: string;
    type: ItemListKey;
}

export const PlayQueueListControls = ({
    handleSearch,
    searchTerm,
    type,
}: PlayQueueListOptionsProps) => {
    const { t } = useTranslation();
    const player = usePlayer();

    const handleClearQueue = () => {
        player.clearQueue();
    };

    const handleShuffleQueue = () => {
        player.shuffleAll();
    };

    return (
        <Group justify="space-between" px="1rem" py="1rem" w="100%">
            <Group gap="xs">
                <QueueRestoreActions />
                <ActionIcon
                    icon="mediaShuffle"
                    iconProps={{ size: 'lg' }}
                    onClick={handleShuffleQueue}
                    tooltip={{ label: t('player.shuffle', { postProcess: 'sentenceCase' }) }}
                    variant="subtle"
                />
                <ActionIcon
                    icon="x"
                    iconProps={{ size: 'lg' }}
                    onClick={handleClearQueue}
                    tooltip={{ label: t('action.clearQueue', { postProcess: 'sentenceCase' }) }}
                    variant="subtle"
                />
            </Group>
            <Group gap="xs">
                <SearchInput
                    enableHotkey={false}
                    onChange={(e) => handleSearch(e.target.value)}
                    value={searchTerm}
                />
                <ListConfigMenu
                    displayTypes={[
                        {
                            hidden: true,
                            value: ListDisplayType.GRID,
                        },
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
            </Group>
        </Group>
    );
};

const QueueRestoreActions = () => {
    const server = useCurrentServer();
    const supportsQueue = hasFeature(server, ServerFeature.SERVER_PLAY_QUEUE);

    const isFetching = useIsPlayerFetching();

    const { isPending: isSavingQueue, mutate: handleSaveQueue } = useSaveQueue();

    const handleRestoreQueue = useRestoreQueue();

    if (!supportsQueue) {
        return null;
    }

    return (
        <>
            <ActionIcon
                disabled={isFetching}
                icon="upload"
                iconProps={{ size: 'lg' }}
                loading={isSavingQueue}
                onClick={() => handleSaveQueue()}
                tooltip={{
                    label: t('player.saveQueueToServer', {
                        postProcess: 'sentenceCase',
                    }),
                }}
                variant="subtle"
            />
            <ActionIcon
                disabled={isSavingQueue}
                icon="download"
                iconProps={{ size: 'lg' }}
                loading={isFetching}
                onClick={handleRestoreQueue}
                tooltip={{
                    label: t('player.restoreQueueFromServer', {
                        postProcess: 'sentenceCase',
                    }),
                }}
                variant="subtle"
            />
        </>
    );
};
