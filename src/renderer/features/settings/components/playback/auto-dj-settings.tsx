import { useTranslation } from 'react-i18next';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { useAutoDJSettings, useSettingsStoreActions } from '/@/renderer/store/settings.store';
import { NumberInput } from '/@/shared/components/number-input/number-input';

export const AutoDJSettings = () => {
    const { t } = useTranslation();
    const settings = useAutoDJSettings();
    const { setSettings } = useSettingsStoreActions();

    const autoDJOptions: SettingOption[] = [
        {
            control: (
                <NumberInput
                    aria-label="Auto DJ item count"
                    hideControls={false}
                    max={50}
                    min={1}
                    onChange={(e) => {
                        setSettings({
                            autoDJ: {
                                ...settings,
                                itemCount: Number(e),
                            },
                        });
                    }}
                    value={Number(settings.itemCount)}
                />
            ),
            description: t('setting.autoDJ_itemCount', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            title: t('setting.autoDJ_itemCount', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <NumberInput
                    aria-label="Auto DJ timing"
                    hideControls={false}
                    max={5}
                    min={1}
                    onChange={(e) => {
                        setSettings({
                            autoDJ: {
                                ...settings,
                                timing: Number(e),
                            },
                        });
                    }}
                    value={Number(settings.timing)}
                />
            ),
            description: t('setting.autoDJ_timing', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            title: t('setting.autoDJ_timing', { postProcess: 'sentenceCase' }),
        },
    ];

    return (
        <SettingsSection
            options={autoDJOptions}
            title={t('setting.autoDJ', { postProcess: 'titleCase' })}
        />
    );
};
