import isElectron from 'is-electron';
import { NumberInput, Slider, Switch, Text } from '/@/renderer/components';
import { usePlaybackSettings, useSettingsStoreActions } from '/@/renderer/store/settings.store';
import { SettingOption, SettingsSection } from '../settings-section';

export const ScrobbleSettings = () => {
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
            description: 'Enable or disable scrobbling to your media server',
            isHidden: !isElectron(),
            title: 'Scrobble',
        },
        {
            control: (
                <Slider
                    aria-label="Scrobble percentage"
                    defaultValue={settings.scrobble.scrobbleAtPercentage}
                    label={`${settings.scrobble.scrobbleAtPercentage}%`}
                    max={90}
                    min={25}
                    w={100}
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
                />
            ),
            description:
                'The percentage of the song that must be played before submitting a scrobble',
            isHidden: !isElectron(),
            title: 'Minimum scrobble percentage*',
        },
        {
            control: (
                <NumberInput
                    aria-label="Scrobble duration in seconds"
                    defaultValue={settings.scrobble.scrobbleAtDuration}
                    max={1200}
                    min={0}
                    width={75}
                    onChange={(e) => {
                        if (e === '') return;
                        setSettings({
                            playback: {
                                ...settings,
                                scrobble: {
                                    ...settings.scrobble,
                                    scrobbleAtDuration: e,
                                },
                            },
                        });
                    }}
                />
            ),
            description:
                'The duration in seconds of a song that must be played before submitting a scrobble',
            isHidden: !isElectron(),
            title: 'Minimum scrobble duration (seconds)*',
        },
    ];

    return (
        <>
            <SettingsSection options={scrobbleOptions} />
            <Text
                $secondary
                size="sm"
            >
                *The scrobble will be submitted if one or more of the above conditions is met
            </Text>
        </>
    );
};
