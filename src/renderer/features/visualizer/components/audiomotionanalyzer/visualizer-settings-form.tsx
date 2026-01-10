import butterchurnPresets from 'butterchurn-presets';
import { nanoid } from 'nanoid';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './visualizer-settings-form.module.css';

import i18n from '/@/i18n/i18n';
import { useSettingsStoreActions, useVisualizerSettings } from '/@/renderer/store/settings.store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { Checkbox } from '/@/shared/components/checkbox/checkbox';
import { ColorInput } from '/@/shared/components/color-input/color-input';
import { Divider } from '/@/shared/components/divider/divider';
import { Fieldset } from '/@/shared/components/fieldset/fieldset';
import { Group } from '/@/shared/components/group/group';
import { MultiSelect } from '/@/shared/components/multi-select/multi-select';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { SegmentedControl } from '/@/shared/components/segmented-control/segmented-control';
import { Select, SelectProps } from '/@/shared/components/select/select';
import { Slider, SliderProps } from '/@/shared/components/slider/slider';
import { Stack } from '/@/shared/components/stack/stack';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Text } from '/@/shared/components/text/text';
import { Textarea } from '/@/shared/components/textarea/textarea';
import { toast } from '/@/shared/components/toast/toast';

const modeOptions: { label: string; value: string }[] = [
    { label: i18n.t('visualizer.options.mode.0') as string, value: '0' },
    { label: i18n.t('visualizer.options.mode.1') as string, value: '1' },
    { label: i18n.t('visualizer.options.mode.2') as string, value: '2' },
    { label: i18n.t('visualizer.options.mode.3') as string, value: '3' },
    { label: i18n.t('visualizer.options.mode.4') as string, value: '4' },
    { label: i18n.t('visualizer.options.mode.5') as string, value: '5' },
    { label: i18n.t('visualizer.options.mode.6') as string, value: '6' },
    { label: i18n.t('visualizer.options.mode.7') as string, value: '7' },
    { label: i18n.t('visualizer.options.mode.8') as string, value: '8' },
    { label: i18n.t('visualizer.options.mode.10') as string, value: '10' },
];

const colorModeOptions: { label: string; value: string }[] = [
    { label: i18n.t('visualizer.options.colorMode.gradient') as string, value: 'gradient' },
    { label: i18n.t('visualizer.options.colorMode.barIndex') as string, value: 'bar-index' },
    { label: i18n.t('visualizer.options.colorMode.barLevel') as string, value: 'bar-level' },
];

const gradientOptions: { label: string; value: string }[] = [
    { label: i18n.t('visualizer.options.gradient.classic') as string, value: 'classic' },
    { label: i18n.t('visualizer.options.gradient.prism') as string, value: 'prism' },
    { label: i18n.t('visualizer.options.gradient.rainbow') as string, value: 'rainbow' },
    { label: i18n.t('visualizer.options.gradient.steelblue') as string, value: 'steelblue' },
    { label: i18n.t('visualizer.options.gradient.orangered') as string, value: 'orangered' },
];

const channelLayoutOptions: { label: string; value: string }[] = [
    { label: i18n.t('visualizer.options.channelLayout.single') as string, value: 'single' },
    {
        label: i18n.t('visualizer.options.channelLayout.dualCombined') as string,
        value: 'dual-combined',
    },
    {
        label: i18n.t('visualizer.options.channelLayout.dualHorizontal') as string,
        value: 'dual-horizontal',
    },
    {
        label: i18n.t('visualizer.options.channelLayout.dualVertical') as string,
        value: 'dual-vertical',
    },
];

const fftSizeOptions: { label: string; value: string }[] = [
    { label: '1024', value: '1024' },
    { label: '2048', value: '2048' },
    { label: '4096', value: '4096' },
    { label: '8192', value: '8192' },
    { label: '16384', value: '16384' },
    { label: '32768', value: '32768' },
];

const frequencyScaleOptions: { label: string; value: string }[] = [
    { label: i18n.t('visualizer.options.frequencyScale.bark') as string, value: 'bark' },
    { label: i18n.t('visualizer.options.frequencyScale.linear') as string, value: 'linear' },
    { label: i18n.t('visualizer.options.frequencyScale.log') as string, value: 'log' },
    { label: i18n.t('visualizer.options.frequencyScale.mel') as string, value: 'mel' },
];

const weightingFilterOptions = [
    { label: i18n.t('visualizer.options.weightingFilter.none') as string, value: '' },
    { label: i18n.t('visualizer.options.weightingFilter.a') as string, value: 'A' },
    { label: i18n.t('visualizer.options.weightingFilter.b') as string, value: 'B' },
    { label: i18n.t('visualizer.options.weightingFilter.C') as string, value: 'C' },
    { label: i18n.t('visualizer.options.weightingFilter.D') as string, value: 'D' },
    { label: i18n.t('visualizer.options.weightingFilter.z') as string, value: 'Z' },
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

const useUpdateAudioMotionAnalyzer = () => {
    const visualizer = useVisualizerSettings();
    const { setSettings } = useSettingsStoreActions();

    const updateProperty = <K extends keyof typeof visualizer.audiomotionanalyzer>(
        property: K,
        value: (typeof visualizer.audiomotionanalyzer)[K],
    ) => {
        setSettings({
            visualizer: {
                audiomotionanalyzer: {
                    [property]: value,
                },
            },
        });
    };

    return { updateProperty, visualizer };
};

const useUpdateButterchurn = () => {
    const visualizer = useVisualizerSettings();
    const { setSettings } = useSettingsStoreActions();

    const updateProperty = <K extends keyof typeof visualizer.butterchurn>(
        property: K,
        value: (typeof visualizer.butterchurn)[K],
    ) => {
        setSettings({
            visualizer: {
                butterchurn: {
                    [property]: value,
                },
            },
        });
    };

    return { updateProperty, visualizer };
};

export const VisualizerSettingsForm = () => {
    const { t } = useTranslation();
    const visualizer = useVisualizerSettings();
    const { setSettings } = useSettingsStoreActions();

    const visualizerTypeOptions = useMemo(
        () => [
            { label: 'AudioMotion Analyzer', value: 'audiomotionanalyzer' },
            { label: 'Butterchurn', value: 'butterchurn' },
        ],
        [],
    );

    const handleTypeChange = (value: string) => {
        setSettings({
            visualizer: {
                type: value as 'audiomotionanalyzer' | 'butterchurn',
            },
        });
    };

    return (
        <div className={styles.container}>
            <Fieldset legend={t('visualizer.visualizerType')}>
                <Stack>
                    <SegmentedControl
                        data={visualizerTypeOptions}
                        onChange={handleTypeChange}
                        value={visualizer.type}
                    />
                </Stack>
            </Fieldset>
            {visualizer.type === 'audiomotionanalyzer' && (
                <>
                    <PresetSettings />
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
                </>
            )}
            {visualizer.type === 'butterchurn' && (
                <>
                    <ButterchurnGeneralSettings />
                    <ButterChurnCycleSettings />
                </>
            )}
        </div>
    );
};

const VisualizerSelect = (props: SelectProps) => {
    return <Select styles={{ label: { display: 'flex', justifyContent: 'center' } }} {...props} />;
};

const VisualizerSlider = (props: SliderProps & { label?: React.ReactNode }) => {
    const { defaultValue, label, max, min, onChange, onChangeEnd, step, ...rest } = props;

    const sliderRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [value, setValue] = useState<number>((defaultValue as number) ?? 0);
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState<number>((defaultValue as number) ?? 0);

    // Update local state when defaultValue changes externally
    useEffect(() => {
        if (defaultValue !== undefined) {
            setValue(defaultValue as number);
            setEditValue(defaultValue as number);
        }
    }, [defaultValue]);

    // Auto-focus input when entering edit mode
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleChange = (val: number) => {
        setValue(val);
        onChange?.(val);
    };

    const handleTextClick = () => {
        setEditValue(value);
        setIsEditing(true);
    };

    const handleInputChange = (val: number | string) => {
        const numVal = typeof val === 'number' ? val : parseFloat(val) || 0;
        setEditValue(numVal);

        // Update slider value in real-time as user types (clamped to bounds)
        let clampedValue = numVal;
        if (min !== undefined && clampedValue < min) {
            clampedValue = min;
        }
        if (max !== undefined && clampedValue > max) {
            clampedValue = max;
        }
        setValue(clampedValue);
        onChange?.(clampedValue);
    };

    const handleInputBlur = () => {
        applyEditValue();
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            applyEditValue();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setEditValue(value);
        }
    };

    const applyEditValue = () => {
        let finalValue = editValue;

        // Clamp value to min/max bounds
        if (min !== undefined && finalValue < min) {
            finalValue = min;
        }
        if (max !== undefined && finalValue > max) {
            finalValue = max;
        }

        setValue(finalValue);
        setEditValue(finalValue);
        setIsEditing(false);

        // Update slider and trigger onChangeEnd to save
        onChange?.(finalValue);
        onChangeEnd?.(finalValue);
    };

    return (
        <Stack gap="sm">
            {label && (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    {typeof label === 'string' ? (
                        <Text fw="500" size="sm" ta="center">
                            {label}
                        </Text>
                    ) : (
                        label
                    )}
                </div>
            )}
            <Slider
                label={null}
                max={max}
                min={min}
                onChange={handleChange}
                onChangeEnd={onChangeEnd}
                ref={sliderRef}
                step={step}
                styles={{
                    root: { alignSelf: 'center', display: 'flex' },
                }}
                value={value}
                w="100px"
                {...rest}
            />
            {isEditing ? (
                <NumberInput
                    max={max}
                    min={min}
                    onBlur={handleInputBlur}
                    onChange={handleInputChange}
                    onKeyDown={handleInputKeyDown}
                    ref={inputRef}
                    size="xs"
                    step={step}
                    style={{ alignSelf: 'center', width: '80px' }}
                    styles={{ input: { textAlign: 'center' } }}
                    value={editValue}
                />
            ) : (
                <Text
                    fw="500"
                    onClick={handleTextClick}
                    size="sm"
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    ta="center"
                >
                    {value.toFixed(step && step < 1 ? 1 : 0)}
                </Text>
            )}
        </Stack>
    );
};

