import { closeAllModals, openModal } from '@mantine/modals';
import { useQueryClient } from '@tanstack/react-query';
import isElectron from 'is-electron';
import { useTranslation } from 'react-i18next';
import { Button, ConfirmModal, toast } from '/@/renderer/components';
import { useCallback, useState } from 'react';
import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';

const browser = isElectron() ? window.electron.browser : null;

export const CacheSettings = () => {
    const [isClearing, setIsClearing] = useState(false);
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    const clearCache = useCallback(
        async (full: boolean) => {
            setIsClearing(true);

            try {
                queryClient.clear();

                if (full && browser) {
                    await browser.clearCache();
                }

                toast.success({
                    message: t('setting.clearCacheSuccess', { postProcess: 'sentenceCase' }),
                });
            } catch (error) {
                console.error(error);
                toast.error({ message: (error as Error).message });
            }

            setIsClearing(false);
            closeAllModals();
        },
        [queryClient, t],
    );

    const openResetConfirmModal = (full: boolean) => {
        const key = full ? 'clearCache' : 'clearQueryCache';
        openModal({
            children: (
                <ConfirmModal onConfirm={() => clearCache(full)}>
                    {t(`common.areYouSure`, { postProcess: 'sentenceCase' })}
                </ConfirmModal>
            ),
            title: t(`setting.${key}`, { postProcess: 'sentenceCase' }),
        });
    };

    const options: SettingOption[] = [
        {
            control: (
                <Button
                    compact
                    disabled={isClearing}
                    variant="filled"
                    onClick={() => openResetConfirmModal(false)}
                >
                    {t('common.clear', { postProcess: 'sentenceCase' })}
                </Button>
            ),
            description: t('setting.clearQueryCache', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            title: t('setting.clearQueryCache', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Button
                    compact
                    disabled={isClearing}
                    variant="filled"
                    onClick={() => openResetConfirmModal(true)}
                >
                    {t('common.clear', { postProcess: 'sentenceCase' })}
                </Button>
            ),
            description: t('setting.clearCache', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !browser,
            title: t('setting.clearCache', { postProcess: 'sentenceCase' }),
        },
    ];

    return (
        <SettingsSection
            divider={false}
            options={options}
        />
    );
};
