import { ConstructorOptions } from 'audiomotion-analyzer';
import { useRef } from 'react';

import styles from './visualizer-settings-form.module.css';

import { useSettingsStoreActions, useVisualizerSettings } from '/@/renderer/store/settings.store';
import { Button } from '/@/shared/components/button/button';
import { Fieldset } from '/@/shared/components/fieldset/fieldset';
import { Group } from '/@/shared/components/group/group';
import { Select, SelectProps } from '/@/shared/components/select/select';
import { Slider, SliderProps } from '/@/shared/components/slider/slider';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';

const modeOptions: { label: string; value: ConstructorOptions['mode'] | string }[] = [
    { label: '[0] Bars', value: '0' },
    { label: '[1] Circle', value: '1' },
    { label: '[2] Wave', value: '2' },
    { label: '[3] Rainbow', value: '3' },
    { label: '[4] Rings', value: '4' },
    { label: '[5] Mirror', value: '5' },
    { label: '[6] Line', value: '6' },
    { label: '[7] Particles', value: '7' },
    { label: '[8] Full octave / 10 bands', value: '8' },
    { label: '[10] Outline bars', value: '10' },
];

const colorModeOptions: { label: string; value: ConstructorOptions['colorMode'] }[] = [
    { label: 'Gradient', value: 'gradient' },
    { label: 'Bar-Index', value: 'bar-index' },
    { label: 'Bar-Level', value: 'bar-level' },
];

const gradientOptions: { label: string; value: ConstructorOptions['gradient'] }[] = [
    { label: 'Classic', value: 'classic' },
    { label: 'Prism', value: 'prism' },
    { label: 'Rainbow', value: 'rainbow' },
    { label: 'Steelblue', value: 'steelblue' },
    { label: 'Orangered', value: 'orangered' },
];

const channelLayoutOptions: { label: string; value: ConstructorOptions['channelLayout'] }[] = [
    { label: 'Single', value: 'single' },
    { label: 'Dual-Combined', value: 'dual-combined' },
    { label: 'Dual-Horizontal', value: 'dual-horizontal' },
    { label: 'Dual-Vertical', value: 'dual-vertical' },
];

const fftSizeOptions: { label: string; value: ConstructorOptions['fftSize'] | string }[] = [
    { label: '1024', value: '1024' },
    { label: '2048', value: '2048' },
    { label: '4096', value: '4096' },
    { label: '8192', value: '8192' },
    { label: '16384', value: '16384' },
    { label: '32768', value: '32768' },
];

const frequencyScaleOptions: { label: string; value: ConstructorOptions['frequencyScale'] }[] = [
    { label: 'Bark', value: 'bark' },
    { label: 'Linear', value: 'linear' },
    { label: 'Log', value: 'log' },
    { label: 'Mel', value: 'mel' },
];

const weightingFilterOptions = [
    { label: 'None', value: '' },
    { label: 'A', value: 'A' },
    { label: 'B', value: 'B' },
    { label: 'C', value: 'C' },
    { label: 'D', value: 'D' },
    { label: 'Z', value: 'Z' },
];

const minFreqOptions = [
    { label: '20', value: '20' },
    { label: '30', value: '30' },
    { label: '40', value: '40' },
    { label: '50', value: '50' },
];

const maxFreqOptions = [
    { label: '8000', value: '8000' },
    { label: '10000', value: '10000' },
    { label: '15000', value: '15000' },
    { label: '20000', value: '20000' },
    { label: '22050', value: '22050' },
];

const barSpaceOptions = [
    { label: '0', value: '0' },
    { label: '0.1', value: '0.1' },
    { label: '0.25', value: '0.2' },
    { label: '0.4', value: '0.4' },
    { label: '0.5', value: '0.5' },
    { label: '0.75', value: '0.7' },
    { label: '1.0', value: '1.0' },
];

export const VisualizerSettingsForm = () => {
    return (
        <div className={styles.container}>
            <GeneralSettings />
            <ColorSettings />
            <FFTSettings />
            <FrequencySettings />
            <SensitivitySettings />
            <LinearAmplitudeSettings />
            <PeakBehaviorSettings />
            <RadialSpectrumSettings />
            <ReflexMirrorSettings />
            <ToggleSettings />
        </div>
    );
};

