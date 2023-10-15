import { Grid } from '@mantine/core';
import { EqualizerSlider } from '/@/renderer/features/settings/components/advanced-audio/eqalizer-slider';
import { AudioFrequencies, useAudioSettings, useSettingsStoreActions } from '/@/renderer/store';
import isElectron from 'is-electron';
import { useCallback } from 'react';
import { SettingsOptions } from '/@/renderer/features/settings/components/settings-option';
import { Button } from '/@/renderer/components';
import { bandsToAudioFilter } from '/@/renderer/utils';

const mpvPlayer = isElectron() ? window.electron.mpvPlayer : null;

export const Equalizer = () => {
    const settings = useAudioSettings();
    const { setSettings } = useSettingsStoreActions();

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
                    af: bandsToAudioFilter(bands),
                });
            }
        },
        [setSettings, settings],
    );

    const resetBand = useCallback(() => {
        const bands = AudioFrequencies.map((info) => ({
            ...info,
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
                af: bandsToAudioFilter(bands),
            });
        }
    }, [setSettings, settings]);

    return (
        <>
            <SettingsOptions
                control={
                    <Button
                        compact
                        variant="filled"
                        onClick={() => resetBand()}
                    >
                        Reset to default
                    </Button>
                }
                title="Audio Equalization"
            />
            <Grid
                columns={AudioFrequencies.length}
                gutter={20}
                justify="center"
            >
                {settings.bands.map((band, idx) => (
                    <Grid.Col
                        key={band.frequency}
                        lg={2}
                        sm={3}
                        span={4}
                        xl={1}
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