const VisualizerToggle = (props: {
    disabled?: boolean;
    label: string;
    onChange: (value: boolean) => void;
    value: boolean;
}) => {
    const { disabled, label, onChange, value } = props;

    return (
        <Button
            disabled={disabled}
            onClick={() => onChange(!value)}
            variant={value ? 'filled' : 'default'}
        >
            {label}
        </Button>
    );
};

const PresetSettings = () => {
    const { t } = useTranslation();
    const visualizer = useVisualizerSettings();
    const { setSettings } = useSettingsStoreActions();
    const [selectedPreset, setSelectedPreset] = useState<null | string>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [newPresetName, setNewPresetName] = useState('');
    const [isPasting, setIsPasting] = useState(false);
    const [pasteValue, setPasteValue] = useState('');

    const applyPreset = (presetId: null | string) => {
        if (!presetId) return;

        const preset = visualizer.audiomotionanalyzer.presets.find((p) => p.id === presetId);

        if (!preset) return;

        const initialDefaults = {
            alphaBars: false,
            ansiBands: false,
            barSpace: 0.1,
            channelLayout: 'single' as const,
            colorMode: 'gradient' as const,
            customGradients: [],
            fadePeaks: false,
            fftSize: 8192,
            fillAlpha: 1,
            frequencyScale: 'log' as const,
            gradient: 'classic',
            gradientLeft: undefined,
            gradientRight: undefined,
            gravity: 3.8,
            ledBars: true,
            linearAmplitude: false,
            linearBoost: 1.0,
            lineWidth: 0,
            loRes: false,
            lumiBars: false,
            maxDecibels: -25,
            maxFPS: 0,
            maxFreq: 22000,
            minDecibels: -85,
            minFreq: 20,
            mirror: 0.0,
            mode: 0,
            noteLabels: false,
            opacity: 1,
            outlineBars: false,
            peakFadeTime: 750,
            peakHoldTime: 500,
            peakLine: false,
            radial: false,
            radialInvert: false,
            radius: 0.3,
            reflexAlpha: 0.15,
            reflexBright: 1.0,
            reflexFit: true,
            reflexRatio: 0,
            roundBars: false,
            showFPS: false,
            showPeaks: true,
            showScaleX: false,
            showScaleY: false,
            smoothing: 0.5,
            spinSpeed: 0.0,
            splitGradient: false,
            trueLeds: false,
            volume: 1.0,
            weightingFilter: '' as const,
        };

        // Merge preset values with initial defaults to ensure all properties are included
        const presetValue = {
            ...initialDefaults,
            ...preset.value,
        };

        setSettings({
            visualizer: {
                audiomotionanalyzer: {
                    ...presetValue,
                },
            },
        });
    };

    const handlePresetChange = (value: null | string) => {
        setSelectedPreset(value);
        if (value) {
            applyPreset(value);
        }
    };

    const handleSavePreset = () => {
        if (!newPresetName.trim()) return;

        // Check if preset name already exists
        const existingPreset = visualizer.audiomotionanalyzer.presets.find(
            (p) => p.name === newPresetName.trim(),
        );

        if (existingPreset) {
            // Update existing preset
            const updatedPresets = visualizer.audiomotionanalyzer.presets.map((p) =>
                p.id === existingPreset.id
                    ? {
                          ...p,
                          value: getCurrentSettingsAsPresetValue(),
                      }
                    : p,
            );

            setSettings({
                visualizer: {
                    audiomotionanalyzer: {
                        presets: updatedPresets,
                    },
                },
            });

            setSelectedPreset(existingPreset.id);
        } else {
            // Add new preset
            const newPreset = {
                id: nanoid(),
                name: newPresetName.trim(),
                value: getCurrentSettingsAsPresetValue(),
            };

            setSettings({
                visualizer: {
                    audiomotionanalyzer: {
                        presets: [...visualizer.audiomotionanalyzer.presets, newPreset],
                    },
                },
            });

            setSelectedPreset(newPreset.id);
        }

        setNewPresetName('');
        setIsSaving(false);
    };

    const getCurrentSettingsAsPresetValue = () => {
        return {
            alphaBars: visualizer.audiomotionanalyzer.alphaBars,
            ansiBands: visualizer.audiomotionanalyzer.ansiBands,
            barSpace: visualizer.audiomotionanalyzer.barSpace,
            channelLayout: visualizer.audiomotionanalyzer.channelLayout,
            colorMode: visualizer.audiomotionanalyzer.colorMode,
            customGradients: visualizer.audiomotionanalyzer.customGradients,
            fadePeaks: visualizer.audiomotionanalyzer.fadePeaks,
            fftSize: visualizer.audiomotionanalyzer.fftSize,
            fillAlpha: visualizer.audiomotionanalyzer.fillAlpha,
            frequencyScale: visualizer.audiomotionanalyzer.frequencyScale,
            gradient: visualizer.audiomotionanalyzer.gradient,
            gradientLeft: visualizer.audiomotionanalyzer.gradientLeft,
            gradientRight: visualizer.audiomotionanalyzer.gradientRight,
            gravity: visualizer.audiomotionanalyzer.gravity,
            ledBars: visualizer.audiomotionanalyzer.ledBars,
            linearAmplitude: visualizer.audiomotionanalyzer.linearAmplitude,
            linearBoost: visualizer.audiomotionanalyzer.linearBoost,
            lineWidth: visualizer.audiomotionanalyzer.lineWidth,
            loRes: visualizer.audiomotionanalyzer.loRes,
            lumiBars: visualizer.audiomotionanalyzer.lumiBars,
            maxDecibels: visualizer.audiomotionanalyzer.maxDecibels,
            maxFPS: visualizer.audiomotionanalyzer.maxFPS,
            maxFreq: visualizer.audiomotionanalyzer.maxFreq,
            minDecibels: visualizer.audiomotionanalyzer.minDecibels,
            minFreq: visualizer.audiomotionanalyzer.minFreq,
            mirror: visualizer.audiomotionanalyzer.mirror,
            mode: visualizer.audiomotionanalyzer.mode,
            noteLabels: visualizer.audiomotionanalyzer.noteLabels,
            opacity: visualizer.audiomotionanalyzer.opacity,
            outlineBars: visualizer.audiomotionanalyzer.outlineBars,
            peakFadeTime: visualizer.audiomotionanalyzer.peakFadeTime,
            peakHoldTime: visualizer.audiomotionanalyzer.peakHoldTime,
            peakLine: visualizer.audiomotionanalyzer.peakLine,
            radial: visualizer.audiomotionanalyzer.radial,
            radialInvert: visualizer.audiomotionanalyzer.radialInvert,
            radius: visualizer.audiomotionanalyzer.radius,
            reflexAlpha: visualizer.audiomotionanalyzer.reflexAlpha,
            reflexBright: visualizer.audiomotionanalyzer.reflexBright,
            reflexFit: visualizer.audiomotionanalyzer.reflexFit,
            reflexRatio: visualizer.audiomotionanalyzer.reflexRatio,
            roundBars: visualizer.audiomotionanalyzer.roundBars,
            showFPS: visualizer.audiomotionanalyzer.showFPS,
            showPeaks: visualizer.audiomotionanalyzer.showPeaks,
            showScaleX: visualizer.audiomotionanalyzer.showScaleX,
            showScaleY: visualizer.audiomotionanalyzer.showScaleY,
            smoothing: visualizer.audiomotionanalyzer.smoothing,
            spinSpeed: visualizer.audiomotionanalyzer.spinSpeed,
            splitGradient: visualizer.audiomotionanalyzer.splitGradient,
            trueLeds: visualizer.audiomotionanalyzer.trueLeds,
            volume: visualizer.audiomotionanalyzer.volume,
            weightingFilter: visualizer.audiomotionanalyzer.weightingFilter,
        };
    };

    const handleUpdatePreset = () => {
        if (!selectedPreset || !newPresetName.trim()) return;

        const selectedPresetObj = visualizer.audiomotionanalyzer.presets.find(
            (p) => p.id === selectedPreset,
        );
        if (!selectedPresetObj) return;

        let trimmedName = newPresetName.trim();
        const isRenaming = trimmedName !== selectedPresetObj.name;

        if (isRenaming) {
            const existingNames = visualizer.audiomotionanalyzer.presets
                .filter((p) => p.id !== selectedPreset)
                .map((p) => p.name);

            if (existingNames.includes(trimmedName)) {
                const pattern = /^(.+?)(\s+\((\d+)\))?$/;
                const match = trimmedName.match(pattern);
                const baseName = match ? match[1] : trimmedName;
                let counter = 1;
                while (existingNames.includes(`${baseName} (${counter})`)) {
                    counter++;
                }
                trimmedName = `${baseName} (${counter})`;
            }
        }

        const updatedPresets = visualizer.audiomotionanalyzer.presets.map((p) =>
            p.id === selectedPreset
                ? {
                      ...p,
                      name: trimmedName,
                      value: getCurrentSettingsAsPresetValue(),
                  }
                : p,
        );

        setSettings({
            visualizer: {
                ...visualizer,
                audiomotionanalyzer: {
                    ...visualizer.audiomotionanalyzer,
                    presets: updatedPresets,
                },
            },
        });

        setNewPresetName('');
        setIsRenaming(false);
    };

    const handleDeletePreset = () => {
        if (!selectedPreset) return;

        const updatedPresets = visualizer.audiomotionanalyzer.presets.filter(
            (p) => p.id !== selectedPreset,
        );

        setSettings({
            visualizer: {
                audiomotionanalyzer: {
                    presets: updatedPresets,
                },
            },
        });

        setSelectedPreset(null);
    };

    const handleCopyConfiguration = async () => {
        try {
            const config = getCurrentSettingsAsPresetValue();
            const configJson = JSON.stringify(config, null, 2);
            await navigator.clipboard.writeText(configJson);
            toast.success({
                message: t('visualizer.configCopied', { postProcess: 'sentenceCase' }),
            });
        } catch {
            toast.error({
                message: t('visualizer.configCopyFailed', { postProcess: 'sentenceCase' }),
            });
        }
    };

    const handlePasteConfiguration = () => {
        if (!pasteValue.trim()) return;

        try {
            const parsed = JSON.parse(pasteValue.trim());

            // Validate that it's an object with expected properties
            if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
                throw new Error('Invalid configuration format');
            }

            // Merge with initial defaults to ensure all properties are set
            const initialDefaults = {
                alphaBars: false,
                ansiBands: false,
                barSpace: 0.1,
                channelLayout: 'single' as const,
                colorMode: 'gradient' as const,
                customGradients: [],
                fadePeaks: false,
                fftSize: 8192,
                fillAlpha: 1,
                frequencyScale: 'log' as const,
                gradient: 'classic',
                gradientLeft: undefined,
                gradientRight: undefined,
                gravity: 3.8,
                ledBars: true,
                linearAmplitude: false,
                linearBoost: 1.0,
                lineWidth: 0,
                loRes: false,
                lumiBars: false,
                maxDecibels: -25,
                maxFPS: 0,
                maxFreq: 22000,
                minDecibels: -85,
                minFreq: 20,
                mirror: 0.0,
                mode: 0,
                noteLabels: false,
                opacity: 1,
                outlineBars: false,
                peakFadeTime: 750,
                peakHoldTime: 500,
                peakLine: false,
                radial: false,
                radialInvert: false,
                radius: 0.3,
                reflexAlpha: 0.15,
                reflexBright: 1.0,
                reflexFit: true,
                reflexRatio: 0,
                roundBars: false,
                showFPS: false,
                showPeaks: true,
                showScaleX: false,
                showScaleY: false,
                smoothing: 0.5,
                spinSpeed: 0.0,
                splitGradient: false,
                trueLeds: false,
                volume: 1.0,
                weightingFilter: '' as const,
            };

            const pastedCustomGradients = Array.isArray(parsed.customGradients)
                ? parsed.customGradients
                : [];

            const parsedWithoutCustomGradients = { ...parsed };
            delete parsedWithoutCustomGradients.customGradients;

            // Determine the channel layout from the pasted config (or use default)
            const pastedChannelLayout = parsed.channelLayout || initialDefaults.channelLayout;

            // Get the gradient values that would be used based on channel layout
            const gradientNamesToCheck: (string | undefined)[] = [];
            if (pastedChannelLayout === 'single') {
                gradientNamesToCheck.push(parsed.gradient);
            } else {
                gradientNamesToCheck.push(parsed.gradientLeft, parsed.gradientRight);
            }

            // Check if any of the gradient names match custom gradients in the pasted config
            const pastedCustomGradientNames = pastedCustomGradients.map((g) => g.name);
            const isUsingCustomGradient = gradientNamesToCheck.some(
                (gradientName) => gradientName && pastedCustomGradientNames.includes(gradientName),
            );

            // Only append custom gradients if they're actually being used in the configuration
            const customGradientsToUse = isUsingCustomGradient
                ? [
                      ...(visualizer.audiomotionanalyzer.customGradients || []),
                      ...pastedCustomGradients,
                  ]
                : pastedCustomGradients;

            const configValue = {
                ...initialDefaults,
                ...parsedWithoutCustomGradients,
                customGradients: customGradientsToUse,
            };

            setSettings({
                visualizer: {
                    audiomotionanalyzer: {
                        ...configValue,
                    },
                },
            });

            toast.success({
                message: t('visualizer.configPasted', { postProcess: 'sentenceCase' }),
            });

            setPasteValue('');
            setIsPasting(false);
        } catch {
            toast.error({
                message: t('visualizer.configPasteFailed', { postProcess: 'sentenceCase' }),
            });
        }
    };

    const handlePasteFromClipboard = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setPasteValue(text);
            setIsPasting(true);
        } catch {
            toast.error({
                message: t('visualizer.configPasteReadFailed', { postProcess: 'sentenceCase' }),
            });
        }
    };

    const presetOptions = useMemo(() => {
        return visualizer.audiomotionanalyzer.presets.map((preset) => ({
            label: preset.name,
            value: preset.id,
        }));
    }, [visualizer.audiomotionanalyzer.presets]);

    return (
        <Fieldset legend={t('visualizer.presets')}>
            <Stack>
                <VisualizerSelect
                    data={presetOptions}
                    label={t('visualizer.selectPreset')}
                    onChange={handlePresetChange}
                    value={selectedPreset || undefined}
                />
                {isSaving ? (
                    <Group grow>
                        <TextInput
                            autoFocus
                            label={t('visualizer.presetName')}
                            onChange={(e) => setNewPresetName(e.currentTarget.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSavePreset();
                                } else if (e.key === 'Escape') {
                                    setIsSaving(false);
                                    setNewPresetName('');
                                }
                            }}
                            placeholder={t('visualizer.presetNamePlaceholder')}
                            value={newPresetName}
                        />
                        <Group style={{ alignSelf: 'flex-end' }}>
                            <Button onClick={() => setIsSaving(false)} variant="subtle">
                                {t('common.cancel', { postProcess: 'titleCase' })}
                            </Button>
                            <Button
                                disabled={!newPresetName.trim()}
                                onClick={handleSavePreset}
                                variant="filled"
                            >
                                {t('common.save', { postProcess: 'titleCase' })}
                            </Button>
                        </Group>
                    </Group>
                ) : isRenaming ? (
                    <Group grow>
                        <TextInput
                            autoFocus
                            label={t('visualizer.presetName')}
                            onChange={(e) => setNewPresetName(e.currentTarget.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleUpdatePreset();
                                } else if (e.key === 'Escape') {
                                    setIsRenaming(false);
                                    setNewPresetName('');
                                }
                            }}
                            placeholder={t('visualizer.presetNamePlaceholder')}
                            value={newPresetName}
                        />
                        <Group style={{ alignSelf: 'flex-end' }}>
                            <Button onClick={() => setIsRenaming(false)} variant="subtle">
                                {t('common.cancel', { postProcess: 'titleCase' })}
                            </Button>
                            <Button
                                disabled={!newPresetName.trim()}
                                onClick={handleUpdatePreset}
                                variant="filled"
                            >
                                {t('common.save', { postProcess: 'titleCase' })}
                            </Button>
                        </Group>
                    </Group>
                ) : isPasting ? (
                    <Stack>
                        <Textarea
                            autosize
                            label={t('visualizer.pasteConfiguration')}
                            maxRows={10}
                            minRows={5}
                            onChange={(e) => setPasteValue(e.currentTarget.value)}
                            placeholder={t('visualizer.pasteConfigurationPlaceholder')}
                            spellCheck={false}
                            value={pasteValue}
                        />
                        <Group>
                            <Button onClick={handlePasteFromClipboard} variant="subtle">
                                {t('visualizer.pasteFromClipboard')}
                            </Button>
                            <Button onClick={() => setIsPasting(false)} variant="subtle">
                                {t('common.cancel', { postProcess: 'titleCase' })}
                            </Button>
                            <Button
                                disabled={!pasteValue.trim()}
                                onClick={handlePasteConfiguration}
                                variant="filled"
                            >
                                {t('visualizer.applyConfiguration')}
                            </Button>
                        </Group>
                    </Stack>
                ) : (
                    <Group>
                        <Button onClick={() => setIsSaving(true)} variant="default">
                            {t('visualizer.saveAsPreset')}
                        </Button>
                        {selectedPreset && (
                            <>
                                <Button
                                    onClick={() => {
                                        const preset = visualizer.audiomotionanalyzer.presets.find(
                                            (p) => p.id === selectedPreset,
                                        );
                                        if (preset) {
                                            setNewPresetName(preset.name);
                                            setIsRenaming(true);
                                        }
                                    }}
                                    variant="default"
                                >
                                    {t('visualizer.updatePreset')}
                                </Button>
                                <Button onClick={handleDeletePreset} variant="subtle">
                                    {t('common.delete', { postProcess: 'titleCase' })}
                                </Button>
                            </>
                        )}
                        <Button onClick={handleCopyConfiguration} variant="default">
                            {t('visualizer.copyConfiguration')}
                        </Button>
                        <Button onClick={() => setIsPasting(true)} variant="default">
                            {t('visualizer.pasteConfiguration')}
                        </Button>
                    </Group>
                )}
            </Stack>
        </Fieldset>
    );
};

