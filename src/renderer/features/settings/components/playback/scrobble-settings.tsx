import { useTranslation } from 'react-i18next';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { usePlaybackSettings, useSettingsStoreActions } from '/@/renderer/store/settings.store';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { Slider } from '/@/shared/components/slider/slider';
import { Switch } from '/@/shared/components/switch/switch';

export const ScrobbleSettings = () => {
    const { t } = useTranslation();
    const settings = usePlaybackSettings();
    const { setSettings } = useSettingsStoreActions();

    const scrobbleOptions: SettingOption[] = [
        {
            control: (
                <Switch
                    aria-label="Toggle scrobble"
                    defaultChecked={settings.scrobble.enabled}
                    onChange={(e) => {
                        setSettings({
                            playback: {
                                ...settings,
                                scrobble: {
                                    ...settings.scrobble,
                                    enabled: e.currentTarget.checked,
                                },
                            },
                        });
                    }}
                />
            ),
            description: t('setting.scrobble', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            title: t('setting.scrobble', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Slider
                    aria-label="Scrobble percentage"
                    defaultValue={settings.scrobble.scrobbleAtPercentage}
                    label={`${settings.scrobble.scrobbleAtPercentage}%`}
                    max={90}
                    min={25}
                    onChange={(e) => {
                        setSettings({
                            playback: {
                                ...settings,
                                scrobble: {
                                    ...settings.scrobble,
                                    scrobbleAtPercentage: e,
                                },
                            },
                        });
                    }}
                    w={100}
                />
            ),
            description: t('setting.minimumScrobblePercentage', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            title: t('setting.minimumScrobblePercentage', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <NumberInput
                    aria-label="Scrobble duration in seconds"
                    defaultValue={settings.scrobble.scrobbleAtDuration}
                    max={1200}
                    min={0}
                    onChange={(e) => {
                        if (e === '') return;
                        setSettings({
                            playback: {
                                ...settings,
                                scrobble: {
                                    ...settings.scrobble,
                                    scrobbleAtDuration: Number(e),
                                },
                            },
                        });
                    }}
                    width={75}
                />
            ),
            description: t('setting.minimumScrobbleSeconds', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            title: t('setting.minimumScrobbleSeconds', { postProcess: 'sentenceCase' }),
        },
    ];

    return <SettingsSection options={scrobbleOptions} />;
};
