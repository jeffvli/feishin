import isElectron from 'is-electron';
import { memo, useCallback, useState } from 'react';
import {
    usePlaybackSettings,
    useSettingsStoreActions,
} from '/@/renderer/store/settings.store';
import {
    buildMpvAudioFilters,
    type CompressorSettings,
    type EqSettings as EqSettingsType,
} from './mpv-audio-filters';
import { Divider } from '/@/shared/components/divider/divider';
import { PlayerType } from '/@/shared/types/types';

const mpvPlayer = isElectron() ? window.api.mpvPlayer : null;

const BAND_LABELS = ['31.5', '63', '125', '250', '500', '1k', '2k', '3k', '4k', '6.3k', '10k', '16k'];

// ─── Built-in EQ presets ──────────────────────────────────────────────────────
const EQ_PRESETS: Record<string, number[]> = {
    'Flat':        [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    'Bass Boost':  [ 6,  5,  4,  2,  1,  0,  0,  0,  0,  0,  0,  0],
    'Bass Cut':    [-6, -5, -4, -2, -1,  0,  0,  0,  0,  0,  0,  0],
    'Treble Boost':[ 0,  0,  0,  0,  0,  0,  1,  2,  3,  4,  5,  6],
    'Treble Cut':  [ 0,  0,  0,  0,  0,  0, -1, -2, -3, -4, -5, -6],
    'V-Shape':     [ 5,  3,  1,  0, -1, -2, -2, -1,  0,  1,  3,  5],
    'Vocal Boost': [-1,  0,  1,  2,  3,  4,  4,  3,  2,  1,  0, -1],
    'Classical':   [ 0,  0,  0,  0,  0,  0, -1, -1,  0,  0,  0, -3],
    'Electronic':  [ 4,  3,  1,  0, -1,  0,  1,  0,  0,  2,  3,  4],
    'Rock':        [ 3,  2,  1,  0, -1,  0,  1,  2,  2,  2,  3,  3],
    'Pop':         [-1,  0,  2,  3,  3,  2,  0, -1, -1,  0,  0,  0],
    'Jazz':        [ 2,  1,  0,  1,  2,  2,  1,  0,  0,  1,  2,  2],
    'Hip-Hop':     [ 5,  4,  2,  1,  0, -1,  0,  1,  0,  1,  2,  3],
    'Acoustic':    [ 2,  2,  3,  2,  1,  0,  1,  2,  2,  2,  2,  1],
    'Loudness':    [ 5,  3,  1,  0, -1, -2, -2, -1,  0,  1,  3,  6],
};

// ─── Built-in compressor presets ─────────────────────────────────────────────
type CompressorPreset = Omit<CompressorSettings, 'enabled'>;
const COMP_PRESETS: Record<string, CompressorPreset> = {
    'Default':       { attack: 20,  knee: 2.83, makeup: 6,  ratio: 4,   release: 250,  threshold: -24 },
    'Light':         { attack: 30,  knee: 4,    makeup: 3,  ratio: 2,   release: 400,  threshold: -18 },
    'Moderate':      { attack: 20,  knee: 3,    makeup: 5,  ratio: 4,   release: 300,  threshold: -24 },
    'Heavy':         { attack: 10,  knee: 2,    makeup: 8,  ratio: 8,   release: 150,  threshold: -30 },
    'Limiter':       { attack: 1,   knee: 1,    makeup: 0,  ratio: 20,  release: 100,  threshold: -3  },
    'Broadcast':     { attack: 15,  knee: 3,    makeup: 6,  ratio: 5,   release: 200,  threshold: -20 },
    'Gentle':        { attack: 50,  knee: 6,    makeup: 2,  ratio: 1.5, release: 500,  threshold: -15 },
    'Loud Master':   { attack: 5,   knee: 2,    makeup: 10, ratio: 6,   release: 100,  threshold: -28 },
};

// ─── Storage helpers (localStorage, keyed separately from main store) ─────────
const LS_EQ_PRESETS  = 'feishin_eq_custom_presets';
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

// ─── Shared style tokens ──────────────────────────────────────────────────────
const BTN: React.CSSProperties = {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: 4,
    color: 'inherit',
    cursor: 'pointer',
    fontSize: 12,
    padding: '3px 10px',
};

const BTN_DANGER: React.CSSProperties = {
    ...BTN,
    border: '1px solid rgba(220,80,80,0.5)',
    color: 'rgba(220,80,80,0.9)',
};

const PANEL: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 8,
    padding: '14px 16px',
    width: '100%',
};