const GeneralSettings = () => {
    const { t } = useTranslation();
    const { updateProperty, visualizer } = useUpdateAudioMotionAnalyzer();

    const isMode18Disabled = visualizer.audiomotionanalyzer.mode > 8;
    const isMode10Disabled = visualizer.audiomotionanalyzer.mode !== 10;

    const getChannelLayoutKey = (value: string) => {
        const layoutMap: Record<string, string> = {
            'dual-combined': 'dualCombined',
            'dual-horizontal': 'dualHorizontal',
            'dual-vertical': 'dualVertical',
            single: 'single',
        };
        return layoutMap[value] || 'single';
    };

    const translatedChannelLayoutOptions = useMemo(
        () =>
            channelLayoutOptions.map((option) => {
                const value = option.value || 'single';
                return {
                    label: t(`visualizer.options.channelLayout.${getChannelLayoutKey(value)}`),
                    value: value as string,
                };
            }),
        [t],
    );

    return (
        <Fieldset
            legend={
                <Group gap="xs">
                    {t('visualizer.general')}
                    <ActionIcon
                        component="a"
                        href="https://audiomotion.dev/#/?id=constructor-specific-options"
                        icon="externalLink"
                        iconProps={{ color: 'info' }}
                        size="xs"
                        target="_blank"
                        variant="transparent"
                    />
                </Group>
            }
        >
            <Stack>
                <Group grow>
                    <VisualizerSelect
                        data={modeOptions}
                        defaultValue={visualizer.audiomotionanalyzer.mode.toString()}
                        label={t('visualizer.mode')}
                        onChange={(e) => updateProperty('mode', Number(e))}
                    />
                </Group>
                <div
                    style={{
                        display: 'flex',
                        gap: 'var(--theme-spacing-md)',
                    }}
                >
                    <Fieldset legend={t('visualizer.mode1To8')} style={{ flex: 1, flexGrow: 1 }}>
                        <Group grow>
                            <VisualizerSelect
                                data={barSpaceOptions.map((option) => ({
                                    label: option.label,
                                    value: option.value,
                                }))}
                                defaultValue={visualizer.audiomotionanalyzer.barSpace.toString()}
                                disabled={isMode18Disabled}
                                label={t('visualizer.barSpace')}
                                onChange={(e) => updateProperty('barSpace', Number(e))}
                            />
                        </Group>
                    </Fieldset>
                    <Fieldset legend={t('visualizer.mode10')} style={{ flex: 1, flexGrow: 1 }}>
                        <Group grow>
                            <VisualizerSlider
                                defaultValue={visualizer.audiomotionanalyzer.lineWidth}
                                disabled={isMode10Disabled}
                                label={t('visualizer.lineWidth')}
                                max={4}
                                min={0}
                                onChangeEnd={(e) => updateProperty('lineWidth', e)}
                                step={0.1}
                            />
                            <VisualizerSlider
                                defaultValue={visualizer.audiomotionanalyzer.fillAlpha}
                                disabled={isMode10Disabled}
                                label={t('visualizer.fillAlpha')}
                                max={1}
                                min={0}
                                onChangeEnd={(e) => updateProperty('fillAlpha', e)}
                                step={0.1}
                            />
                        </Group>
                    </Fieldset>
                </div>

                <Group grow>
                    <VisualizerSelect
                        data={translatedChannelLayoutOptions}
                        defaultValue={visualizer.audiomotionanalyzer.channelLayout}
                        label={t('visualizer.channelLayout')}
                        onChange={(e) =>
                            updateProperty(
                                'channelLayout',
                                e as
                                    | 'dual-combined'
                                    | 'dual-horizontal'
                                    | 'dual-vertical'
                                    | 'single',
                            )
                        }
                    />
                    <VisualizerSlider
                        defaultValue={visualizer.audiomotionanalyzer.maxFPS}
                        label={t('visualizer.maxFPS')}
                        max={144}
                        min={0}
                        onChangeEnd={(e) => updateProperty('maxFPS', e)}
                    />
                    <VisualizerSlider
                        defaultValue={visualizer.audiomotionanalyzer.opacity}
                        label={t('visualizer.opacity')}
                        max={1}
                        min={0}
                        onChangeEnd={(e) => updateProperty('opacity', e)}
                        step={0.01}
                    />
                </Group>
            </Stack>
        </Fieldset>
    );
};

