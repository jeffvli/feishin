import { closeAllModals, openModal } from '@mantine/modals';
import { useTranslation } from 'react-i18next';

import { UpdateAvailableButton } from '/@/renderer/features/settings/components/update-available-button';
import { useSettingSearchStore } from '/@/renderer/features/settings/store/search.store';
import { LibraryHeaderBar } from '/@/renderer/features/shared/components/library-header-bar';
import { SearchInput } from '/@/renderer/features/shared/components/search-input';
import { useSettingsStoreActions } from '/@/renderer/store/settings.store';
import { Button } from '/@/shared/components/button/button';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { ConfirmModal } from '/@/shared/components/modal/modal';
import { Text } from '/@/shared/components/text/text';

export type SettingsHeaderProps = {
    showUpdateAvailable?: boolean;
};

export const SettingsHeader = ({ showUpdateAvailable }: SettingsHeaderProps) => {
    const { t } = useTranslation();
    const { reset } = useSettingsStoreActions();
    const { search, setSearch } = useSettingSearchStore();

    const handleResetToDefault = () => {
        reset();
        closeAllModals();
    };

    const openResetConfirmModal = () => {
        openModal({
            children: (
                <ConfirmModal onConfirm={handleResetToDefault}>
                    <Text>{t('common.areYouSure')}</Text>
                </ConfirmModal>
            ),
            title: t('common.resetToDefault'),
        });
    };

    return (
        <LibraryHeaderBar>
            <Flex align="center" justify="space-between" w="100%">
                <LibraryHeaderBar.Title>{t('common.setting', { count: 2 })}</LibraryHeaderBar.Title>
                <Group pr="2rem">
                    {showUpdateAvailable && <UpdateAvailableButton />}
                    <SearchInput
                        defaultValue={search}
                        onChange={(event) => setSearch(event.target.value.toLocaleLowerCase())}
                    />
                    <Button onClick={openResetConfirmModal} variant="default">
                        {t('common.resetToDefault')}
                    </Button>
                </Group>
            </Flex>
        </LibraryHeaderBar>
    );
};