const ROW: React.CSSProperties = {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 8,
};

// ─── Vertical slider ──────────────────────────────────────────────────────────
function VerticalSlider({
    value, min, max, step, onChange, onRelease,
}: {
    value: number; min: number; max: number; step: number;
    onChange: (v: number) => void; onRelease: (v: number) => void;
}) {
    return (
        <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <input
        max={max}
        min={min}
        step={step}
        style={{
            cursor: 'pointer',
            height: 100,
            WebkitAppearance: 'slider-vertical',
            width: 24,
        } as React.CSSProperties}
        type="range"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onMouseUp={(e) => onRelease(Number((e.target as HTMLInputElement).value))}
        onTouchEnd={(e) => onRelease(Number((e.target as HTMLInputElement).value))}
        />
        </div>
    );
}

// ─── Horizontal slider ────────────────────────────────────────────────────────
function HSlider({
    value, min, max, step, onChange, onRelease, width = 160,
}: {
    value: number; min: number; max: number; step: number;
    onChange: (v: number) => void; onRelease: (v: number) => void;
    width?: number;
}) {
    return (
        <input
        max={max}
        min={min}
        step={step}
        style={{ cursor: 'pointer', flexShrink: 0, width }}
        type="range"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onMouseUp={(e) => onRelease(Number((e.target as HTMLInputElement).value))}
        onTouchEnd={(e) => onRelease(Number((e.target as HTMLInputElement).value))}
        />
    );
}

// ─── Toggle switch (inline, no Mantine dependency) ───────────────────────────
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
    return (
        <label style={{ alignItems: 'center', cursor: 'pointer', display: 'flex', gap: 10, userSelect: 'none' }}>
        <div
        style={{
            background: checked ? 'var(--primary-color, #3574fc)' : 'rgba(255,255,255,0.15)',
            borderRadius: 12,
            flexShrink: 0,
            height: 22,
            position: 'relative',
            transition: 'background 0.2s',
            width: 40,
        }}
        onClick={() => onChange(!checked)}
        >
        <div style={{
            background: '#fff',
            borderRadius: '50%',
            height: 16,
            left: checked ? 20 : 3,
            position: 'absolute',
            top: 3,
            transition: 'left 0.2s',
            width: 16,
        }} />
        </div>
        <span style={{ fontSize: 14, fontWeight: 500 }}>{label}</span>
        </label>
    );
}

// ─── Preset selector dropdown + save/delete ──────────────────────────────────
import { Select } from '/@/shared/components/select/select';