const VisualizerSelect = (props: SelectProps) => {
    return <Select styles={{ label: { display: 'flex', justifyContent: 'center' } }} {...props} />;
};

const VisualizerSlider = (props: SliderProps) => {
    const { label, ...rest } = props;

    const sliderRef = useRef<HTMLDivElement>(null);

    return (
        <Stack>
            <Text fw="500" size="sm" ta="center">
                {label as string}
            </Text>
            <Slider
                ref={sliderRef}
                styles={{
                    root: { alignSelf: 'center', display: 'flex' },
                }}
                w="100px"
                {...rest}
            />
        </Stack>
    );
};

const VisualizerToggle = (props: {
    label: string;
    onChange: (value: boolean) => void;
    value: boolean;
}) => {
    const { label, onChange, value } = props;

    return (
        <Button onClick={() => onChange(!value)} variant={value ? 'filled' : 'default'}>
            {label}
        </Button>
    );
};

const GeneralSettings = () => {
    const visualizer = useVisualizerSettings();
    const { setSettings } = useSettingsStoreActions();

    return (
        <Fieldset legend="General">
            <Stack>
                <Group grow>
                    <VisualizerSelect
                        data={modeOptions.map((option) => ({
                            label: option.label,
                            value: option.value as string,
                        }))}
                        defaultValue={visualizer.audiomotionanalyzer.mode.toString()}
                        label="Mode"
                        onChange={(e) =>
                            setSettings({
                                visualizer: {
                                    ...visualizer,
                                    audiomotionanalyzer: {
                                        ...visualizer.audiomotionanalyzer,
                                        mode: Number(e),
                                    },
                                },
                            })
                        }
                    />
                </Group>
                <div
                    style={{
                        display: 'flex',
                        gap: 'var(--theme-spacing-md)',
                    }}
                >
                    <Fieldset legend="Mode 1 - 8" style={{ flex: 1, flexGrow: 1 }}>
                        <Group grow>
                            <VisualizerSelect
                                data={barSpaceOptions.map((option) => ({
                                    label: option.label,
                                    value: option.value,
                                }))}
                                defaultValue={visualizer.audiomotionanalyzer.barSpace.toString()}
                                label="Bar Space"
                                onChange={(e) =>
                                    setSettings({
                                        visualizer: {
                                            ...visualizer,
                                            audiomotionanalyzer: {
                                                ...visualizer.audiomotionanalyzer,
                                                mode: Number(e),
                                            },
                                        },
                                    })
                                }
                            />
                        </Group>
                    </Fieldset>
                    <Fieldset legend="Mode 10" style={{ flex: 1, flexGrow: 1 }}>
                        <Group grow>
                            <VisualizerSlider
                                defaultValue={visualizer.audiomotionanalyzer.lineWidth}
                                label="Line Width"
                                max={4}
                                min={0}
                                onChangeEnd={(e) =>
                                    setSettings({
                                        visualizer: {
                                            ...visualizer,
                                            audiomotionanalyzer: {
                                                ...visualizer.audiomotionanalyzer,
                                                lineWidth: e,
                                            },
                                        },
                                    })
                                }
                                step={0.1}
                            />
                            <VisualizerSlider
                                defaultValue={visualizer.audiomotionanalyzer.lineWidth}
                                label="Fill Alpha"
                                max={1}
                                min={0}
                                onChangeEnd={(e) =>
                                    setSettings({
                                        visualizer: {
                                            ...visualizer,
                                            audiomotionanalyzer: {
                                                ...visualizer.audiomotionanalyzer,
                                                fillAlpha: e,
                                            },
                                        },
                                    })
                                }
                                step={0.1}
                            />
                        </Group>
                    </Fieldset>
                </div>

                <Group grow>
                    <VisualizerSelect
                        data={channelLayoutOptions.map((option) => ({
                            label: option.label,
                            value: option.value as string,
                        }))}
                        defaultValue={visualizer.audiomotionanalyzer.channelLayout}
                        label="Channel Layout"
                        onChange={(e) =>
                            setSettings({
                                visualizer: {
                                    ...visualizer,
                                    audiomotionanalyzer: {
                                        ...visualizer.audiomotionanalyzer,
                                        channelLayout: e as
                                            | 'dual-combined'
                                            | 'dual-horizontal'
                                            | 'dual-vertical'
                                            | 'single',
                                    },
                                },
                            })
                        }
                    />
                </Group>
            </Stack>
        </Fieldset>
    );
};