type CustomGradient = {
    colorStops: StoredColorStop[];
    dir?: string;
    name: string;
};

type StoredColorStop = {
    color: string;
    level?: number;
    levelEnabled?: boolean;
    pos?: number;
    positionEnabled?: boolean;
};

const CustomGradientsManager = () => {
    const { t } = useTranslation();
    const { updateProperty, visualizer } = useUpdateAudioMotionAnalyzer();
    const [isAdding, setIsAdding] = useState(false);
    const [editingIndex, setEditingIndex] = useState<null | number>(null);
    const [isPasting, setIsPasting] = useState(false);
    const [pasteValue, setPasteValue] = useState('');
    const [newGradient, setNewGradient] = useState<CustomGradient>({
        colorStops: [{ color: '#ff0000', levelEnabled: false, positionEnabled: false }],
        dir: 'v',
        name: '',
    });

    const customGradients = visualizer.audiomotionanalyzer.customGradients || [];

    const generateDefaultName = () => {
        const existingNames = customGradients.map((g) => g.name);
        const pattern = /^Custom Gradient (\d+)$/i;
        const numbers = existingNames
            .map((name) => {
                const match = name.match(pattern);
                return match ? parseInt(match[1], 10) : null;
            })
            .filter((num): num is number => num !== null);

        if (numbers.length === 0) {
            return 'Custom Gradient 1';
        }

        const maxNumber = Math.max(...numbers);
        return `Custom Gradient ${maxNumber + 1}`;
    };

    const handleStartAdding = () => {
        setNewGradient({
            colorStops: [{ color: '#ff0000', levelEnabled: false, positionEnabled: false }],
            dir: 'v',
            name: generateDefaultName(),
        });
        setIsAdding(true);
    };

    const handleAddGradient = () => {
        if (!newGradient.name.trim()) return;

        const updatedGradients = [...customGradients, newGradient];
        updateProperty('customGradients', updatedGradients);
        setNewGradient({
            colorStops: [
                {
                    color: '#ff0000',
                    level: 0,
                    levelEnabled: false,
                    pos: 0,
                    positionEnabled: false,
                },
            ],
            dir: 'v',
            name: '',
        });
        setIsAdding(false);
    };

    const handleDeleteGradient = (index: number) => {
        const updatedGradients = customGradients.filter((_, i) => i !== index);
        updateProperty('customGradients', updatedGradients);
    };

    const handleEditGradient = (index: number) => {
        const gradient = customGradients[index];
        setNewGradient(gradient);
        setEditingIndex(index);
        setIsAdding(true);
    };

    const handleSaveEdit = () => {
        if (!newGradient.name.trim() || editingIndex === null) return;

        const updatedGradients = [...customGradients];
        updatedGradients[editingIndex] = newGradient;
        updateProperty('customGradients', updatedGradients);
        setNewGradient({
            colorStops: [{ color: '#ff0000', levelEnabled: false, positionEnabled: false }],
            dir: 'v',
            name: '',
        });
        setEditingIndex(null);
        setIsAdding(false);
    };

    const handleCancel = () => {
        setNewGradient({
            colorStops: [{ color: '#ff0000', levelEnabled: false, positionEnabled: false }],
            dir: 'v',
            name: '',
        });
        setEditingIndex(null);
        setIsAdding(false);
    };

    const handleAddColorStop = () => {
        setNewGradient({
            ...newGradient,
            colorStops: [
                ...newGradient.colorStops,
                { color: '#00ff00', levelEnabled: false, positionEnabled: false },
            ],
        });
    };

    const handleRemoveColorStop = (index: number) => {
        if (newGradient.colorStops.length <= 1) return;
        setNewGradient({
            ...newGradient,
            colorStops: newGradient.colorStops.filter((_, i) => i !== index),
        });
    };

    const handleColorStopChange = (index: number, color: string) => {
        const updatedColorStops = [...newGradient.colorStops];
        const currentStop = updatedColorStops[index];

        updatedColorStops[index] = {
            ...currentStop,
            color,
        };

        setNewGradient({ ...newGradient, colorStops: updatedColorStops });
    };

    const handleColorStopPosChange = (index: number, pos: number | string) => {
        const updatedColorStops = [...newGradient.colorStops];
        const currentStop = updatedColorStops[index];
        const posValue = typeof pos === 'number' ? pos : parseFloat(pos) || undefined;

        updatedColorStops[index] = {
            ...currentStop,
            ...(currentStop.positionEnabled && posValue !== undefined ? { pos: posValue } : {}),
        };

        setNewGradient({ ...newGradient, colorStops: updatedColorStops });
    };

    const handleColorStopLevelChange = (index: number, level: number | string) => {
        const updatedColorStops = [...newGradient.colorStops];
        const currentStop = updatedColorStops[index];
        const levelValue = typeof level === 'number' ? level : parseFloat(level) || undefined;

        updatedColorStops[index] = {
            ...currentStop,
            ...(currentStop.levelEnabled && levelValue !== undefined ? { level: levelValue } : {}),
        };

        setNewGradient({ ...newGradient, colorStops: updatedColorStops });
    };

    const handleTogglePos = (index: number, enabled: boolean) => {
        const updatedColorStops = [...newGradient.colorStops];
        const currentStop = updatedColorStops[index];

        updatedColorStops[index] = {
            ...currentStop,
            positionEnabled: enabled,
            // Remove pos if disabling
            ...(enabled && currentStop.pos !== undefined ? { pos: currentStop.pos } : {}),
            ...(!enabled ? { pos: undefined } : {}),
        };

        setNewGradient({ ...newGradient, colorStops: updatedColorStops });
    };

    const handleToggleLevel = (index: number, enabled: boolean) => {
        const updatedColorStops = [...newGradient.colorStops];
        const currentStop = updatedColorStops[index];

        updatedColorStops[index] = {
            ...currentStop,
            levelEnabled: enabled,
            // Remove level if disabling
            ...(enabled && currentStop.level !== undefined ? { level: currentStop.level } : {}),
            ...(!enabled ? { level: undefined } : {}),
        };

        setNewGradient({ ...newGradient, colorStops: updatedColorStops });
    };

    const handleCopyGradient = async (gradient: CustomGradient) => {
        try {
            const gradientJson = JSON.stringify(gradient, null, 2);
            await navigator.clipboard.writeText(gradientJson);
            toast.success({
                message: t('visualizer.configCopied'),
            });
        } catch {
            toast.error({
                message: t('visualizer.configCopyFailed'),
            });
        }
    };

    const handlePasteGradient = () => {
        if (!pasteValue.trim()) return;

        try {
            const parsed = JSON.parse(pasteValue.trim());

            // Validate that it's a valid gradient object
            if (
                typeof parsed !== 'object' ||
                parsed === null ||
                Array.isArray(parsed) ||
                !parsed.colorStops ||
                !Array.isArray(parsed.colorStops) ||
                parsed.colorStops.length === 0
            ) {
                throw new Error('Invalid gradient format');
            }

            // Generate a unique name if the pasted gradient has a name that already exists
            let gradientName = parsed.name || generateDefaultName();
            const existingNames = customGradients.map((g) => g.name);
            if (existingNames.includes(gradientName)) {
                const pattern = /^(.+?)(\s+\((\d+)\))?$/;
                const match = gradientName.match(pattern);
                const baseName = match ? match[1] : gradientName;
                let counter = 1;
                while (existingNames.includes(`${baseName} (${counter})`)) {
                    counter++;
                }
                gradientName = `${baseName} (${counter})`;
            }

            const pastedGradient: CustomGradient = {
                colorStops: parsed.colorStops.map((stop: any) => ({
                    color: stop.color || '#ff0000',
                    level: stop.level,
                    levelEnabled: stop.levelEnabled || false,
                    pos: stop.pos,
                    positionEnabled: stop.positionEnabled || false,
                })),
                dir: parsed.dir || 'v',
                name: gradientName,
            };

            setNewGradient(pastedGradient);
            setPasteValue('');
            setIsPasting(false);
            setIsAdding(true);
            setEditingIndex(null);
        } catch {
            toast.error({
                message: t('visualizer.configPasteFailed'),
            });
        }
    };

    return (
        <Fieldset
            legend={
                <Group gap="xs">
                    {t('visualizer.customGradients')}
                    <ActionIcon
                        component="a"
                        href="https://audiomotion.dev/#/?id=registergradient-name-options-"
                        icon="externalLink"
                        iconProps={{ color: 'info' }}
                        size="xs"
                        target="_blank"
                        variant="transparent"
                    />
                </Group>
            }
        >
            <Stack gap="md">
                {customGradients.length > 0 && (
                    <Stack gap="sm">
                        {customGradients.map((gradient, index) => (
                            <Group grow key={index}>
                                <Group grow>
                                    <Text size="sm">{gradient.name}</Text>
                                </Group>
                                <Group justify="flex-end">
                                    <Button
                                        onClick={() => handleCopyGradient(gradient)}
                                        size="xs"
                                        variant="subtle"
                                    >
                                        {t('visualizer.copyConfiguration')}
                                    </Button>
                                    <Button
                                        onClick={() => handleEditGradient(index)}
                                        size="xs"
                                        variant="default"
                                    >
                                        {t('common.edit', { postProcess: 'titleCase' })}
                                    </Button>
                                    <Button
                                        onClick={() => handleDeleteGradient(index)}
                                        size="xs"
                                        variant="state-error"
                                    >
                                        {t('common.delete', { postProcess: 'titleCase' })}
                                    </Button>
                                </Group>
                            </Group>
                        ))}
                    </Stack>
                )}

                {!isAdding && !isPasting ? (
                    <Group>
                        <Button onClick={handleStartAdding} size="sm" variant="outline">
                            {t('visualizer.addCustomGradient')}
                        </Button>
                        <Button onClick={() => setIsPasting(true)} size="sm" variant="outline">
                            {t('visualizer.pasteGradient', { postProcess: 'titleCase' })}
                        </Button>
                    </Group>
                ) : isPasting ? (
                    <Stack>
                        <Textarea
                            autosize
                            label={t('visualizer.pasteGradient', { postProcess: 'titleCase' })}
                            maxRows={10}
                            minRows={5}
                            onChange={(e) => setPasteValue(e.currentTarget.value)}
                            placeholder={t('visualizer.pasteGradientPlaceholder')}
                            spellCheck={false}
                            value={pasteValue}
                        />
                        <Group>
                            <Button onClick={() => setIsPasting(false)} variant="subtle">
                                {t('common.cancel', { postProcess: 'titleCase' })}
                            </Button>
                            <Button
                                disabled={!pasteValue.trim()}
                                onClick={handlePasteGradient}
                                variant="filled"
                            >
                                {t('common.add', { postProcess: 'titleCase' })}
                            </Button>
                        </Group>
                    </Stack>
                ) : (
                    <>
                        <Divider />
                        <Stack gap="sm">
                            <TextInput
                                onChange={(e) =>
                                    setNewGradient({ ...newGradient, name: e.currentTarget.value })
                                }
                                placeholder={t('visualizer.gradientNamePlaceholder')}
                                size="sm"
                                value={newGradient.name}
                            />
                            <SegmentedControl
                                data={[
                                    { label: t('visualizer.vertical'), value: 'v' },
                                    { label: t('visualizer.horizontal'), value: 'h' },
                                ]}
                                onChange={(value) =>
                                    setNewGradient({
                                        ...newGradient,
                                        dir: value,
                                    })
                                }
                                size="sm"
                                value={newGradient.dir || 'v'}
                            />
                            <Stack gap="xl">
                                <Group justify="space-between">
                                    <Text>{t('visualizer.colorStops')}</Text>
                                    <Button
                                        onClick={handleAddColorStop}
                                        size="xs"
                                        variant="outline"
                                    >
                                        {t('visualizer.addColor')}
                                    </Button>
                                </Group>
                                {newGradient.colorStops.map((stop, index) => {
                                    return (
                                        <Group grow key={index}>
                                            <ColorInput
                                                format="hex"
                                                onChangeEnd={(color) =>
                                                    handleColorStopChange(index, color)
                                                }
                                                size="sm"
                                                value={stop.color}
                                            />
                                            <VisualizerSlider
                                                defaultValue={stop.pos}
                                                disabled={!stop.positionEnabled}
                                                label={
                                                    <Group
                                                        gap="xs"
                                                        style={{ alignItems: 'center' }}
                                                    >
                                                        <Checkbox
                                                            checked={stop.positionEnabled || false}
                                                            onChange={(e) =>
                                                                handleTogglePos(
                                                                    index,
                                                                    e.currentTarget.checked,
                                                                )
                                                            }
                                                            size="xs"
                                                        />
                                                        <Text fw={500} size="sm">
                                                            {t('visualizer.position')}
                                                        </Text>
                                                    </Group>
                                                }
                                                max={1}
                                                min={0}
                                                onChangeEnd={(e) =>
                                                    handleColorStopPosChange(index, e)
                                                }
                                                step={0.1}
                                            />
                                            <VisualizerSlider
                                                defaultValue={stop.level}
                                                disabled={!stop.levelEnabled}
                                                label={
                                                    <Group
                                                        gap="xs"
                                                        style={{ alignItems: 'center' }}
                                                    >
                                                        <Checkbox
                                                            checked={stop.levelEnabled || false}
                                                            onChange={(e) =>
                                                                handleToggleLevel(
                                                                    index,
                                                                    e.currentTarget.checked,
                                                                )
                                                            }
                                                            size="xs"
                                                        />
                                                        <Text fw={500} size="sm">
                                                            {t('visualizer.level')}
                                                        </Text>
                                                    </Group>
                                                }
                                                max={1}
                                                min={0}
                                                onChangeEnd={(e) =>
                                                    handleColorStopLevelChange(index, e)
                                                }
                                                step={0.1}
                                            />
                                            {newGradient.colorStops.length > 1 && (
                                                <Button
                                                    onClick={() => handleRemoveColorStop(index)}
                                                    size="xs"
                                                    variant="subtle"
                                                >
                                                    {t('visualizer.remove')}
                                                </Button>
                                            )}
                                        </Group>
                                    );
                                })}
                            </Stack>
                            <Group grow>
                                <Button onClick={handleCancel} size="sm" variant="subtle">
                                    {t('common.cancel', { postProcess: 'titleCase' })}
                                </Button>
                                <Button
                                    disabled={!newGradient.name.trim()}
                                    onClick={
                                        editingIndex !== null ? handleSaveEdit : handleAddGradient
                                    }
                                    size="sm"
                                    variant="filled"
                                >
                                    {editingIndex !== null
                                        ? t('common.save', { postProcess: 'titleCase' })
                                        : t('common.add', { postProcess: 'titleCase' })}
                                </Button>
                            </Group>
                        </Stack>
                    </>
                )}
            </Stack>
        </Fieldset>
    );
};