function PresetBar<T>({
    builtins,
    customs,
    onSelect,
    onSave,
    onDelete,
}: {
    builtins: Record<string, T>;
    customs: Record<string, T>;
    onSelect: (preset: T) => void;
    onSave: (name: string) => void;
    onDelete: (name: string) => void;
}) {
    const [saveName, setSaveName] = useState('');
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
    const builtinNames = Object.keys(builtins);
    const customNames = Object.keys(customs);

    const handlePresetChange = (name: string | null) => {
        if (!name) return;
        setSelectedPreset(name);
        const isCustom = name in customs;
        const preset = isCustom ? customs[name] : builtins[name];
        onSelect(preset);
    };

    const selectData = [
        {
            group: 'Built-in',
            items: builtinNames.map((name) => ({
                label: name,
                value: name,
            })),
        },
        {
            group: 'Custom ★',
            items: customNames.map((name) => ({
                label: name,
                value: name,
            })),
        },
    ].filter((group) => group.items.length > 0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Preset dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <label style={{ fontSize: 14, fontWeight: 500 }}>
        Preset:
        </label>
        <Select
        data={selectData}
        placeholder="-- Select a preset --"
        value={selectedPreset}
        onChange={handlePresetChange}
        searchable
        clearable
        width={200}
        />
        {selectedPreset && customNames.includes(selectedPreset) && (
            <button
            style={{ ...BTN_DANGER, fontSize: 12, padding: '6px 10px' }}
            title={`Delete "${selectedPreset}"`}
            onClick={() => {
                onDelete(selectedPreset);
                setSelectedPreset(null);
            }}
            >
            Delete
            </button>
        )}
        </div>

        {/* Save custom preset */}
        <div style={{ alignItems: 'center', display: 'flex', gap: 6 }}>
        <input
        placeholder="Save current as preset…"
        style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 4,
            color: 'inherit',
            fontSize: 12,
            outline: 'none',
            padding: '6px 8px',
            width: 200,
        }}
        type="text"
        value={saveName}
        onChange={(e) => setSaveName(e.target.value)}
        onKeyDown={(e) => {
            if (e.key === 'Enter' && saveName.trim()) {
                onSave(saveName.trim());
                setSaveName('');
            }
        }}
        />
        <button
        style={BTN}
        onClick={() => {
            if (saveName.trim()) {
                onSave(saveName.trim());
                setSaveName('');
            }
        }}
        >
        Save
        </button>
        </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export const EqSettings = memo(() => {
    const settings = usePlaybackSettings();
    const { setSettings } = useSettingsStoreActions();

    // Custom preset state (stored in localStorage, not Zustand)
    const [customEqPresets, setCustomEqPresets] = useState<Record<string, number[]>>(
        () => loadCustomPresets<number[]>(LS_EQ_PRESETS),
    );
    const [customCompPresets, setCustomCompPresets] = useState<Record<string, CompressorPreset>>(
        () => loadCustomPresets<CompressorPreset>(LS_COMP_PRESETS),
    );

    const applyFilters = useCallback(
        (eq: EqSettingsType, compressor: CompressorSettings) => {
            const filterStr = buildMpvAudioFilters(eq, compressor);
            mpvPlayer?.setProperties({ af: filterStr });
        },
        [],
    );

    // ── EQ handlers ────────────────────────────────────────────────────────────
    const handleEqToggle = (enabled: boolean) => {
        const newEq = { ...settings.equalizer, enabled };
        setSettings({ playback: { equalizer: newEq } });
        applyFilters(newEq, settings.compressor);
    };

    const handlePreampChange = (preamp: number) => {
        setSettings({ playback: { equalizer: { ...settings.equalizer, preamp } } });
    };
    const handlePreampRelease = (preamp: number) => {
        const newEq = { ...settings.equalizer, preamp };
        setSettings({ playback: { equalizer: newEq } });
        applyFilters(newEq, settings.compressor);
    };

    const handleBandChange = (index: number, gain: number) => {
        const newBands = settings.equalizer.bands.map((b, i) => i === index ? { ...b, gain } : b);
        setSettings({ playback: { equalizer: { ...settings.equalizer, bands: newBands } } });
    };
    const handleBandRelease = (index: number, gain: number) => {
        const newBands = settings.equalizer.bands.map((b, i) => i === index ? { ...b, gain } : b);
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

    const saveEqPreset = (name: string) => {
        const gains = settings.equalizer.bands.map((b) => b.gain);
        const updated = { ...customEqPresets, [name]: gains };
        setCustomEqPresets(updated);
        saveCustomPresets(LS_EQ_PRESETS, updated);
    };

    const deleteEqPreset = (name: string) => {
        const updated = { ...customEqPresets };
        delete updated[name];
        setCustomEqPresets(updated);
        saveCustomPresets(LS_EQ_PRESETS, updated);
    };

    const resetEq = () => {
        const newEq = {
            ...settings.equalizer,
            bands: settings.equalizer.bands.map((b) => ({ ...b, gain: 0 })),
                               preamp: 0,
        };
        setSettings({ playback: { equalizer: newEq } });
        applyFilters(newEq, settings.compressor);
    };

    // ── Compressor handlers ────────────────────────────────────────────────────
    const handleCompToggle = (enabled: boolean) => {
        const newComp = { ...settings.compressor, enabled };
        setSettings({ playback: { compressor: newComp } });
        applyFilters(settings.equalizer, newComp);
    };

    const handleCompChange = (key: keyof CompressorSettings, value: number) => {
        setSettings({ playback: { compressor: { ...settings.compressor, [key]: value } } });
    };
    const handleCompRelease = (key: keyof CompressorSettings, value: number) => {
        const newComp = { ...settings.compressor, [key]: value };
        setSettings({ playback: { compressor: newComp } });
        applyFilters(settings.equalizer, newComp);
    };

    const applyCompPreset = (preset: CompressorPreset) => {
        const newComp = { ...settings.compressor, ...preset };
        setSettings({ playback: { compressor: newComp } });
        applyFilters(settings.equalizer, newComp);
    };

    const saveCompPreset = (name: string) => {
        const { enabled, ...rest } = settings.compressor;
        const updated = { ...customCompPresets, [name]: rest };
        setCustomCompPresets(updated);
        saveCustomPresets(LS_COMP_PRESETS, updated);
    };

    const deleteCompPreset = (name: string) => {
        const updated = { ...customCompPresets };
        delete updated[name];
        setCustomCompPresets(updated);
        saveCustomPresets(LS_COMP_PRESETS, updated);
    };

    const resetComp = () => {
        const newComp = { attack: 20, enabled: settings.compressor.enabled, knee: 2.83, makeup: 6, ratio: 4, release: 250, threshold: -24 };
        setSettings({ playback: { compressor: newComp } });
        applyFilters(settings.equalizer, newComp);
    };

    const isLocal = settings.type === PlayerType.LOCAL;
    if (!isLocal) return null;

    const compParams: { key: keyof CompressorSettings; label: string; max: number; min: number; step: number; unit: string }[] = [
        { key: 'threshold', label: 'Threshold', max: 0,    min: -60, step: 1,   unit: 'dB' },
        { key: 'ratio',     label: 'Ratio',     max: 20,   min: 1,   step: 0.5, unit: ':1' },
        { key: 'attack',    label: 'Attack',    max: 2000, min: 0.1, step: 1,   unit: 'ms' },
        { key: 'release',   label: 'Release',   max: 9000, min: 1,   step: 10,  unit: 'ms' },
        { key: 'makeup',    label: 'Makeup',    max: 30,   min: 0,   step: 0.5, unit: 'dB' },
        { key: 'knee',      label: 'Knee',      max: 10,   min: 1,   step: 0.5, unit: 'dB' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, width: '100%' }}>
        <Divider />

        {/* ══════════ EQUALIZER PANEL ══════════ */}
        <div style={{ padding: '16px 20px', width: '100%' }}>
        <div style={PANEL}>
        {/* Header row */}
        <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <Toggle
        checked={settings.equalizer.enabled}
        label="Equalizer"
        onChange={handleEqToggle}
        />
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
        Graphical EQ · FFmpeg lavfi · MPV only
        </span>
        </div>

        {settings.equalizer.enabled && (
            <>
            {/* Presets */}
            <div style={{ marginBottom: 14 }}>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 6, textTransform: 'uppercase' }}>
            Presets
            </div>
            <PresetBar
            builtins={EQ_PRESETS}
            customs={customEqPresets}
            onDelete={deleteEqPreset}
            onSave={saveEqPreset}
            onSelect={(gains) => applyEqPreset(gains)}
            />
            </div>

            <div style={{ background: 'rgba(255,255,255,0.06)', height: 1, margin: '12px 0' }} />

            {/* Preamp row */}
            <div style={{ ...ROW, marginBottom: 16 }}>
            <span style={{ fontSize: 13, minWidth: 64 }}>Preamp</span>
            <HSlider
            max={12}
            min={-12}
            step={0.5}
            value={settings.equalizer.preamp}
            width={200}
            onChange={handlePreampChange}
            onRelease={handlePreampRelease}
            />
            <span style={{ fontSize: 13, minWidth: 52, textAlign: 'right' }}>
            {settings.equalizer.preamp > 0 ? `+${settings.equalizer.preamp}` : settings.equalizer.preamp} dB
            </span>
            <button style={BTN} onClick={resetEq}>Reset all</button>
            </div>

            {/* Band sliders — full width, evenly distributed */}
            <div style={{
                display: 'grid',
                gap: 4,
                gridTemplateColumns: `repeat(${settings.equalizer.bands.length}, 1fr)`,
                                        width: '100%',
            }}>
            {settings.equalizer.bands.map((band, i) => (
                <div
                key={band.freq}
                style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 3 }}
                >
                <span style={{ fontSize: 11, height: 16, lineHeight: '16px', textAlign: 'center' }}>
                {band.gain > 0 ? `+${band.gain}` : band.gain}
                </span>
                <VerticalSlider
                max={12}
                min={-12}
                step={0.5}
                value={band.gain}
                onChange={(v) => handleBandChange(i, v)}
                onRelease={(v) => handleBandRelease(i, v)}
                />
                {/* Zero-line tick */}
                <div style={{ background: 'rgba(255,255,255,0.2)', height: 1, width: '60%' }} />
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, textAlign: 'center' }}>
                {BAND_LABELS[i]}
                </span>
                </div>
            ))}
            </div>
            </>
        )}
        </div>
        </div>

        <Divider />

        {/* ══════════ COMPRESSOR PANEL ══════════ */}
        <div style={{ padding: '16px 20px', width: '100%' }}>
        <div style={PANEL}>
        {/* Header row */}
        <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <Toggle
        checked={settings.compressor.enabled}
        label="Compressor"
        onChange={handleCompToggle}
        />
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
        Dynamic range · FFmpeg acompressor · MPV only
        </span>
        </div>

        {settings.compressor.enabled && (
            <>
            {/* Presets */}
            <div style={{ marginBottom: 14 }}>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 6, textTransform: 'uppercase' }}>
            Presets
            </div>
            <PresetBar
            builtins={COMP_PRESETS}
            customs={customCompPresets}
            onDelete={deleteCompPreset}
            onSave={saveCompPreset}
            onSelect={applyCompPreset}
            />
            </div>

            <div style={{ background: 'rgba(255,255,255,0.06)', height: 1, margin: '12px 0' }} />

            {/* Parameter sliders */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {compParams.map(({ key, label, min, max, step, unit }) => {
                const val = settings.compressor[key] as number;
                return (
                    <div key={key} style={ROW}>
                    <span style={{ fontSize: 13, minWidth: 84 }}>{label}</span>
                    <HSlider
                    max={max}
                    min={min}
                    step={step}
                    value={val}
                    width={220}
                    onChange={(v) => handleCompChange(key, v)}
                    onRelease={(v) => handleCompRelease(key, v)}
                    />
                    <span style={{ fontSize: 13, minWidth: 72, textAlign: 'right' }}>
                    {val}{unit}
                    </span>
                    </div>
                );
            })}
            </div>

            <div style={{ marginTop: 12 }}>
            <button style={BTN} onClick={resetComp}>Reset to defaults</button>
            </div>
            </>
        )}
        </div>
        </div>
        </div>
    );
});
