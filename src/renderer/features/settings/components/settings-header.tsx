import { Flex, Group } from '@mantine/core';
import { closeAllModals, openModal } from '@mantine/modals';
import { useTranslation } from 'react-i18next';
import { RiSettings2Fill } from 'react-icons/ri';
import { Button, ConfirmModal, PageHeader } from '/@/renderer/components';
import { LibraryHeaderBar } from '/@/renderer/features/shared';
import { useSettingsStoreActions } from '../../../store/settings.store';

export const SettingsHeader = () => {
    const { t } = useTranslation();
    const { reset } = useSettingsStoreActions();

    const handleResetToDefault = () => {
        reset();
        closeAllModals();
    };

    const openResetConfirmModal = () => {
        openModal({
            children: (
                <ConfirmModal onConfirm={handleResetToDefault}>
                    {t('common.areYouSure', { postProcess: 'sentenceCase' })}
                </ConfirmModal>
            ),
            title: t('common.resetToDefault', { postProcess: 'sentenceCase' }),
        });
    };

    return (
        <Flex>
            <PageHeader>
                <LibraryHeaderBar>
                    <Flex
                        align="center"
                        justify="space-between"
                        w="100%"
                    >
                        <Group noWrap>
                            <RiSettings2Fill size="2rem" />
                            <LibraryHeaderBar.Title>
                                {t('common.setting', { count: 2, postProcess: 'titleCase' })}
                            </LibraryHeaderBar.Title>
                        </Group>
                        <Button
                            compact
                            variant="default"
                            onClick={openResetConfirmModal}
                        >
                            {t('common.resetToDefault', { postProcess: 'sentenceCase' })}
                        </Button>
                    </Flex>
                </LibraryHeaderBar>
            </PageHeader>
        </Flex>
    );
};