const ColorSettings = () => {
    const visualizer = useVisualizerSettings();
    const { setSettings } = useSettingsStoreActions();

    return (
        <Fieldset legend="Colors">
            <Stack>
                <Group grow>
                    <VisualizerSelect
                        data={colorModeOptions.map((option) => ({
                            label: option.label,
                            value: option.value as string,
                        }))}
                        defaultValue={visualizer.audiomotionanalyzer.colorMode}
                        label="Color Mode"
                        onChange={(e) =>
                            setSettings({
                                visualizer: {
                                    ...visualizer,
                                    audiomotionanalyzer: {
                                        ...visualizer.audiomotionanalyzer,
                                        colorMode: (e || 'gradient') as
                                            | 'bar-index'
                                            | 'bar-level'
                                            | 'gradient',
                                    },
                                },
                            })
                        }
                    />
                    <VisualizerSelect
                        data={gradientOptions.map((option) => ({
                            label: option.label,
                            value: option.value as string,
                        }))}
                        defaultValue={visualizer.audiomotionanalyzer.gradient}
                        label="Gradient"
                        onChange={(e) =>
                            setSettings({
                                visualizer: {
                                    ...visualizer,
                                    audiomotionanalyzer: {
                                        ...visualizer.audiomotionanalyzer,
                                        gradient: e || 'classic',
                                    },
                                },
                            })
                        }
                    />
                </Group>
                <Group grow>
                    <VisualizerSelect
                        data={gradientOptions.map((option) => ({
                            label: option.label,
                            value: option.value as string,
                        }))}
                        defaultValue={visualizer.audiomotionanalyzer.gradientLeft}
                        label="Gradient Left"
                        onChange={(e) =>
                            setSettings({
                                visualizer: {
                                    ...visualizer,
                                    audiomotionanalyzer: {
                                        ...visualizer.audiomotionanalyzer,
                                        gradientLeft: e || 'classic',
                                    },
                                },
                            })
                        }
                    />
                    <VisualizerSelect
                        data={gradientOptions.map((option) => ({
                            label: option.label,
                            value: option.value as string,
                        }))}
                        defaultValue={visualizer.audiomotionanalyzer.gradientRight}
                        label="Gradient Right"
                        onChange={(e) =>
                            setSettings({
                                visualizer: {
                                    ...visualizer,
                                    audiomotionanalyzer: {
                                        ...visualizer.audiomotionanalyzer,
                                        gradientRight: e || 'classic',
                                    },
                                },
                            })
                        }
                    />
                </Group>
            </Stack>
        </Fieldset>
    );
};

const FFTSettings = () => {
    const visualizer = useVisualizerSettings();
    const { setSettings } = useSettingsStoreActions();

    return (
        <Fieldset legend="FFT">
            <Group grow>
                <VisualizerSelect
                    data={fftSizeOptions.map((option) => ({
                        label: option.label,
                        value: option.value as string,
                    }))}
                    defaultValue={visualizer.audiomotionanalyzer.fftSize.toString()}
                    label="FFT Size"
                    onChange={(e) =>
                        setSettings({
                            visualizer: {
                                ...visualizer,
                                audiomotionanalyzer: {
                                    ...visualizer.audiomotionanalyzer,
                                    fftSize: Number(e),
                                },
                            },
                        })
                    }
                />
                <VisualizerSlider
                    defaultValue={visualizer.audiomotionanalyzer.smoothing}
                    label="Smoothing"
                    max={1}
                    min={0}
                    onChangeEnd={(e) =>
                        setSettings({
                            visualizer: {
                                ...visualizer,
                                audiomotionanalyzer: {
                                    ...visualizer.audiomotionanalyzer,
                                    smoothing: e,
                                },
                            },
                        })
                    }
                    step={0.1}
                />
            </Group>
        </Fieldset>
    );
};

