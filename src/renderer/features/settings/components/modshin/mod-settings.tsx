import { useModshinSettings, useSettingsStoreActions } from '../../../../store/settings.store';
import {
    SettingsSection,
    SettingOption,
} from '/@/renderer/features/settings/components/settings-section';
import { useTranslation } from 'react-i18next';
import { Select, Switch, toast, NumberInput } from '/@/renderer/components';

export const ModSettings = () => {
    // Define your settings here
    const { t } = useTranslation();
    const settings = useModshinSettings();
    const { setSettings } = useSettingsStoreActions();

    // Define your options here
    const modshinOptions = [
        {
            control: (
                <Switch
                    defaultChecked={settings.autoPlay}
                    onChange={(e) => {
                        if (!e) return;
                        setSettings({
                            modshin: {
                                ...settings,
                                autoPlay: e.currentTarget.checked,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.autoPlay', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            title: t('setting.autoPlay', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Switch
                    defaultChecked={settings.lyricAnimations}
                    onChange={(e) => {
                        if (!e) return;
                        setSettings({
                            modshin: {
                                ...settings,
                                lyricAnimations: e.currentTarget.checked,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.lyricAnimations', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            title: t('setting.lyricAnimations', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <NumberInput
                    defaultValue={settings.historyLength}
                    onBlur={(e) => {
                        setSettings({
                            modshin: {
                                ...settings,
                                historyLength: parseInt(e.currentTarget.value, 10),
                            },
                        });
                    }}
                />
            ),
            description: t('setting.historyLength', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            title: t('setting.historyLength', { postProcess: 'sentenceCase' }),
        },
        // Add more options as needed
    ];

    return <SettingsSection options={modshinOptions} />;
};
