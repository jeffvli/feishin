import { ComboboxItem, ComboboxLikeRenderOptionInput } from '@mantine/core';
import isElectron from 'is-electron';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { useCurrentServer, useSettingsStore } from '/@/renderer/store';
import { logger, LogLevel, normalizeLogLevel } from '/@/renderer/utils/logger';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { Select } from '/@/shared/components/select/select';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';
import { isLocalUrl } from '/@/shared/utils/is-local-url';

const DEFAULT_LOG_LEVEL: LogLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';
const utils = isElectron() ? window.api.utils : null;

const LOG_LEVEL_DESCRIPTION_CONTEXT: Record<LogLevel, string> = {
    debug: 'optionDebugDescription',
    info: 'optionInfoDescription',
};

const LogLevelSelectOption = ({ option }: ComboboxLikeRenderOptionInput<ComboboxItem>) => {
    const { t } = useTranslation();
    const level = normalizeLogLevel(option.value);

    return (
        <Stack gap={2} style={{ flex: 1, paddingBlock: 4 }}>
            <Text fw={500}>{option.label}</Text>
            <Text isMuted size="sm">
                {t('setting.logLevel', {
                    context: LOG_LEVEL_DESCRIPTION_CONTEXT[level],
                })}
            </Text>
        </Stack>
    );
};

const getRendererSettingsForExport = (): Record<string, unknown> => {
    const state = { ...useSettingsStore.getState() } as Record<string, unknown>;
    delete state.actions;
    return state;
};

export const LoggerSettings = memo(() => {
    const { t } = useTranslation();
    const currentServer = useCurrentServer();
    const [isExporting, setIsExporting] = useState(false);

    const getCurrentLogLevel = (): LogLevel => {
        return normalizeLogLevel(localStorage.getItem('log_level') ?? DEFAULT_LOG_LEVEL);
    };

    const handleLogLevelChange = (value: null | string) => {
        if (!value) return;

        const logLevel = normalizeLogLevel(value);
        localStorage.setItem('log_level', logLevel);
        logger.updateLogLevel(logLevel);
    };

    const handleOpenLogsFolder = async () => {
        await utils?.openLogsFolder();
    };

    const handleExportDiagnostics = async () => {
        if (!utils || isExporting) {
            return;
        }

        setIsExporting(true);
        try {
            const result = await utils.exportDiagnostics({
                logLevel: localStorage.getItem('log_level'),
                rendererSettings: getRendererSettingsForExport(),
                server: currentServer
                    ? {
                          isAdmin: currentServer.isAdmin,
                          isLocalUrl: isLocalUrl(currentServer.url),
                          musicFolderId: currentServer.musicFolderId,
                          name: currentServer.name,
                          preferInstantMix: currentServer.preferInstantMix,
                          preferRemoteUrl: currentServer.preferRemoteUrl,
                          ...(currentServer.remoteUrl
                              ? {
                                    isLocalRemoteUrl: isLocalUrl(currentServer.remoteUrl),
                                    remoteUrl: '[Redacted]',
                                }
                              : {}),
                          type: currentServer.type,
                          url: '[Redacted]',
                          version: currentServer.version,
                      }
                    : null,
            });

            if (result.canceled) {
                return;
            }
        } catch (error) {
            toast.error({
                message: (error as Error).message,
            });
        } finally {
            setIsExporting(false);
        }
    };

    const loggerOptions: SettingOption[] = [
        {
            control: (
                <Stack>
                    <Select
                        data={[
                            {
                                label: t('setting.logLevel', {
                                    context: 'optionInfo',
                                }),
                                value: 'info',
                            },
                            {
                                label: t('setting.logLevel', {
                                    context: 'optionDebug',
                                }),
                                value: 'debug',
                            },
                        ]}
                        defaultValue={getCurrentLogLevel()}
                        onChange={handleLogLevelChange}
                        renderOption={LogLevelSelectOption}
                        width={240}
                    />
                    {utils && (
                        <Group gap="xs" justify="flex-end" wrap="nowrap">
                            <Button
                                loading={isExporting}
                                onClick={handleExportDiagnostics}
                                size="compact-sm"
                                variant="subtle"
                            >
                                {t('setting.exportDiagnostics')}
                            </Button>
                            <Button
                                onClick={handleOpenLogsFolder}
                                size="compact-sm"
                                variant="subtle"
                            >
                                {t('common.openFolder', { postProcess: 'titleCase' })}
                            </Button>
                        </Group>
                    )}
                </Stack>
            ),
            description: t('setting.logLevel', {
                context: 'description',
            }),
            title: t('setting.logLevel'),
        },
    ];

    return <SettingsSection options={loggerOptions} title={t('page.setting.logger')} />;
});
