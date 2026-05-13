import type { TFunction } from 'i18next';

import { Modal } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import { BandSlider } from './BandSlider';
import styles from './equalizer-modal.module.css';
import { useEqualizerActions, useEqualizerState } from './equalizer.actions';
import { EQ_FREQUENCIES } from './equalizer.types';
import { PresetMenu } from './PresetMenu';

import { Button } from '/@/shared/components/button/button';
import { Switch } from '/@/shared/components/switch/switch';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const formatBandLabel = (hz: number, t: TFunction): string =>
    hz >= 1000
        ? t('equalizer.bandLabelKHz', { frequency: hz / 1000 })
        : t('equalizer.bandLabelHz', { frequency: hz });

export const EqualizerModal = ({ isOpen, onClose }: Props) => {
    const { t } = useTranslation();
    const state = useEqualizerState();
    const actions = useEqualizerActions();

    return (
        <Modal onClose={onClose} opened={isOpen} size="xl" title={t('equalizer.title')}>
            <div className={styles.header}>
                <PresetMenu
                    activeId={state.activePresetId}
                    customPresets={state.customPresets}
                    onDelete={actions.deleteCustomPreset}
                    onSave={actions.saveCustomPreset}
                    onSelect={actions.applyPreset}
                    t={t}
                />
                <Switch
                    aria-label={t('equalizer.enabled')}
                    checked={state.enabled}
                    label={t('equalizer.enabled')}
                    onChange={(e: any) => actions.setEnabled(e.currentTarget.checked)}
                />
            </div>

            <div className={styles.bands}>
                <BandSlider
                    label={t('equalizer.preamp')}
                    onChange={actions.setPreamp}
                    valueDb={state.preamp}
                />
                <div aria-hidden="true" className={styles.divider} />
                {EQ_FREQUENCIES.map((freq, i) => (
                    <BandSlider
                        key={freq}
                        label={formatBandLabel(freq, t)}
                        onChange={(db) => actions.setBand(i, db)}
                        valueDb={state.bands[i]}
                    />
                ))}
            </div>

            <div className={styles.footer}>
                <Button onClick={actions.reset} variant="default">
                    {t('equalizer.reset')}
                </Button>
            </div>
        </Modal>
    );
};
