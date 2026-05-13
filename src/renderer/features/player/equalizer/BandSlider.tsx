import styles from './equalizer-modal.module.css';
import { EQ_GAIN_MAX, EQ_GAIN_MIN } from './equalizer.types';

import { Slider } from '/@/shared/components/slider/slider';

interface Props {
    label: string;
    onChange: (db: number) => void;
    valueDb: number;
}

const formatDb = (db: number): string => {
    const rounded = Math.round(db * 10) / 10;
    if (rounded === 0) return '0.0';
    const sign = rounded > 0 ? '+' : '';
    return `${sign}${rounded.toFixed(1)}`;
};

export const BandSlider = ({ label, onChange, valueDb }: Props) => (
    <div className={styles.band}>
        <div className={styles.bandLabel}>{label}</div>
        <Slider
            classNames={{ root: styles.verticalSlider, track: styles.verticalTrack }}
            label={null}
            max={EQ_GAIN_MAX}
            min={EQ_GAIN_MIN}
            onChange={onChange}
            orientation="vertical"
            step={0.5}
            value={valueDb}
        />
        <div className={styles.bandReadout}>{formatDb(valueDb)}</div>
    </div>
);
