import { closeAllModals, openModal } from '@mantine/modals';
import { useQueryClient } from '@tanstack/react-query';
import isElectron from 'is-electron';
import { useTranslation } from 'react-i18next';
import { Button, ConfirmModal, toast } from '/@/renderer/components';
import { SettingsOptions } from '/@/renderer/features/settings/components/settings-option';
import { useCallback, useState } from 'react';

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
            title: t(`setting.${key}`),
        });
    };

    return (
        <>
            <SettingsOptions
                control={
                    <Button
                        compact
                        disabled={isClearing}
                        variant="filled"
                        onClick={() => openResetConfirmModal(false)}
                    >
                        {t('common.clear', { postProcess: 'sentenceCase' })}
                    </Button>
                }
                description={t('setting.clearQueryCache', {
                    context: 'description',
                })}
                title={t('setting.clearQueryCache')}
            />
            {browser && (
                <SettingsOptions
                    control={
                        <Button
                            compact
                            disabled={isClearing}
                            variant="filled"
                            onClick={() => openResetConfirmModal(true)}
                        >
                            {t('common.clear', { postProcess: 'sentenceCase' })}
                        </Button>
                    }
                    description={t('setting.clearCache', {
                        context: 'description',
                    })}
                    title={t('setting.clearCache')}
                />
            )}
        </>
    );
};
