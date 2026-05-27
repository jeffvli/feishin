import isElectron from 'is-electron';
import { memo, useCallback, useContext, useEffect, useRef, useState } from 'react';

import {
    buildMpvAudioFilters,
    type CompressorSettings,
    type EqSettings as EqSettingsType,
} from './mpv-audio-filters';

import { WebAudioContext } from '/@/renderer/features/player/context/webaudio-context';
import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { usePlaybackSettings, useSettingsStoreActions } from '/@/renderer/store/settings.store';
import { Button } from '/@/shared/components/button/button';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { Select } from '/@/shared/components/select/select';
import { Slider } from '/@/shared/components/slider/slider';
import { Stack } from '/@/shared/components/stack/stack';
import { Switch } from '/@/shared/components/switch/switch';
import { Text } from '/@/shared/components/text/text';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { PlayerType } from '/@/shared/types/types';

const mpvPlayer = isElectron() ? window.api.mpvPlayer : null;

const BAND_LABELS = [
    '31.5',
'63',
'125',
'250',
'500',
'1k',
'2k',
'3k',
'4k',
'6.3k',
'10k',
'16k',
];

// ─── Built-in EQ presets ──────────────────────────────────────────────────────
const EQ_PRESETS: Record<string, number[]> = {
    Acoustic: [2, 2, 3, 2, 1, 0, 1, 2, 2, 2, 2, 1],
    'Bass Boost': [6, 5, 4, 2, 1, 0, 0, 0, 0, 0, 0, 0],
    'Bass Cut': [-6, -5, -4, -2, -1, 0, 0, 0, 0, 0, 0, 0],
    Classical: [0, 0, 0, 0, 0, 0, -1, -1, 0, 0, 0, -3],
    Electronic: [4, 3, 1, 0, -1, 0, 1, 0, 0, 2, 3, 4],
    Flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    'Hip-Hop': [5, 4, 2, 1, 0, -1, 0, 1, 0, 1, 2, 3],
    Jazz: [2, 1, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2],
    Loudness: [5, 3, 1, 0, -1, -2, -2, -1, 0, 1, 3, 6],
    Pop: [-1, 0, 2, 3, 3, 2, 0, -1, -1, 0, 0, 0],
    Rock: [3, 2, 1, 0, -1, 0, 1, 2, 2, 2, 3, 3],
    'Treble Boost': [0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6],
    'Treble Cut': [0, 0, 0, 0, 0, 0, -1, -2, -3, -4, -5, -6],
    'V-Shape': [5, 3, 1, 0, -1, -2, -2, -1, 0, 1, 3, 5],
    'Vocal Boost': [-1, 0, 1, 2, 3, 4, 4, 3, 2, 1, 0, -1],
};

// ─── Built-in compressor presets ─────────────────────────────────────────────
type CompressorPreset = Omit<CompressorSettings, 'enabled'>;
const COMP_PRESETS: Record<string, CompressorPreset> = {
    Broadcast: { attack: 15, knee: 3, makeup: 6, ratio: 5, release: 200, threshold: -20 },
    Default: { attack: 20, knee: 2.83, makeup: 6, ratio: 4, release: 250, threshold: -24 },
    Gentle: { attack: 50, knee: 6, makeup: 2, ratio: 1.5, release: 500, threshold: -15 },
    Heavy: { attack: 10, knee: 2, makeup: 8, ratio: 8, release: 150, threshold: -30 },
    Light: { attack: 30, knee: 4, makeup: 3, ratio: 2, release: 400, threshold: -18 },
    Limiter: { attack: 1, knee: 1, makeup: 0, ratio: 20, release: 100, threshold: -3 },
    'Loud Master': { attack: 5, knee: 2, makeup: 10, ratio: 6, release: 100, threshold: -28 },
    Moderate: { attack: 20, knee: 3, makeup: 5, ratio: 4, release: 300, threshold: -24 },
};

// ─── Storage helpers ──────────────────────────────────────────────────────────
const LS_EQ_PRESETS = 'feishin_eq_custom_presets';
const LS_COMP_PRESETS = 'feishin_comp_custom_presets';

function loadCustomPresets<T>(key: string): Record<string, T> {
    try {
        return JSON.parse(localStorage.getItem(key) || '{}');
    } catch {
        return {};
    }
}

function saveCustomPresets<T>(key: string, presets: Record<string, T>) {
    localStorage.setItem(key, JSON.stringify(presets));
}

