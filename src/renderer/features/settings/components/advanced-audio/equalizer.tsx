import { Grid, SelectItem } from '@mantine/core';
import { EqualizerSlider } from '/@/renderer/features/settings/components/advanced-audio/eqalizer-slider';
import { useAudioSettings, useSettingsStoreActions } from '/@/renderer/store';
import isElectron from 'is-electron';
import { useCallback } from 'react';
import { Button, Select } from '/@/renderer/components';
import { AudioFrequencies, Octave, bandsToAudioFilter } from '/@/renderer/utils';
import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';

const mpvPlayer = isElectron() ? window.electron.mpvPlayer : null;

const POSSIBLE_OCTAVES: SelectItem[] = [
    {
        label: 'Full octave',
        value: Octave.Full,
    },
    {
        label: 'Third octave',
        value: Octave.Third,
    },
];

export const Equalizer = () => {
    const settings = useAudioSettings();
    const { setSettings } = useSettingsStoreActions();

    const setOctave = useCallback(
        (octave: Octave) => {
            setSettings({
                audio: {
                    ...settings,
                    octave,
                },
            });

            if (mpvPlayer) {
                mpvPlayer.setProperties({
                    af: bandsToAudioFilter(settings.bands, octave),
                });
            }
        },
        [setSettings, settings],
    );

    const setBandSetting = useCallback(
        (gain: number, index: number) => {
            const bands = [...settings.bands];
            bands[index].gain = gain;

            setSettings({
                audio: {
                    ...settings,
                    bands,
                },
            });

            if (mpvPlayer) {
                mpvPlayer.setProperties({
                    af: bandsToAudioFilter(bands, settings.octave),
                });
            }
        },
        [setSettings, settings],
    );

    const resetBand = useCallback(() => {
        const bands = AudioFrequencies.map((frequency) => ({
            frequency,
            gain: 0,
        }));

        setSettings({
            audio: {
                ...settings,
                bands,
            },
        });

        if (mpvPlayer) {
            mpvPlayer.setProperties({
                af: bandsToAudioFilter(bands, settings.octave),
            });
        }
    }, [setSettings, settings]);

    const options: SettingOption[] = [
        {
            control: (
                <Select
                    data={POSSIBLE_OCTAVES}
                    value={settings.octave}
                    onChange={setOctave}
                />
            ),
            description: 'Specifies the width (in octaves) of the filter',
            title: 'Filter width',
        },
        {
            control: (
                <Button
                    compact
                    variant="filled"
                    onClick={() => resetBand()}
                >
                    Reset to default
                </Button>
            ),
            description: 'Rest audio bands to 0',
            title: 'Audio Equalizations',
        },
    ];

    return (
        <>
            <SettingsSection options={options} />
            <Grid
                columns={AudioFrequencies.length}
                gutter={20}
                justify="center"
            >
                {settings.bands.map((band, idx) => (
                    <Grid.Col
                        key={band.frequency}
                        span="auto"
                    >
                        <EqualizerSlider
                            title={`${band.frequency} Hz`}
                            value={band.gain}
                            onChange={(gain) => setBandSetting(gain, idx)}
                        />
                    </Grid.Col>
                ))}
            </Grid>
        </>
    );
};
