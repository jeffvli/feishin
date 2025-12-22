import { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { openCreateRadioStationModal } from '/@/renderer/features/radio/components/create-radio-station-form';
import { ListSortByDropdown } from '/@/renderer/features/shared/components/list-sort-by-dropdown';
import { ListSortOrderToggleButton } from '/@/renderer/features/shared/components/list-sort-order-toggle-button';
import { useCurrentServer, usePermissions } from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';
import { Divider } from '/@/shared/components/divider/divider';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { LibraryItem, RadioListSort, SortOrder } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

export const RadioListHeaderFilters = () => {
    const { t } = useTranslation();
    const server = useCurrentServer();
    const permissions = usePermissions();

    const handleCreateRadioStationModal = (e: MouseEvent<HTMLButtonElement>) => {
        openCreateRadioStationModal(server, e);
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
            {permissions.radio.create && (
                <Group gap="sm" wrap="nowrap">
                    <Button onClick={handleCreateRadioStationModal} variant="subtle">
                        {t('action.createRadioStation', { postProcess: 'sentenceCase' })}
                    </Button>
                </Group>
            )}
        </Flex>
    );
};
