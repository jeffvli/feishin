import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { logFn, LogLevel } from '/@/renderer/utils/logger';
import { Select } from '/@/shared/components/select/select';

const DEFAULT_LOG_LEVEL: LogLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

export const LoggerSettings = memo(() => {
    const { t } = useTranslation();

    const getCurrentLogLevel = (): LogLevel => {
        const stored = localStorage.getItem('log_level');
        if (stored && ['debug', 'error', 'info', 'warn'].includes(stored)) {
            return stored as LogLevel;
        }
        return DEFAULT_LOG_LEVEL;
    };

    const handleLogLevelChange = (value: null | string) => {
        if (!value) return;

        const logLevel = value as LogLevel;
        localStorage.setItem('log_level', logLevel);

        // Update the logger dynamically
        if (logFn.updateLogLevel) {
            logFn.updateLogLevel(logLevel);
        }
    };

    const loggerOptions: SettingOption[] = [
        {
            control: (
                <Select
                    data={[
                        {
                            label: t('setting.logLevel', {
                                context: 'optionDebug',
                                postProcess: 'titleCase',
                            }),
                            value: 'debug',
                        },
                        {
                            label: t('setting.logLevel', {
                                context: 'optionInfo',
                                postProcess: 'titleCase',
                            }),
                            value: 'info',
                        },
                        {
                            label: t('setting.logLevel', {
                                context: 'optionWarn',
                                postProcess: 'titleCase',
                            }),
                            value: 'warn',
                        },
                        {
                            label: t('setting.logLevel', {
                                context: 'optionError',
                                postProcess: 'titleCase',
                            }),
                            value: 'error',
                        },
                    ]}
                    defaultValue={getCurrentLogLevel()}
                    onChange={handleLogLevelChange}
                />
            ),
            description: t('setting.logLevel', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            title: t('setting.logLevel', { postProcess: 'sentenceCase' }),
        },
    ];

    return (
        <SettingsSection
            options={loggerOptions}
            title={t('page.setting.logger', { postProcess: 'sentenceCase' })}
        />
    );
});