const ColorSettings = () => {
    const { t } = useTranslation();
    const { updateProperty, visualizer } = useUpdateAudioMotionAnalyzer();

    const isGradientDisabled = visualizer.audiomotionanalyzer.channelLayout !== 'single';
    const isGradientLeftDisabled = visualizer.audiomotionanalyzer.channelLayout === 'single';
    const isGradientRightDisabled = visualizer.audiomotionanalyzer.channelLayout === 'single';

    const allGradientOptions = useMemo(
        () => [
            {
                group: t('visualizer.custom'),
                items: (visualizer.audiomotionanalyzer.customGradients || []).map((gradient) => ({
                    label: gradient.name,
                    value: gradient.name,
                })),
            },
            {
                group: t('visualizer.builtIn'),
                items: gradientOptions,
            },
        ],
        [t, visualizer.audiomotionanalyzer.customGradients],
    );

    return (
        <Fieldset legend={t('visualizer.colors')}>
            <Stack>
                <Group grow>
                    <VisualizerSelect
                        data={colorModeOptions}
                        defaultValue={visualizer.audiomotionanalyzer.colorMode}
                        label={t('visualizer.colorMode')}
                        onChange={(e) =>
                            updateProperty(
                                'colorMode',
                                (e || 'gradient') as 'bar-index' | 'bar-level' | 'gradient',
                            )
                        }
                    />
                    <VisualizerSelect
                        data={allGradientOptions}
                        defaultValue={visualizer.audiomotionanalyzer.gradient}
                        disabled={isGradientDisabled}
                        label={t('visualizer.gradient')}
                        onChange={(e) =>
                            updateProperty(
                                'gradient',
                                (e || 'classic') as typeof visualizer.audiomotionanalyzer.gradient,
                            )
                        }
                    />
                </Group>
                <Group grow>
                    <VisualizerSelect
                        data={allGradientOptions}
                        defaultValue={visualizer.audiomotionanalyzer.gradientLeft}
                        disabled={isGradientLeftDisabled}
                        label={t('visualizer.gradientLeft')}
                        onChange={(e) =>
                            updateProperty(
                                'gradientLeft',
                                (e ||
                                    'classic') as typeof visualizer.audiomotionanalyzer.gradientLeft,
                            )
                        }
                    />
                    <VisualizerSelect
                        data={allGradientOptions}
                        defaultValue={visualizer.audiomotionanalyzer.gradientRight}
                        disabled={isGradientRightDisabled}
                        label={t('visualizer.gradientRight')}
                        onChange={(e) =>
                            updateProperty(
                                'gradientRight',
                                (e ||
                                    'classic') as typeof visualizer.audiomotionanalyzer.gradientRight,
                            )
                        }
                    />
                </Group>
                <CustomGradientsManager />
            </Stack>
        </Fieldset>
    );
};

