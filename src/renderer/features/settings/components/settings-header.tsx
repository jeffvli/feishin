import { closeAllModals, openModal } from '@mantine/modals';
import { useTranslation } from 'react-i18next';
import { RiSettings2Fill } from 'react-icons/ri';

import { PageHeader } from '/@/renderer/components/page-header/page-header';
import { useSettingSearchContext } from '/@/renderer/features/settings/context/search-context';
import { LibraryHeaderBar } from '/@/renderer/features/shared';
import { SearchInput } from '/@/renderer/features/shared/components/search-input';
import { useContainerQuery } from '/@/renderer/hooks';
import { useSettingsStoreActions } from '/@/renderer/store/settings.store';
import { Button } from '/@/shared/components/button/button';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { ConfirmModal } from '/@/shared/components/modal/modal';

export type SettingsHeaderProps = {
    setSearch: (search: string) => void;
};

export const SettingsHeader = ({ setSearch }: SettingsHeaderProps) => {
    const { t } = useTranslation();
    const { reset } = useSettingsStoreActions();
    const search = useSettingSearchContext();
    const cq = useContainerQuery();

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
        <Flex ref={cq.ref}>
            <PageHeader>
                <LibraryHeaderBar>
                    <Flex
                        align="center"
                        justify="space-between"
                        w="100%"
                    >
                        <Group wrap="nowrap">
                            <RiSettings2Fill size="2rem" />
                            <LibraryHeaderBar.Title>
                                {t('common.setting', { count: 2, postProcess: 'titleCase' })}
                            </LibraryHeaderBar.Title>
                        </Group>
                        <Group>
                            <SearchInput
                                defaultValue={search}
                                onChange={(event) =>
                                    setSearch(event.target.value.toLocaleLowerCase())
                                }
                            />
                            <Button
                                onClick={openResetConfirmModal}
                                size="compact-sm"
                                variant="default"
                            >
                                {t('common.resetToDefault', { postProcess: 'sentenceCase' })}
                            </Button>
                        </Group>
                    </Flex>
                </LibraryHeaderBar>
            </PageHeader>
        </Flex>
    );
};