// ─── Vertical EQ band slider ──────────────────────────────────────────────────
// Mantine v8 does not support orientation="vertical" on Slider (added in v9).
// We rotate the existing themed Slider 270deg so it inherits all app theme
// tokens (thumb colour, track, label) without any custom styling.
// The outer div is sized to the slider's rendered height so the rotated
// element does not overflow its grid cell.
const SLIDER_WIDTH = 120;
const SLIDER_HEIGHT = 28;

function EqBandSlider({
    freq,
    gain,
    label,
    onChangeEnd,
}: {
    freq: number;
    gain: number;
    label: string;
    onChangeEnd: (v: number) => void;
}) {
    return (
        <Stack align="center" gap={4}>
        <Text size="xs" style={{ minHeight: 16, textAlign: 'center' }}>
        {gain > 0 ? `+${gain}` : gain}
        </Text>
        {/* Outer div reserves space for the rotated slider */}
        <div style={{ height: SLIDER_WIDTH, position: 'relative', width: SLIDER_HEIGHT }}>
        <Slider
        key={`${freq}-${gain}`}
        defaultValue={gain}
        label={(v) => `${v > 0 ? '+' : ''}${v} dB`}
        max={12}
        min={-12}
        step={0.5}
        style={{
            left: '50%',
            position: 'absolute',
            top: '50%',
            transform: 'translate(-50%, -50%) rotate(270deg)',
            width: SLIDER_WIDTH,
        }}
        onChangeEnd={onChangeEnd}
        />
        </div>
        <Text isMuted size="xs" style={{ textAlign: 'center' }}>
        {label}
        </Text>
        </Stack>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export const EqSettings = memo(() => {
    const settings = usePlaybackSettings();
    const { setSettings } = useSettingsStoreActions();

    // Ref pattern to avoid stale closure when reading webAudio DSP nodes.
    // webAudio?.dsp is undefined at callback creation time and the closure
    // would capture that undefined value even after AudioContext initialises.
    const webAudioContext = useContext(WebAudioContext);
    const webAudioContextRef = useRef(webAudioContext);
    useEffect(() => {
        webAudioContextRef.current = webAudioContext;
    }, [webAudioContext]);

    // Custom preset state — stored in localStorage separately from main store
    const [customEqPresets, setCustomEqPresets] = useState<Record<string, number[]>>(() =>
    loadCustomPresets<number[]>(LS_EQ_PRESETS),
    );
    const [customCompPresets, setCustomCompPresets] = useState<Record<string, CompressorPreset>>(
        () => loadCustomPresets<CompressorPreset>(LS_COMP_PRESETS),
    );
    const [saveEqName, setSaveEqName] = useState('');
    const [saveCompName, setSaveCompName] = useState('');

    const applyFilters = useCallback(
        (eq: EqSettingsType, compressor: CompressorSettings) => {
            // ── MPV player ────────────────────────────────────────────────
            if (settings.type === PlayerType.LOCAL) {
                const filterStr = buildMpvAudioFilters(eq, compressor);
                mpvPlayer?.setProperties({ af: filterStr });
                return;
            }

            // ── Web Audio player ──────────────────────────────────────────
            // Read from ref so we always get the current AudioContext state,
            // not the stale value captured when this callback was created.
            const dsp = webAudioContextRef.current.webAudio?.dsp;
            if (!dsp) return;

            // Mutations to Web Audio API AudioParam values are intentional
            // side effects on the live audio graph, not React state mutations.
            // eslint-disable-next-line react-hooks/immutability
            dsp.preampGain.gain.value = eq.enabled ? Math.pow(10, eq.preamp / 20) : 1;

            dsp.eqFilters.forEach((filter, i) => {
                const band = eq.bands[i];
                if (band) {
                    filter.gain.value = eq.enabled ? band.gain : 0;
                }
            });

            if (compressor.enabled) {
                dsp.compressor.threshold.value = compressor.threshold;
                dsp.compressor.ratio.value = compressor.ratio;
                dsp.compressor.attack.value = compressor.attack / 1000;
                dsp.compressor.release.value = compressor.release / 1000;
                dsp.compressor.knee.value = compressor.knee;
            } else {
                dsp.compressor.threshold.value = 0;
                dsp.compressor.ratio.value = 1;
                dsp.compressor.attack.value = 0;
                dsp.compressor.release.value = 0.25;
                dsp.compressor.knee.value = 0;
            }
        },
        // settings.type is the only reactive dep — webAudioContextRef is a
        // stable ref that always holds the latest context value.
        [settings.type],
    );

    // Re-apply filters when switching to Web Audio so DSP nodes reflect
    // persisted settings immediately without requiring a slider interaction.
    useEffect(() => {
        if (settings.type === PlayerType.WEB) {
            applyFilters(settings.equalizer, settings.compressor);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [settings.type]);

    // ── EQ handlers ──────────────────────────────────────────────────────────
    const handleEqToggle = (enabled: boolean) => {
        const newEq = { ...settings.equalizer, enabled };
        setSettings({ playback: { equalizer: newEq } });
        applyFilters(newEq, settings.compressor);
    };

    const handlePreampChangeEnd = (preamp: number) => {
        const newEq = { ...settings.equalizer, preamp };
        setSettings({ playback: { equalizer: newEq } });
        applyFilters(newEq, settings.compressor);
    };

    const handleBandChangeEnd = (index: number, gain: number) => {
        const newBands = settings.equalizer.bands.map((b, i) =>
        i === index ? { ...b, gain } : b,
        );
        const newEq = { ...settings.equalizer, bands: newBands };
        setSettings({ playback: { equalizer: newEq } });
        applyFilters(newEq, settings.compressor);
    };

    const applyEqPreset = (gains: number[]) => {
        const newBands = settings.equalizer.bands.map((b, i) => ({ ...b, gain: gains[i] ?? 0 }));
        const newEq = { ...settings.equalizer, bands: newBands, preamp: 0 };
        setSettings({ playback: { equalizer: newEq } });
        applyFilters(newEq, settings.compressor);
    };

    const handleSaveEqPreset = () => {
        const name = saveEqName.trim();
        if (!name) return;
        const gains = settings.equalizer.bands.map((b) => b.gain);
        const updated = { ...customEqPresets, [name]: gains };
        setCustomEqPresets(updated);
        saveCustomPresets(LS_EQ_PRESETS, updated);
        setSaveEqName('');
    };

    const handleDeleteEqPreset = (name: string) => {
        const updated = { ...customEqPresets };
        delete updated[name];
        setCustomEqPresets(updated);
        saveCustomPresets(LS_EQ_PRESETS, updated);
    };

    const handleResetEq = () => {
        const newEq = {
            ...settings.equalizer,
            bands: settings.equalizer.bands.map((b) => ({ ...b, gain: 0 })),
                               preamp: 0,
        };
        setSettings({ playback: { equalizer: newEq } });
        applyFilters(newEq, settings.compressor);
    };

    // ── Compressor handlers ───────────────────────────────────────────────────
    const handleCompToggle = (enabled: boolean) => {
        const newComp = { ...settings.compressor, enabled };
        setSettings({ playback: { compressor: newComp } });
        applyFilters(settings.equalizer, newComp);
    };

    const handleCompChangeEnd = (key: keyof CompressorSettings, value: number) => {
        const newComp = { ...settings.compressor, [key]: value };
        setSettings({ playback: { compressor: newComp } });
        applyFilters(settings.equalizer, newComp);
    };

    const applyCompPreset = (preset: CompressorPreset) => {
        const newComp = { ...settings.compressor, ...preset };
        setSettings({ playback: { compressor: newComp } });
        applyFilters(settings.equalizer, newComp);
    };

    const handleSaveCompPreset = () => {
        const name = saveCompName.trim();
        if (!name) return;
        const rest = Object.fromEntries(
            Object.entries(settings.compressor).filter(([key]) => key !== 'enabled'),
        ) as CompressorPreset;
        const updated = { ...customCompPresets, [name]: rest };
        setCustomCompPresets(updated);
        saveCustomPresets(LS_COMP_PRESETS, updated);
        setSaveCompName('');
    };

    const handleDeleteCompPreset = (name: string) => {
        const updated = { ...customCompPresets };
        delete updated[name];
        setCustomCompPresets(updated);
        saveCustomPresets(LS_COMP_PRESETS, updated);
    };

    const handleResetComp = () => {
        const newComp = {
            attack: 20,
            enabled: settings.compressor.enabled,
            knee: 2.83,
            makeup: 6,
            ratio: 4,
            release: 250,
            threshold: -24,
        };
        setSettings({ playback: { compressor: newComp } });
        applyFilters(settings.equalizer, newComp);
    };

    // ── Preset select data ────────────────────────────────────────────────────
    const eqPresetSelectData = [
        {
            group: 'Built-in',
            items: Object.keys(EQ_PRESETS).map((name) => ({ label: name, value: name })),
        },
        ...(Object.keys(customEqPresets).length > 0
        ? [
            {
                group: 'Custom',
                items: Object.keys(customEqPresets).map((name) => ({
                    label: name,
                    value: name,
                })),
            },
        ]
        : []),
    ];

    const compPresetSelectData = [
        {
            group: 'Built-in',
            items: Object.keys(COMP_PRESETS).map((name) => ({ label: name, value: name })),
        },
        ...(Object.keys(customCompPresets).length > 0
        ? [
            {
                group: 'Custom',
                items: Object.keys(customCompPresets).map((name) => ({
                    label: name,
                    value: name,
                })),
            },
        ]
        : []),
    ];

    // ── EQ SettingsSection options ────────────────────────────────────────────
    const eqOptions: SettingOption[] = [
        {
            control: (
                <Switch
                defaultChecked={settings.equalizer.enabled}
                onChange={(e) => handleEqToggle(e.currentTarget.checked)}
                />
            ),
            description:
            settings.type === PlayerType.LOCAL
            ? 'Parametric equalizer via FFmpeg lavfi (MPV)'
            : 'Parametric equalizer via Web Audio API',
            title: 'Equalizer',
        },
        ...(settings.equalizer.enabled
        ? ([
            {
                control: (
                    <Group gap="xs">
                    <Select
                    clearable
                    data={eqPresetSelectData}
                    onChange={(name) => {
                        if (!name) return;
                        const preset =
                        customEqPresets[name] ?? EQ_PRESETS[name];
                        if (preset) applyEqPreset(preset);
                    }}
                    placeholder="Select preset"
                    searchable
                    value={null}
                    w={180}
                    />
                    {Object.keys(customEqPresets).length > 0 && (
                        <Select
                        clearable
                        data={Object.keys(customEqPresets).map((name) => ({
                            label: name,
                            value: name,
                        }))}
                        onChange={(name) => {
                            if (!name) return;
                            handleDeleteEqPreset(name);
                        }}
                        placeholder="Delete custom..."
                        value={null}
                        w={160}
                        />
                    )}
                    </Group>
                ),
                description: 'Apply a built-in or saved custom EQ curve',
                title: 'Preset',
            },
           {
               control: (
                   <Group gap="xs">
                   <TextInput
                   onChange={(e) => setSaveEqName(e.currentTarget.value)}
                   onKeyDown={(e) => {
                       if (e.key === 'Enter') handleSaveEqPreset();
                   }}
                   placeholder="Preset name..."
                   value={saveEqName}
                   w={180}
                   />
                   <Button
                   disabled={!saveEqName.trim()}
                   variant="subtle"
                   onClick={handleSaveEqPreset}
                   >
                   Save
                   </Button>
                   </Group>
               ),
               description: 'Save current EQ settings as a named preset',
               title: 'Save preset',
           },
           {
               control: (
                   <Group gap="xs">
                   <Slider
                   key={settings.equalizer.preamp}
                   defaultValue={settings.equalizer.preamp}
                   label={(v) => `${v > 0 ? '+' : ''}${v} dB`}
                   max={12}
                   min={-12}
                   step={0.5}
                   w={200}
                   onChangeEnd={handlePreampChangeEnd}
                   />
                   <Button variant="subtle" onClick={handleResetEq}>
                   Reset all
                   </Button>
                   </Group>
               ),
               description:
               'Input gain before EQ bands. Set negative when boosting bands to prevent clipping (MPV).',
           title: 'Preamp',
           },
           {
               control: (
                   // Mantine v8 does not support orientation="vertical" on Slider.
                   // Each band slider is rotated 270deg via CSS transform so it
                   // renders vertically while inheriting all app theme tokens.
                   // The outer div reserves the correct amount of space so the
                   // rotated element does not overflow its grid cell.
                   <Group align="flex-end" gap={2} wrap="nowrap">
                   {settings.equalizer.bands.map((band, i) => (
                       <EqBandSlider
                       key={band.freq}
                       freq={band.freq}
                       gain={band.gain}
                       label={BAND_LABELS[i] ?? String(band.freq)}
                       onChangeEnd={(v) => handleBandChangeEnd(i, v)}
                       />
                   ))}
                   </Group>
               ),
               description: 'Per-band gain adjustment. Range: -12 to +12 dB.',
               title: 'Bands',
           },
        ] as SettingOption[])
        : []),
    ];

    // ── Compressor SettingsSection options ────────────────────────────────────
    const compParams: {
        description: string;
        key: keyof CompressorSettings;
        max: number;
        min: number;
        step: number;
        title: string;
        unit: string;
    }[] = [
        {
            description: 'Signal level above which compression begins.',
            key: 'threshold',
            max: 0,
            min: -60,
            step: 1,
            title: 'Threshold',
            unit: 'dB',
        },
        {
            description: 'Compression ratio, e.g. 4 = 4:1.',
            key: 'ratio',
            max: 20,
            min: 1,
            step: 0.5,
            title: 'Ratio',
            unit: ':1',
        },
        {
            description:
            'How quickly the compressor engages after the signal exceeds the threshold.',
            key: 'attack',
            max: 2000,
            min: 0.1,
            step: 1,
            title: 'Attack',
            unit: 'ms',
        },
        {
            description:
            'How quickly the compressor releases after the signal drops below the threshold.',
            key: 'release',
            max: 9000,
            min: 1,
            step: 10,
            title: 'Release',
            unit: 'ms',
        },
        {
            description: 'Output gain applied after compression to restore loudness.',
            key: 'makeup',
            max: 30,
            min: 0,
            step: 0.5,
            title: 'Makeup Gain',
            unit: 'dB',
        },
        {
            description:
            'Soft-knee width. Higher values make the transition into compression more gradual.',
            key: 'knee',
            max: 10,
            min: 1,
            step: 0.5,
            title: 'Knee',
            unit: 'dB',
        },
    ];

    const compressorOptions: SettingOption[] = [
        {
            control: (
                <Switch
                defaultChecked={settings.compressor.enabled}
                onChange={(e) => handleCompToggle(e.currentTarget.checked)}
                />
            ),
            description:
            settings.type === PlayerType.LOCAL
            ? 'Dynamic range compressor via FFmpeg acompressor (MPV)'
            : 'Dynamic range compressor via Web Audio API',
            title: 'Compressor',
        },
        ...(settings.compressor.enabled
        ? ([
            {
                control: (
                    <Group gap="xs">
                    <Select
                    clearable
                    data={compPresetSelectData}
                    onChange={(name) => {
                        if (!name) return;
                        const preset =
                        customCompPresets[name] ?? COMP_PRESETS[name];
                        if (preset) applyCompPreset(preset);
                    }}
                    placeholder="Select preset"
                    searchable
                    value={null}
                    w={180}
                    />
                    {Object.keys(customCompPresets).length > 0 && (
                        <Select
                        clearable
                        data={Object.keys(customCompPresets).map((name) => ({
                            label: name,
                            value: name,
                        }))}
                        onChange={(name) => {
                            if (!name) return;
                            handleDeleteCompPreset(name);
                        }}
                        placeholder="Delete custom..."
                        value={null}
                        w={160}
                        />
                    )}
                    </Group>
                ),
                description: 'Apply a built-in or saved custom compressor setting',
                title: 'Preset',
            },
           {
               control: (
                   <Group gap="xs">
                   <TextInput
                   onChange={(e) => setSaveCompName(e.currentTarget.value)}
                   onKeyDown={(e) => {
                       if (e.key === 'Enter') handleSaveCompPreset();
                   }}
                   placeholder="Preset name..."
                   value={saveCompName}
                   w={180}
                   />
                   <Button
                   disabled={!saveCompName.trim()}
                   variant="subtle"
                   onClick={handleSaveCompPreset}
                   >
                   Save
                   </Button>
                   </Group>
               ),
               description: 'Save current compressor settings as a named preset',
               title: 'Save preset',
           },
           ...compParams.map(({ key, title, description, min, max, step, unit }) => ({
               control: (
                   <Group align="center" gap="xs">
                   <Slider
                   key={settings.compressor[key] as number}
                   defaultValue={settings.compressor[key] as number}
                   label={(v) => `${v}${unit}`}
                   max={max}
                   min={min}
                   step={step}
                   w={200}
                   onChangeEnd={(v) => handleCompChangeEnd(key, v)}
                   />
                   <Text isMuted size="xs" style={{ minWidth: 52, textAlign: 'right' }}>
                   {settings.compressor[key] as number}
                   {unit}
                   </Text>
                   </Group>
               ),
               description,
               title,
           })),
           {
               control: (
                   <Button variant="subtle" onClick={handleResetComp}>
                   Reset to defaults
                   </Button>
               ),
               description: 'Restore all compressor parameters to their default values',
               title: 'Reset',
           },
        ] as SettingOption[])
        : []),
    ];

    return (
        <>
        <Divider />
        <SettingsSection options={eqOptions} />
        <Divider />
        <SettingsSection options={compressorOptions} />
        </>
    );
});