const FrequencySettings = () => {
    const visualizer = useVisualizerSettings();
    const { setSettings } = useSettingsStoreActions();

    return (
        <Fieldset legend="Frequency range and scaling">
            <Group grow wrap="nowrap">
                <VisualizerSelect
                    data={minFreqOptions.map((option) => ({
                        label: option.label,
                        value: option.value as string,
                    }))}
                    defaultValue={visualizer.audiomotionanalyzer.minFreq.toString()}
                    label="Minimum Frequency"
                    onChange={(e) =>
                        setSettings({
                            visualizer: {
                                ...visualizer,
                                audiomotionanalyzer: {
                                    ...visualizer.audiomotionanalyzer,
                                    minFreq: Number(e),
                                },
                            },
                        })
                    }
                />
                <VisualizerSelect
                    data={maxFreqOptions.map((option) => ({
                        label: option.label,
                        value: option.value as string,
                    }))}
                    defaultValue={visualizer.audiomotionanalyzer.maxFreq.toString()}
                    label="Maximum Frequency"
                    onChange={(e) =>
                        setSettings({
                            visualizer: {
                                ...visualizer,
                                audiomotionanalyzer: {
                                    ...visualizer.audiomotionanalyzer,
                                    maxFreq: Number(e),
                                },
                            },
                        })
                    }
                />
                <VisualizerSelect
                    data={frequencyScaleOptions.map((option) => ({
                        label: option.label,
                        value: option.value as string,
                    }))}
                    defaultValue={visualizer.audiomotionanalyzer.frequencyScale}
                    label="Frequency Scale"
                    onChange={(e) =>
                        setSettings({
                            visualizer: {
                                ...visualizer,
                                audiomotionanalyzer: {
                                    ...visualizer.audiomotionanalyzer,
                                    frequencyScale: (e || 'log') as
                                        | 'bark'
                                        | 'linear'
                                        | 'log'
                                        | 'mel',
                                },
                            },
                        })
                    }
                />
            </Group>
        </Fieldset>
    );
};

const SensitivitySettings = () => {
    const visualizer = useVisualizerSettings();
    const { setSettings } = useSettingsStoreActions();

    return (
        <Fieldset legend="Sensitivity">
            <Group grow>
                <VisualizerSelect
                    data={weightingFilterOptions.map((option) => ({
                        label: option.label,
                        value: option.value as string,
                    }))}
                    defaultValue={visualizer.audiomotionanalyzer.weightingFilter}
                    label="Weighting Filter"
                    onChange={(e) =>
                        setSettings({
                            visualizer: {
                                ...visualizer,
                                audiomotionanalyzer: {
                                    ...visualizer.audiomotionanalyzer,
                                    weightingFilter: e as 'A' | 'B' | 'C' | 'D' | 'Z',
                                },
                            },
                        })
                    }
                />
                <VisualizerSlider
                    defaultValue={visualizer.audiomotionanalyzer.minDecibels}
                    label="Minimum Decibels"
                    max={-60}
                    min={-120}
                    onChangeEnd={(e) =>
                        setSettings({
                            visualizer: {
                                ...visualizer,
                                audiomotionanalyzer: {
                                    ...visualizer.audiomotionanalyzer,
                                    minDecibels: e,
                                },
                            },
                        })
                    }
                    step={1}
                />
                <VisualizerSlider
                    defaultValue={visualizer.audiomotionanalyzer.maxDecibels}
                    label="Maximum Decibels"
                    max={0}
                    min={-40}
                    onChangeEnd={(e) =>
                        setSettings({
                            visualizer: {
                                ...visualizer,
                                audiomotionanalyzer: {
                                    ...visualizer.audiomotionanalyzer,
                                    maxDecibels: e,
                                },
                            },
                        })
                    }
                    step={1}
                />
            </Group>
        </Fieldset>
    );
};

const LinearAmplitudeSettings = () => {
    const visualizer = useVisualizerSettings();
    const { setSettings } = useSettingsStoreActions();

    return (
        <Fieldset legend="Linear Amplitude">
            <Group grow>
                <VisualizerToggle
                    label="Linear Amplitude"
                    onChange={(value) =>
                        setSettings({
                            visualizer: {
                                ...visualizer,
                                audiomotionanalyzer: {
                                    ...visualizer.audiomotionanalyzer,
                                    linearAmplitude: value,
                                },
                            },
                        })
                    }
                    value={visualizer.audiomotionanalyzer.linearAmplitude}
                />
                <VisualizerSlider
                    defaultValue={visualizer.audiomotionanalyzer.linearBoost}
                    label="Linear Boost"
                    max={4}
                    min={1}
                    onChangeEnd={(e) =>
                        setSettings({
                            visualizer: {
                                ...visualizer,
                                audiomotionanalyzer: {
                                    ...visualizer.audiomotionanalyzer,
                                    linearBoost: e,
                                },
                            },
                        })
                    }
                    step={0.1}
                />
            </Group>
        </Fieldset>
    );
};

