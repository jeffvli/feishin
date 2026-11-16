import { MouseEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { openCreateRadioStationModal } from '/@/renderer/features/radio/components/create-radio-station-form';
import { ImportRadioStationsModal } from '/@/renderer/features/radio/components/import-radio-stations-modal';
import {
    downloadRadioStationsFile,
    exportRadioStations,
} from '/@/renderer/features/radio/utils/radio-export';
import { ListSortByDropdown } from '/@/renderer/features/shared/components/list-sort-by-dropdown';
import { ListSortOrderToggleButton } from '/@/renderer/features/shared/components/list-sort-order-toggle-button';
import { useCurrentServer, usePermissions, useServerList } from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';
import { Divider } from '/@/shared/components/divider/divider';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { openModal } from '/@/shared/components/modal/modal';
import { toast } from '/@/shared/components/toast/toast';
import { LibraryItem, RadioListSort, SortOrder } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

export const RadioListHeaderFilters = () => {
    const { t } = useTranslation();
    const server = useCurrentServer();
    const permissions = usePermissions();
    const serverList = useServerList();
    const [isExporting, setIsExporting] = useState(false);

    const handleCreateRadioStationModal = (e: MouseEvent<HTMLButtonElement>) => {
        openCreateRadioStationModal(server, e);
    };

    const handleExport = async () => {
        setIsExporting(true);
        const { failedServers, file } = await exportRadioStations(Object.values(serverList));
        setIsExporting(false);

        if (failedServers.length > 0) {
            toast.warn({
                message: t('form.exportRadioStations.error_servers', {
                    servers: failedServers.join(', '),
                }),
            });
        }

        if (file.radioStations.length === 0) {
            toast.info({ message: t('form.exportRadioStations.empty') });
            return;
        }

        downloadRadioStationsFile(file);
    };

    const handleImport = () => {
        openModal({
            children: <ImportRadioStationsModal />,
            title: t('action.importRadioStations'),
        });
    };

    return (
        <Flex justify="space-between">
            <Group gap="sm" w="100%">
                <ListSortByDropdown
                    defaultSortByValue={RadioListSort.NAME}
                    itemType={LibraryItem.RADIO_STATION}
                    listKey={ItemListKey.RADIO}
                />
                <Divider orientation="vertical" />
                <ListSortOrderToggleButton
                    defaultSortOrder={SortOrder.ASC}
                    listKey={ItemListKey.RADIO}
                />
            </Group>
            <Group gap="sm" wrap="nowrap">
                <Button loading={isExporting} onClick={handleExport} variant="subtle">
                    {t('action.exportRadioStations')}
                </Button>
                {permissions.radio.create && (
                    <>
                        <Button onClick={handleImport} variant="subtle">
                            {t('action.importRadioStations')}
                        </Button>
                        <Button onClick={handleCreateRadioStationModal} variant="subtle">
                            {t('action.createRadioStation')}
                        </Button>
                    </>
                )}
            </Group>
        </Flex>
    );
};