const FFTSettings = () => {
    const { t } = useTranslation();
    const { updateProperty, visualizer } = useUpdateAudioMotionAnalyzer();

    return (
        <Fieldset legend={t('visualizer.fft')}>
            <Group grow>
                <VisualizerSelect
                    data={fftSizeOptions.map((option) => ({
                        label: option.label,
                        value: option.value as string,
                    }))}
                    defaultValue={visualizer.audiomotionanalyzer.fftSize.toString()}
                    label={t('visualizer.fftSize')}
                    onChange={(e) => updateProperty('fftSize', Number(e))}
                />
                <VisualizerSlider
                    defaultValue={visualizer.audiomotionanalyzer.smoothing}
                    label={t('visualizer.smoothing')}
                    max={1}
                    min={0}
                    onChangeEnd={(e) => updateProperty('smoothing', e)}
                    step={0.1}
                />
            </Group>
        </Fieldset>
    );
};

const FrequencySettings = () => {
    const { t } = useTranslation();
    const { updateProperty, visualizer } = useUpdateAudioMotionAnalyzer();

    const translatedFrequencyScaleOptions = useMemo(
        () =>
            frequencyScaleOptions.map((option) => ({
                label: t(`visualizer.options.frequencyScale.${option.value}`),
                value: option.value as string,
            })),
        [t],
    );

    return (
        <Fieldset legend={t('visualizer.frequencyRangeAndScaling')}>
            <Group grow wrap="nowrap">
                <VisualizerSelect
                    data={minFreqOptions.map((option) => ({
                        label: option.label,
                        value: option.value as string,
                    }))}
                    defaultValue={visualizer.audiomotionanalyzer.minFreq.toString()}
                    label={t('visualizer.minimumFrequency')}
                    onChange={(e) => updateProperty('minFreq', Number(e))}
                />
                <VisualizerSelect
                    data={maxFreqOptions.map((option) => ({
                        label: option.label,
                        value: option.value as string,
                    }))}
                    defaultValue={visualizer.audiomotionanalyzer.maxFreq.toString()}
                    label={t('visualizer.maximumFrequency')}
                    onChange={(e) => updateProperty('maxFreq', Number(e))}
                />
                <VisualizerSelect
                    data={translatedFrequencyScaleOptions}
                    defaultValue={visualizer.audiomotionanalyzer.frequencyScale}
                    label={t('visualizer.frequencyScale')}
                    onChange={(e) =>
                        updateProperty(
                            'frequencyScale',
                            (e || 'log') as 'bark' | 'linear' | 'log' | 'mel',
                        )
                    }
                />
            </Group>
        </Fieldset>
    );
};