const PeakBehaviorSettings = () => {
    const visualizer = useVisualizerSettings();
    const { setSettings } = useSettingsStoreActions();

    return (
        <Fieldset legend="Peak Behavior">
            <Group grow>
                <VisualizerSlider
                    defaultValue={visualizer.audiomotionanalyzer.gravity}
                    label="Gravity"
                    max={20}
                    min={0.1}
                    onChangeEnd={(e) =>
                        setSettings({
                            visualizer: {
                                ...visualizer,
                                audiomotionanalyzer: {
                                    ...visualizer.audiomotionanalyzer,
                                    gravity: e,
                                },
                            },
                        })
                    }
                />
                <VisualizerSlider
                    defaultValue={visualizer.audiomotionanalyzer.peakFadeTime}
                    label="Peak Fade Time (ms)"
                    max={2000}
                    min={0}
                    onChangeEnd={(e) =>
                        setSettings({
                            visualizer: {
                                ...visualizer,
                                audiomotionanalyzer: {
                                    ...visualizer.audiomotionanalyzer,
                                    peakFadeTime: e,
                                },
                            },
                        })
                    }
                    step={1}
                />
                <VisualizerSlider
                    defaultValue={visualizer.audiomotionanalyzer.peakHoldTime}
                    label="Peak Hold Time (ms)"
                    max={1000}
                    min={0}
                    onChangeEnd={(e) =>
                        setSettings({
                            visualizer: {
                                ...visualizer,
                                audiomotionanalyzer: {
                                    ...visualizer.audiomotionanalyzer,
                                    peakHoldTime: e,
                                },
                            },
                        })
                    }
                    step={1}
                />
            </Group>
        </Fieldset>
    );
};

const RadialSpectrumSettings = () => {
    const visualizer = useVisualizerSettings();
    const { setSettings } = useSettingsStoreActions();

    return (
        <Fieldset legend="Radial Spectrum">
            <Group grow>
                <VisualizerToggle
                    label="Radial"
                    onChange={(value) =>
                        setSettings({
                            visualizer: {
                                ...visualizer,
                                audiomotionanalyzer: {
                                    ...visualizer.audiomotionanalyzer,
                                    radial: value,
                                },
                            },
                        })
                    }
                    value={visualizer.audiomotionanalyzer.radial}
                />
                <VisualizerToggle
                    label="Radial Invert"
                    onChange={(value) =>
                        setSettings({
                            visualizer: {
                                ...visualizer,
                                audiomotionanalyzer: {
                                    ...visualizer.audiomotionanalyzer,
                                    radialInvert: value,
                                },
                            },
                        })
                    }
                    value={visualizer.audiomotionanalyzer.radialInvert}
                />
                <VisualizerSlider
                    defaultValue={visualizer.audiomotionanalyzer.radius}
                    label="Radius"
                    max={1}
                    min={0}
                    onChangeEnd={(e) =>
                        setSettings({
                            visualizer: {
                                ...visualizer,
                                audiomotionanalyzer: {
                                    ...visualizer.audiomotionanalyzer,
                                    radius: e,
                                },
                            },
                        })
                    }
                    step={0.05}
                />
                <VisualizerSlider
                    defaultValue={visualizer.audiomotionanalyzer.reflexAlpha}
                    label="Reflex Alpha"
                    max={5}
                    min={-5}
                    onChangeEnd={(e) =>
                        setSettings({
                            visualizer: {
                                ...visualizer,
                                audiomotionanalyzer: {
                                    ...visualizer.audiomotionanalyzer,
                                    reflexAlpha: e,
                                },
                            },
                        })
                    }
                    step={0.1}
                />
            </Group>
        </Fieldset>
    );
};

