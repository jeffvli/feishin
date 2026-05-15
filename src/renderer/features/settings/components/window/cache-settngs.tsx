import { closeAllModals, openModal } from '@mantine/modals';
import { useQueryClient } from '@tanstack/react-query';
import isElectron from 'is-electron';
import { memo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { Button } from '/@/shared/components/button/button';
import { ConfirmModal } from '/@/shared/components/modal/modal';
import { toast } from '/@/shared/components/toast/toast';

const browser = isElectron() ? window.api.browser : null;

export const CacheSettings = memo(() => {
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
                    message: t('setting.clearCacheSuccess'),
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
                    {t(`common.areYouSure`)}
                </ConfirmModal>
            ),
            title: t(`setting.${key}`),
        });
    };

    const options: SettingOption[] = [
        {
            control: (
                <Button
                    disabled={isClearing}
                    onClick={() => openResetConfirmModal(false)}
                    size="compact-md"
                    variant="filled"
                >
                    {t('common.clear')}
                </Button>
            ),
            description: t('setting.clearQueryCache', {
                context: 'description',
            }),
            title: t('setting.clearQueryCache'),
        },
        {
            control: (
                <Button
                    disabled={isClearing}
                    onClick={() => openResetConfirmModal(true)}
                    size="compact-md"
                    variant="filled"
                >
                    {t('common.clear')}
                </Button>
            ),
            description: t('setting.clearCache', {
                context: 'description',
            }),
            isHidden: !browser,
            title: t('setting.clearCache'),
        },
    ];

    const handleOpenApplicationDirectory = async () => {
        if (isElectron() && window.api?.utils) {
            await window.api.utils.openApplicationDirectory();
        }
    };

    return (
        <>
            <SettingsSection options={options} title={t('page.setting.cache')} />
            {isElectron() && (
                <Button onClick={handleOpenApplicationDirectory} variant="default">
                    {t('action.openApplicationDirectory')}
                </Button>
            )}
        </>
    );
});