const SensitivitySettings = () => {
    const { t } = useTranslation();
    const { updateProperty, visualizer } = useUpdateAudioMotionAnalyzer();

    const getWeightingFilterKey = (value: string) => {
        return value === '' ? 'none' : value.toLowerCase();
    };

    const translatedWeightingFilterOptions = useMemo(
        () =>
            weightingFilterOptions.map((option) => ({
                label: t(
                    `visualizer.options.weightingFilter.${getWeightingFilterKey(option.value)}`,
                ),
                value: option.value as string,
            })),
        [t],
    );

    return (
        <Fieldset legend={t('visualizer.sensitivity')}>
            <Group grow>
                <VisualizerSelect
                    data={translatedWeightingFilterOptions}
                    defaultValue={visualizer.audiomotionanalyzer.weightingFilter}
                    label={t('visualizer.weightingFilter')}
                    onChange={(e) =>
                        updateProperty('weightingFilter', e as 'A' | 'B' | 'C' | 'D' | 'Z')
                    }
                />
                <VisualizerSlider
                    defaultValue={visualizer.audiomotionanalyzer.minDecibels}
                    label={t('visualizer.minimumDecibels')}
                    max={-60}
                    min={-120}
                    onChangeEnd={(e) => updateProperty('minDecibels', e)}
                    step={1}
                />
                <VisualizerSlider
                    defaultValue={visualizer.audiomotionanalyzer.maxDecibels}
                    label={t('visualizer.maximumDecibels')}
                    max={0}
                    min={-40}
                    onChangeEnd={(e) => updateProperty('maxDecibels', e)}
                    step={1}
                />
            </Group>
        </Fieldset>
    );
};

const LinearAmplitudeSettings = () => {
    const { t } = useTranslation();
    const { updateProperty, visualizer } = useUpdateAudioMotionAnalyzer();

    const isLinearBoostDisabled = !visualizer.audiomotionanalyzer.linearAmplitude;

    return (
        <Fieldset legend={t('visualizer.linearAmplitude')}>
            <Group grow>
                <VisualizerToggle
                    label={t('visualizer.linearAmplitude')}
                    onChange={(value) => updateProperty('linearAmplitude', value)}
                    value={visualizer.audiomotionanalyzer.linearAmplitude}
                />
                <VisualizerSlider
                    defaultValue={visualizer.audiomotionanalyzer.linearBoost}
                    disabled={isLinearBoostDisabled}
                    label={t('visualizer.linearBoost')}
                    max={4}
                    min={1}
                    onChangeEnd={(e) => updateProperty('linearBoost', e)}
                    step={0.1}
                />
            </Group>
        </Fieldset>
    );
};

const PeakBehaviorSettings = () => {
    const { t } = useTranslation();
    const { updateProperty, visualizer } = useUpdateAudioMotionAnalyzer();

    const peakToggles = useMemo(
        () => [
            { label: t('visualizer.showPeaks'), value: 'showPeaks' },
            { label: t('visualizer.fadePeaks'), value: 'fadePeaks' },
            { label: t('visualizer.peakLine'), value: 'peakLine' },
        ],
        [t],
    );

    const isFadePeaksDisabled = !visualizer.audiomotionanalyzer.showPeaks;
    const isPeakLineDisabled = !visualizer.audiomotionanalyzer.showPeaks;
    const isGravityDisabled = !visualizer.audiomotionanalyzer.showPeaks;
    const isPeakFadeTimeDisabled =
        !visualizer.audiomotionanalyzer.showPeaks || !visualizer.audiomotionanalyzer.fadePeaks;
    const isPeakHoldTimeDisabled = !visualizer.audiomotionanalyzer.showPeaks;

    const isToggleDisabled = (toggle: (typeof peakToggles)[number]) => {
        if (toggle.value === 'fadePeaks') return isFadePeaksDisabled;
        if (toggle.value === 'peakLine') return isPeakLineDisabled;
        return false;
    };

    return (
        <Fieldset legend={t('visualizer.peakBehavior')}>
            <Stack>
                <Group grow>
                    {peakToggles.map((toggle) => (
                        <VisualizerToggle
                            disabled={isToggleDisabled(toggle)}
                            key={toggle.value}
                            label={toggle.label}
                            onChange={(value) =>
                                updateProperty(
                                    toggle.value as keyof typeof visualizer.audiomotionanalyzer,
                                    value,
                                )
                            }
                            value={visualizer.audiomotionanalyzer[toggle.value]}
                        />
                    ))}
                </Group>
                <Group grow>
                    <VisualizerSlider
                        defaultValue={visualizer.audiomotionanalyzer.gravity}
                        disabled={isGravityDisabled}
                        label={t('visualizer.gravity')}
                        max={20}
                        min={0.1}
                        onChangeEnd={(e) => updateProperty('gravity', e)}
                    />
                    <VisualizerSlider
                        defaultValue={visualizer.audiomotionanalyzer.peakFadeTime}
                        disabled={isPeakFadeTimeDisabled}
                        label={t('visualizer.peakFadeTime')}
                        max={2000}
                        min={0}
                        onChangeEnd={(e) => updateProperty('peakFadeTime', e)}
                        step={1}
                    />
                    <VisualizerSlider
                        defaultValue={visualizer.audiomotionanalyzer.peakHoldTime}
                        disabled={isPeakHoldTimeDisabled}
                        label={t('visualizer.peakHoldTime')}
                        max={1000}
                        min={0}
                        onChangeEnd={(e) => updateProperty('peakHoldTime', e)}
                        step={1}
                    />
                </Group>
            </Stack>
        </Fieldset>
    );
};

const RadialSpectrumSettings = () => {
    const { t } = useTranslation();
    const { updateProperty, visualizer } = useUpdateAudioMotionAnalyzer();

    const isRadialInvertDisabled = !visualizer.audiomotionanalyzer.radial;
    const isRadiusDisabled = !visualizer.audiomotionanalyzer.radial;
    const isSpinSpeedDisabled = !visualizer.audiomotionanalyzer.radial;

    return (
        <Fieldset legend={t('visualizer.radialSpectrum')}>
            <Group grow>
                <VisualizerToggle
                    label={t('visualizer.radial')}
                    onChange={(value) => updateProperty('radial', value)}
                    value={visualizer.audiomotionanalyzer.radial}
                />
                <VisualizerToggle
                    disabled={isRadialInvertDisabled}
                    label={t('visualizer.radialInvert')}
                    onChange={(value) => updateProperty('radialInvert', value)}
                    value={visualizer.audiomotionanalyzer.radialInvert}
                />
                <VisualizerSlider
                    defaultValue={visualizer.audiomotionanalyzer.radius}
                    disabled={isRadiusDisabled}
                    label={t('visualizer.radius')}
                    max={1}
                    min={0}
                    onChangeEnd={(e) => updateProperty('radius', e)}
                    step={0.05}
                />
                <VisualizerSlider
                    defaultValue={visualizer.audiomotionanalyzer.spinSpeed}
                    disabled={isSpinSpeedDisabled}
                    label={t('visualizer.spinSpeed')}
                    max={5}
                    min={-5}
                    onChangeEnd={(e) => updateProperty('spinSpeed', e)}
                    step={0.1}
                />
            </Group>
        </Fieldset>
    );
};