const ReflexMirrorSettings = () => {
    const visualizer = useVisualizerSettings();
    const { setSettings } = useSettingsStoreActions();

    return (
        <Fieldset legend="Reflex Mirror">
            <Group grow>
                <VisualizerToggle
                    label="Reflex Fit"
                    onChange={(value) =>
                        setSettings({
                            visualizer: {
                                ...visualizer,
                                audiomotionanalyzer: {
                                    ...visualizer.audiomotionanalyzer,
                                    reflexFit: value,
                                },
                            },
                        })
                    }
                    value={visualizer.audiomotionanalyzer.reflexFit}
                />
                <VisualizerSlider
                    defaultValue={visualizer.audiomotionanalyzer.reflexRatio}
                    label="Reflex Ratio"
                    max={1}
                    min={0}
                    onChangeEnd={(e) =>
                        setSettings({
                            visualizer: {
                                ...visualizer,
                                audiomotionanalyzer: {
                                    ...visualizer.audiomotionanalyzer,
                                    reflexRatio: e,
                                },
                            },
                        })
                    }
                    step={0.1}
                />
                <VisualizerSlider
                    defaultValue={visualizer.audiomotionanalyzer.reflexAlpha}
                    label="Reflex Alpha"
                    max={1}
                    min={0}
                    onChangeEnd={(e) =>
                        setSettings({
                            visualizer: {
                                ...visualizer,
                                audiomotionanalyzer: {
                                    ...visualizer.audiomotionanalyzer,
                                    reflexAlpha: e,
                                },
                            },
                        })
                    }
                    step={0.05}
                />
                <VisualizerSlider
                    defaultValue={visualizer.audiomotionanalyzer.reflexBright}
                    label="Reflex Brightness"
                    max={2}
                    min={0}
                    onChangeEnd={(e) =>
                        setSettings({
                            visualizer: {
                                ...visualizer,
                                audiomotionanalyzer: {
                                    ...visualizer.audiomotionanalyzer,
                                    reflexBright: e,
                                },
                            },
                        })
                    }
                    step={0.1}
                />
                <VisualizerSlider
                    defaultValue={visualizer.audiomotionanalyzer.mirror}
                    label="Mirror"
                    max={1}
                    min={-1}
                    onChangeEnd={(e) =>
                        setSettings({
                            visualizer: {
                                ...visualizer,
                                audiomotionanalyzer: {
                                    ...visualizer.audiomotionanalyzer,
                                    mirror: e,
                                },
                            },
                        })
                    }
                    step={1}
                />
            </Group>
        </Fieldset>
    );
};

const AMA_TOGGLES = [
    { label: 'Alpha Bars', value: 'alphaBars' },
    { label: 'ANSI Bands', value: 'ansiBands' },
    { label: 'Fade Peaks', value: 'fadePeaks' },
    { label: 'LED Bars', value: 'ledBars' },
    { label: 'Lumi Bars', value: 'lumiBars' },
    { label: 'Note Labels', value: 'noteLabels' },
    { label: 'Outline Bars', value: 'outlineBars' },
    { label: 'Peak Line', value: 'peakLine' },
    { label: 'Round Bars', value: 'roundBars' },
    { label: 'Low Resolution', value: 'loRes' },
    { label: 'Split Gradient', value: 'splitGradient' },
    { label: 'True LEDs', value: 'trueLeds' },
    { label: 'Show Background Color', value: 'showBgColor' },
    { label: 'Show FPS', value: 'showFPS' },
    { label: 'Show Peaks', value: 'showPeaks' },
    { label: 'Show Scale X', value: 'showScaleX' },
    { label: 'Show Scale Y', value: 'showScaleY' },
];

const ToggleSettings = () => {
    const visualizer = useVisualizerSettings();
    const { setSettings } = useSettingsStoreActions();

    return (
        <Fieldset legend="Miscellaneous Settings">
            <Group>
                {AMA_TOGGLES.map((toggle) => (
                    <VisualizerToggle
                        key={toggle.value}
                        label={toggle.label}
                        onChange={(value) =>
                            setSettings({
                                visualizer: {
                                    ...visualizer,
                                    audiomotionanalyzer: {
                                        ...visualizer.audiomotionanalyzer,
                                        [toggle.value]: value,
                                    },
                                },
                            })
                        }
                        value={
                            visualizer.audiomotionanalyzer[
                                toggle.value as keyof typeof visualizer.audiomotionanalyzer
                            ] as boolean
                        }
                    />
                ))}
            </Group>
        </Fieldset>
    );
};
