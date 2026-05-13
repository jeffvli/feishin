import type { TFunction } from 'i18next';

import { useState } from 'react';

import styles from './equalizer-modal.module.css';
import { EqualizerPreset } from './equalizer.types';
import { BUILTIN_PRESETS } from './presets';

import { Button } from '/@/shared/components/button/button';
import { Select } from '/@/shared/components/select/select';
import { TextInput } from '/@/shared/components/text-input/text-input';

interface Props {
    activeId: null | string;
    customPresets: EqualizerPreset[];
    onDelete: (id: string) => void;
    onSave: (name: string) => void;
    onSelect: (id: string) => void;
    t: TFunction;
}

export const PresetMenu = ({ activeId, customPresets, onDelete, onSave, onSelect, t }: Props) => {
    const [savingOpen, setSavingOpen] = useState(false);
    const [name, setName] = useState('');

    const data = [
        ...BUILTIN_PRESETS.map((p) => ({ label: t(p.name), value: p.id })),
        ...customPresets.map((p) => ({ label: p.name, value: p.id })),
    ];
    const selectValue = activeId ?? 'custom-marker';
    const customRow = activeId
        ? []
        : [{ disabled: true, label: t('equalizer.custom'), value: 'custom-marker' }];

    return (
        <div>
            <Select
                aria-label={t('equalizer.preset')}
                data={[...customRow, ...data]}
                onChange={(v) => {
                    if (v && v !== 'custom-marker') onSelect(v);
                }}
                value={selectValue}
            />
            {!savingOpen && (
                <Button onClick={() => setSavingOpen(true)} variant="default">
                    {t('equalizer.saveAs')}
                </Button>
            )}
            {savingOpen && (
                <>
                    <TextInput
                        aria-label={t('equalizer.saveDialogName')}
                        onChange={(e: any) => setName(typeof e === 'string' ? e : e.target.value)}
                        value={name}
                    />
                    <Button
                        disabled={!name.trim()}
                        onClick={() => {
                            onSave(name.trim());
                            setName('');
                            setSavingOpen(false);
                        }}
                    >
                        {t('equalizer.saveDialogTitle')}
                    </Button>
                </>
            )}
            {customPresets.length > 0 && (
                <ul className={styles.customPresetList}>
                    {customPresets.map((p) => (
                        <li className={styles.customPresetRow} key={p.id}>
                            <span className={styles.customPresetName}>{p.name}</span>
                            <Button
                                aria-label={`${t('equalizer.deletePresetLabel')}-${p.name}`}
                                onClick={() => onDelete(p.id)}
                                variant="subtle"
                            >
                                ×
                            </Button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
