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

    const clearCookies = useCallback(async () => {
        setIsClearing(true);

        try {
            if (browser) {
                await browser.clearCookies();
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
    }, [t]);

    const openResetConfirmModal = (type: 'cookies' | 'full' | 'query') => {
        let key = 'clearQueryCache';
        let onConfirm = () => clearCache(false);

        if (type === 'full') {
            key = 'clearCache';
            onConfirm = () => clearCache(true);
        } else if (type === 'cookies') {
            key = 'clearCookies';
            onConfirm = clearCookies;
        }

        openModal({
            children: (
                <ConfirmModal onConfirm={onConfirm}>
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
                    disabled={isClearing}
                    onClick={() => openResetConfirmModal('query')}
                    size="compact-md"
                    variant="filled"
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
                    disabled={isClearing}
                    onClick={() => openResetConfirmModal('full')}
                    size="compact-md"
                    variant="filled"
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
        {
            control: (
                <Button
                    disabled={isClearing}
                    onClick={() => openResetConfirmModal('cookies')}
                    size="compact-md"
                    variant="filled"
                >
                    {t('common.clear', { postProcess: 'sentenceCase' })}
                </Button>
            ),
            description: t('setting.clearCookies', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !browser,
            title: t('setting.clearCookies', { postProcess: 'sentenceCase' }),
        },
    ];

    const handleOpenApplicationDirectory = async () => {
        if (isElectron() && window.api?.utils) {
            await window.api.utils.openApplicationDirectory();
        }
    };

    return (
        <>
            <SettingsSection
                options={options}
                title={t('page.setting.cache', { postProcess: 'sentenceCase' })}
            />
            {isElectron() && (
                <Button onClick={handleOpenApplicationDirectory} variant="default">
                    {t('action.openApplicationDirectory', {
                        postProcess: 'sentenceCase',
                    })}
                </Button>
            )}
        </>
    );
});
