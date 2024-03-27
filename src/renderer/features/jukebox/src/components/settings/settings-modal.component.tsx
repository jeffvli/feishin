import styles from '../../css/app.module.scss';
import React, { useEffect, useState } from 'react';
import type { JukeboxStoredSettings } from '../../models/jukebox-settings';
import { JukeboxSettings } from '../../models/jukebox-settings';
import { SettingsService } from '../../services/settings-service';
import { MultiRangeSlider } from '../shared/multi-range-slider';

export function SettingsModal(): JSX.Element {
    const [settings, setSettings] = useState<JukeboxStoredSettings>(
        SettingsService.storedSettings,
    );

    useEffect(() => {
        const observer = new MutationObserver((records) => {
            let isPopupRemoved = false;

            for (const record of records) {
                record.removedNodes.forEach((x) => {
                    if (x.nodeName === 'GENERIC-MODAL') {
                        isPopupRemoved = true;
                    }
                });
            }

            if (isPopupRemoved) {
                window.jukebox.reloadSettings().catch(console.error);
                observer.disconnect();
            }
        });

        observer.observe(document.getElementsByTagName('body')[0], {
            childList: true,
        });
    }, []);

    useEffect(() => {
        SettingsService.storedSettings = settings;
    }, [settings]);

    function updateSettingsField(
        field: keyof JukeboxStoredSettings,
        value: any,
    ): void {
        if (typeof value !== typeof settings[field]) {
            throw new Error('Value type does not match field type');
        }

        if (settings[field] === value) {
            return;
        }

        setSettings((previousValue) => ({ ...previousValue, [field]: value }));
    }

    function reset(): void {
        setSettings(new JukeboxSettings().toPartial());
    }

    const labelStyle: React.CSSProperties = {
        marginBottom: '0.5rem',
        marginTop: '0.5rem',
        display: 'block',
    };

    const checkboxLabelStyle: React.CSSProperties = {
        marginBottom: '0.5rem',
        marginTop: '0.5rem',
        display: 'inline-block',
        marginRight: '0.5rem',
    };

    return (
        <div className={styles['settings-modal']}>
            <Spicetify.ReactComponent.TooltipWrapper
                label="The maximum similarity distance allowed between two beats in order to create a branch."
                showDelay={100}
            >
                <label
                    htmlFor="jukebox.settings.maxBranchDistance"
                    style={labelStyle}
                >
                    <b>Branch Similarity Threshold</b>:
                    {settings.maxBranchDistance}
                </label>
            </Spicetify.ReactComponent.TooltipWrapper>

            <div className={styles['input-range-container']}>
                <input
                    id="jukebox.settings.maxBranchDistance"
                    className={styles['w-100']}
                    type={'range'}
                    min={JukeboxSettings.rangeMinBranchDistance}
                    max={JukeboxSettings.rangeMaxBranchDistance}
                    value={settings.maxBranchDistance}
                    step={1}
                    onChange={(e) => {
                        updateSettingsField(
                            'maxBranchDistance',
                            e.target.valueAsNumber,
                        );
                    }}
                />

                <div className={styles['range-subtext']}>
                    <span className={styles['small-text']}>Higher quality</span>
                    <span className={styles['small-text']}>More branches</span>
                </div>
            </div>

            <Spicetify.ReactComponent.TooltipWrapper
                label="The minimum and maximum chance for a branch to be selected each beat."
                showDelay={100}
            >
                <label
                    htmlFor="jukebox.settings.randomBranchChance"
                    style={labelStyle}
                >
                    <b>Branch Probability Range</b>:
                    {` ${Math.round(settings.minRandomBranchChance * 100)}% to 
                ${Math.round(settings.maxRandomBranchChance * 100)}%`}
                </label>
            </Spicetify.ReactComponent.TooltipWrapper>

            <div className={styles['input-range-container']}>
                <MultiRangeSlider
                    min={0}
                    max={100}
                    minDefaultValue={settings.minRandomBranchChance * 100}
                    maxDefaultValue={settings.maxRandomBranchChance * 100}
                    onChange={({ min, max }) => {
                        updateSettingsField('minRandomBranchChance', min / 100);
                        updateSettingsField('maxRandomBranchChance', max / 100);
                    }}
                />

                <div className={styles['range-subtext']}>
                    <span className={styles['small-text']}>Low</span>
                    <span className={styles['small-text']}>High</span>
                </div>
            </div>

            <Spicetify.ReactComponent.TooltipWrapper
                label="Controls how fast the chance to select a branch will increase."
                showDelay={100}
            >
                <label
                    htmlFor="jukebox.settings.randomBranchChanceDelta"
                    style={labelStyle}
                >
                    <b>Branch Probability Ramp-up Speed</b>:
                    {Math.round(settings.randomBranchChanceDelta * 100)}%
                </label>
            </Spicetify.ReactComponent.TooltipWrapper>

            <div className={styles['input-range-container']}>
                <input
                    id="jukebox.settings.randomBranchChanceDelta"
                    className={styles['w-100']}
                    type={'range'}
                    min={0}
                    max={100}
                    value={settings.randomBranchChanceDelta * 100}
                    step={2}
                    onChange={(e) => {
                        updateSettingsField(
                            'randomBranchChanceDelta',
                            e.target.valueAsNumber / 100,
                        );
                    }}
                />

                <div className={styles['range-subtext']}>
                    <span className={styles['small-text']}>Slow</span>
                    <span className={styles['small-text']}>Fast</span>
                </div>
            </div>

            <div className={styles['checkbox-container']}>
                <Spicetify.ReactComponent.TooltipWrapper
                    label="If true, optimize by adding a good last edge."
                    showDelay={100}
                >
                    <label
                        htmlFor="jukebox.settings.addLastEdge"
                        style={checkboxLabelStyle}
                    >
                        <b>Loop extension optimization</b>:
                    </label>
                </Spicetify.ReactComponent.TooltipWrapper>

                <label className="x-toggle-wrapper">
                    <input
                        id="jukebox.settings.addLastEdge"
                        className="x-toggle-input"
                        type="checkbox"
                        checked={settings.addLastEdge}
                        onChange={(e) => {
                            updateSettingsField(
                                'addLastEdge',
                                !settings.addLastEdge,
                            );
                        }}
                    />
                    <span className="x-toggle-indicatorWrapper">
                        <span className="x-toggle-indicator"></span>
                    </span>
                </label>
            </div>

            <div className={styles['checkbox-container']}>
                <Spicetify.ReactComponent.TooltipWrapper
                    label="If true, only add backward branches."
                    showDelay={100}
                >
                    <label
                        htmlFor="jukebox.settings.justBackwards"
                        style={checkboxLabelStyle}
                    >
                        <b>Allow only reverse branches</b>:
                    </label>
                </Spicetify.ReactComponent.TooltipWrapper>

                <label className="x-toggle-wrapper">
                    <input
                        id="jukebox.settings.justBackwards"
                        className="x-toggle-input"
                        type="checkbox"
                        checked={settings.justBackwards}
                        onChange={(e) => {
                            updateSettingsField(
                                'justBackwards',
                                !settings.justBackwards,
                            );
                        }}
                    />
                    <span className="x-toggle-indicatorWrapper">
                        <span className="x-toggle-indicator"></span>
                    </span>
                </label>
            </div>

            <div className={styles['checkbox-container']}>
                <Spicetify.ReactComponent.TooltipWrapper
                    label="If true, only add long branches."
                    showDelay={100}
                >
                    <label
                        htmlFor="jukebox.settings.justLongBranches"
                        style={checkboxLabelStyle}
                    >
                        <b>Allow only long branches</b>:
                    </label>
                </Spicetify.ReactComponent.TooltipWrapper>

                <label className="x-toggle-wrapper">
                    <input
                        id="jukebox.settings.justLongBranches"
                        className="x-toggle-input"
                        type="checkbox"
                        checked={settings.justLongBranches}
                        onChange={(e) => {
                            updateSettingsField(
                                'justLongBranches',
                                !settings.justLongBranches,
                            );
                        }}
                    />
                    <span className="x-toggle-indicatorWrapper">
                        <span className="x-toggle-indicator"></span>
                    </span>
                </label>
            </div>

            <div className={styles['checkbox-container']}>
                <Spicetify.ReactComponent.TooltipWrapper
                    label="If true, remove consecutive branches of the same distance."
                    showDelay={100}
                >
                    <label
                        htmlFor="jukebox.settings.removeSequentialBranches"
                        style={checkboxLabelStyle}
                    >
                        <b>Remove sequential branches</b>:
                    </label>
                </Spicetify.ReactComponent.TooltipWrapper>

                <label className="x-toggle-wrapper">
                    <input
                        id="jukebox.settings.removeSequentialBranches"
                        className="x-toggle-input"
                        type="checkbox"
                        checked={settings.removeSequentialBranches}
                        onChange={(e) => {
                            updateSettingsField(
                                'removeSequentialBranches',
                                !settings.removeSequentialBranches,
                            );
                        }}
                    />
                    <span className="x-toggle-indicatorWrapper">
                        <span className="x-toggle-indicator"></span>
                    </span>
                </label>
            </div>

            <div className={styles['flex-center']}>
                <button onClick={reset}>Reset</button>
            </div>
        </div>
    );
}
