import { closeAllModals, openModal } from '@mantine/modals';
import { useQueryClient } from '@tanstack/react-query';
import isElectron from 'is-electron';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { useGeneralSettings, useSettingsStoreActions } from '/@/renderer/store/settings.store';
import { Button } from '/@/shared/components/button/button';
import { ConfirmModal } from '/@/shared/components/modal/modal';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { Switch } from '/@/shared/components/switch/switch';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';

const browser = isElectron() ? window.api.browser : null;

export const CacheSettings = memo(() => {
    const [isClearing, setIsClearing] = useState(false);
    const [cacheStats, setCacheStats] = useState<null | {
        entryCount: number;
        totalSizeBytes: number;
    }>(null);
    const queryClient = useQueryClient();
    const { t } = useTranslation();
    const settings = useGeneralSettings();
    const { setSettings } = useSettingsStoreActions();

    const refreshCacheStats = useCallback(async () => {
        if (browser) {
            try {
                const stats = await browser.getImageCacheStats();
                setCacheStats(stats);
            } catch {
                // Ignore
            }
        }
    }, []);

    useEffect(() => {
        refreshCacheStats();
    }, [refreshCacheStats]);

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

    const clearImageCache = useCallback(async () => {
        if (browser) {
            try {
                await browser.clearImageCache();
                await refreshCacheStats();
                toast.success({
                    message: t('setting.clearImageCacheSuccess', { postProcess: 'sentenceCase' }),
                });
            } catch (error) {
                console.error(error);
                toast.error({ message: (error as Error).message });
            }
        }
        closeAllModals();
    }, [refreshCacheStats, t]);

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

    const openImageCacheClearModal = () => {
        openModal({
            children: (
                <ConfirmModal onConfirm={clearImageCache}>
                    {t(`common.areYouSure`, { postProcess: 'sentenceCase' })}
                </ConfirmModal>
            ),
            title: t('setting.clearImageCache', { postProcess: 'sentenceCase' }),
        });
    };

    const updateImageCacheSetting = useCallback(
        (key: string, value: boolean | number) => {
            setSettings({
                general: {
                    ...settings,
                    [key]: value,
                },
            });

            if (browser) {
                const configMap: Record<string, string> = {
                    imageCacheEnabled: 'enabled',
                    imageCacheMaxSizeMB: 'maxSizeMB',
                    imageRateLimitBurst: 'rateLimitBurst',
                    imageRateLimitMaxConcurrent: 'rateLimitMaxConcurrent',
                    imageRateLimitRefillPerSec: 'rateLimitRefillPerSec',
                };
                const configKey = configMap[key];
                if (configKey) {
                    browser.updateImageCacheConfig({ [configKey]: value });
                }
            }
        },
        [setSettings, settings],
    );

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

    const imageCacheOptions: SettingOption[] = [
        {
            control: (
                <Switch
                    defaultChecked={settings.imageCacheEnabled}
                    onChange={(e) => {
                        updateImageCacheSetting('imageCacheEnabled', e.currentTarget.checked);
                    }}
                />
            ),
            description: t('setting.imageCacheEnabled', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            title: t('setting.imageCacheEnabled', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <NumberInput
                    defaultValue={settings.imageCacheMaxSizeMB}
                    min={0}
                    onBlur={(e) => {
                        const value = Number(e.currentTarget.value);
                        if (!Number.isNaN(value) && value >= 0) {
                            updateImageCacheSetting('imageCacheMaxSizeMB', value);
                        }
                    }}
                    width={100}
                />
            ),
            description: t('setting.imageCacheMaxSizeMB', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            title: t('setting.imageCacheMaxSizeMB', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Button onClick={openImageCacheClearModal} size="compact-md" variant="filled">
                    {t('common.clear', { postProcess: 'sentenceCase' })}
                </Button>
            ),
            description: cacheStats
                ? `${cacheStats.entryCount} items, ${(cacheStats.totalSizeBytes / (1024 * 1024)).toFixed(1)} MB`
                : t('setting.clearImageCache', {
                      context: 'description',
                      postProcess: 'sentenceCase',
                  }),
            isHidden: !browser,
            title: t('setting.clearImageCache', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <NumberInput
                    defaultValue={settings.imageRateLimitBurst}
                    min={1}
                    onBlur={(e) => {
                        const value = Number(e.currentTarget.value);
                        if (!Number.isNaN(value) && value >= 1) {
                            updateImageCacheSetting('imageRateLimitBurst', value);
                        }
                    }}
                    width={80}
                />
            ),
            description: t('setting.imageRateLimitBurst', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            title: t('setting.imageRateLimitBurst', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <NumberInput
                    defaultValue={settings.imageRateLimitRefillPerSec}
                    min={1}
                    onBlur={(e) => {
                        const value = Number(e.currentTarget.value);
                        if (!Number.isNaN(value) && value >= 1) {
                            updateImageCacheSetting('imageRateLimitRefillPerSec', value);
                        }
                    }}
                    width={80}
                />
            ),
            description: t('setting.imageRateLimitRefillPerSec', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            title: t('setting.imageRateLimitRefillPerSec', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <NumberInput
                    defaultValue={settings.imageRateLimitMaxConcurrent}
                    min={1}
                    onBlur={(e) => {
                        const value = Number(e.currentTarget.value);
                        if (!Number.isNaN(value) && value >= 1) {
                            updateImageCacheSetting('imageRateLimitMaxConcurrent', value);
                        }
                    }}
                    width={80}
                />
            ),
            description: t('setting.imageRateLimitMaxConcurrent', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            title: t('setting.imageRateLimitMaxConcurrent', { postProcess: 'sentenceCase' }),
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
            {browser && (
                <SettingsSection options={imageCacheOptions} title={t('setting.imageCacheStats')} />
            )}
            {cacheStats && browser && (
                <Text isMuted isNoSelect size="sm">
                    {cacheStats.entryCount} cached images,{' '}
                    {(cacheStats.totalSizeBytes / (1024 * 1024)).toFixed(1)} MB used
                </Text>
            )}
            {isElectron() && (
                <Button onClick={handleOpenApplicationDirectory} variant="default">
                    {t('action.openApplicationDirectory')}
                </Button>
            )}
        </>
    );
});