const ReflexMirrorSettings = () => {
    const { t } = useTranslation();
    const { updateProperty, visualizer } = useUpdateAudioMotionAnalyzer();

    return (
        <Fieldset legend={t('visualizer.reflexMirror')}>
            <Group grow>
                <VisualizerToggle
                    label={t('visualizer.reflexFit')}
                    onChange={(value) => updateProperty('reflexFit', value)}
                    value={visualizer.audiomotionanalyzer.reflexFit}
                />
                <VisualizerSlider
                    defaultValue={visualizer.audiomotionanalyzer.reflexRatio}
                    label={t('visualizer.reflexRatio')}
                    max={1}
                    min={0}
                    onChangeEnd={(e) => updateProperty('reflexRatio', e)}
                    step={0.1}
                />
                <VisualizerSlider
                    defaultValue={visualizer.audiomotionanalyzer.reflexAlpha}
                    label={t('visualizer.reflexAlpha')}
                    max={1}
                    min={0}
                    onChangeEnd={(e) => updateProperty('reflexAlpha', e)}
                    step={0.05}
                />
                <VisualizerSlider
                    defaultValue={visualizer.audiomotionanalyzer.reflexBright}
                    label={t('visualizer.reflexBrightness')}
                    max={2}
                    min={0}
                    onChangeEnd={(e) => updateProperty('reflexBright', e)}
                    step={0.1}
                />
                <VisualizerSlider
                    defaultValue={visualizer.audiomotionanalyzer.mirror}
                    label={t('visualizer.mirror')}
                    max={1}
                    min={-1}
                    onChangeEnd={(e) => updateProperty('mirror', e)}
                    step={1}
                />
            </Group>
        </Fieldset>
    );
};

const ToggleSettings = () => {
    const { t } = useTranslation();
    const { updateProperty, visualizer } = useUpdateAudioMotionAnalyzer();

    const AMA_TOGGLES = useMemo(
        () => [
            { label: t('visualizer.alphaBars'), value: 'alphaBars' },
            { label: t('visualizer.ansiBands'), value: 'ansiBands' },
            { label: t('visualizer.ledBars'), value: 'ledBars' },
            { label: t('visualizer.trueLeds'), value: 'trueLeds' },
            { label: t('visualizer.lumiBars'), value: 'lumiBars' },
            { label: t('visualizer.outlineBars'), value: 'outlineBars' },
            { label: t('visualizer.roundBars'), value: 'roundBars' },
            { label: t('visualizer.lowResolution'), value: 'loRes' },
            { label: t('visualizer.splitGradient'), value: 'splitGradient' },
            { label: t('visualizer.showFPS'), value: 'showFPS' },
            { label: t('visualizer.showScaleX'), value: 'showScaleX' },
            { label: t('visualizer.noteLabels'), value: 'noteLabels' },
            { label: t('visualizer.showScaleY'), value: 'showScaleY' },
        ],
        [t],
    );

    const isToggleDisabled = (toggle: (typeof AMA_TOGGLES)[number]) => {
        if (toggle.value === 'ledBars') return visualizer.audiomotionanalyzer.radial;
        if (toggle.value === 'trueLeds') return visualizer.audiomotionanalyzer.radial;
        if (toggle.value === 'lumiBars') return visualizer.audiomotionanalyzer.radial;
        if (toggle.value === 'noteLabels') return !visualizer.audiomotionanalyzer.showScaleX;
        if (toggle.value === 'outlineBars') return visualizer.audiomotionanalyzer.radial;
        if (toggle.value === 'roundBars') return visualizer.audiomotionanalyzer.radial;
        if (toggle.value === 'loRes') return visualizer.audiomotionanalyzer.radial;
        if (toggle.value === 'splitGradient') return visualizer.audiomotionanalyzer.radial;
        if (toggle.value === 'showFPS') return visualizer.audiomotionanalyzer.radial;
        return false;
    };

    return (
        <Fieldset legend={t('visualizer.miscellaneousSettings')}>
            <Group>
                {AMA_TOGGLES.map((toggle) => (
                    <VisualizerToggle
                        disabled={isToggleDisabled(toggle)}
                        key={toggle.value}
                        label={toggle.label}
                        onChange={(value) =>
                            updateProperty(
                                toggle.value as keyof typeof visualizer.audiomotionanalyzer,
                                value,
                            )
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

const ButterchurnGeneralSettings = () => {
    const { t } = useTranslation();
    const { updateProperty, visualizer } = useUpdateButterchurn();

    const presetOptions = useMemo(() => {
        const presets = butterchurnPresets;
        return Object.keys(presets).map((presetName) => ({
            label: presetName,
            value: presetName,
        }));
    }, []);

    return (
        <Fieldset legend={t('visualizer.general')}>
            <Stack>
                <Group grow>
                    <VisualizerSelect
                        data={presetOptions}
                        label={t('visualizer.selectPreset')}
                        onChange={(value) => {
                            updateProperty('currentPreset', value || undefined);
                        }}
                        value={visualizer.butterchurn.currentPreset}
                    />
                </Group>
                <Group grow>
                    <VisualizerSlider
                        defaultValue={visualizer.butterchurn.blendTime}
                        label={t('visualizer.blendTime')}
                        max={10}
                        min={0}
                        onChangeEnd={(e) => updateProperty('blendTime', e)}
                        step={0.1}
                    />
                    <VisualizerSlider
                        defaultValue={visualizer.butterchurn.maxFPS}
                        label={t('visualizer.maxFPS')}
                        max={144}
                        min={0}
                        onChangeEnd={(e) => updateProperty('maxFPS', e)}
                        step={1}
                    />
                    <VisualizerSlider
                        defaultValue={visualizer.butterchurn.opacity}
                        label={t('visualizer.opacity')}
                        max={1}
                        min={0}
                        onChangeEnd={(e) => updateProperty('opacity', e)}
                        step={0.01}
                    />
                </Group>
            </Stack>
        </Fieldset>
    );
};

const ButterChurnCycleSettings = () => {
    const { t } = useTranslation();
    const { updateProperty, visualizer } = useUpdateButterchurn();

    const presetOptions = useMemo(() => {
        const presets = butterchurnPresets;
        return Object.keys(presets).map((presetName) => ({
            label: presetName,
            value: presetName,
        }));
    }, []);

    return (
        <Fieldset legend={t('visualizer.cyclePresets')}>
            <Stack>
                <Group grow>
                    <VisualizerToggle
                        label={t('visualizer.cyclePresets')}
                        onChange={(checked) => updateProperty('cyclePresets', checked)}
                        value={visualizer.butterchurn.cyclePresets}
                    />
                    <VisualizerToggle
                        disabled={!visualizer.butterchurn.cyclePresets}
                        label={t('visualizer.includeAllPresets')}
                        onChange={(checked) => updateProperty('includeAllPresets', checked)}
                        value={visualizer.butterchurn.includeAllPresets}
                    />
                    <VisualizerToggle
                        disabled={!visualizer.butterchurn.cyclePresets}
                        label={t('visualizer.randomizeNextPreset')}
                        onChange={(checked) => updateProperty('randomizeNextPreset', checked)}
                        value={visualizer.butterchurn.randomizeNextPreset}
                    />
                </Group>
                <MultiSelect
                    data={presetOptions}
                    disabled={
                        !visualizer.butterchurn.cyclePresets ||
                        visualizer.butterchurn.includeAllPresets
                    }
                    label={t('visualizer.selectedPresets')}
                    onChange={(values) => updateProperty('selectedPresets', values)}
                    value={visualizer.butterchurn.selectedPresets}
                />
                <MultiSelect
                    data={presetOptions}
                    disabled={!visualizer.butterchurn.cyclePresets}
                    label={t('visualizer.ignoredPresets')}
                    onChange={(values) => updateProperty('ignoredPresets', values)}
                    value={visualizer.butterchurn.ignoredPresets}
                />

                <Group grow>
                    <VisualizerSlider
                        defaultValue={visualizer.butterchurn.cycleTime}
                        disabled={!visualizer.butterchurn.cyclePresets}
                        label={t('visualizer.cycleTime')}
                        max={300}
                        min={1}
                        onChangeEnd={(e) => updateProperty('cycleTime', e)}
                        step={1}
                    />
                </Group>
            </Stack>
        </Fieldset>
    );
};
