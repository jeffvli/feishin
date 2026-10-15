import type { DesktopLyricsSettings, DesktopLyricsTextStyle } from '/@/shared/types/desktop-lyrics';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DesktopLyricsControls } from './desktop-lyrics-controls';
import { DesktopLyricsFontInput } from './desktop-lyrics-font-input';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { ListConfigTable } from '/@/renderer/features/shared/components/list-config-menu';
import { logger } from '/@/renderer/utils/logger';
import { Button } from '/@/shared/components/button/button';
import { ColorInput } from '/@/shared/components/color-input/color-input';
import { Fieldset } from '/@/shared/components/fieldset/fieldset';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { SegmentedControl } from '/@/shared/components/segmented-control/segmented-control';
import { Slider } from '/@/shared/components/slider/slider';
import { Switch } from '/@/shared/components/switch/switch';
import { toast } from '/@/shared/components/toast/toast';
import {
    defaultDesktopLyricsSettings,
    desktopLyricsSettingsSchema,
    getEffectiveDesktopLyricsSettings,
    setDesktopLyricsIndependent,
} from '/@/shared/utils/desktop-lyrics';

const COLOR_SWATCHES = [
    'rgb(53, 116, 252)',
    'rgb(240, 170, 22)',
    'rgb(29, 185, 84)',
    'rgb(214, 81, 63)',
    'rgb(170, 110, 216)',
];

const colorToRgb = (value: string) =>
    value.replace(
        /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i,
        (_, red, green, blue) =>
            `rgb(${parseInt(red, 16)}, ${parseInt(green, 16)}, ${parseInt(blue, 16)})`,
    );

// Both settings surfaces gate this component on Electron.
export const DesktopLyricsSettingsSection = ({ compact = false }: { compact?: boolean }) => {
    const { t } = useTranslation();
    const [settings, setSettings] = useState(defaultDesktopLyricsSettings);
    const displaySettings = getEffectiveDesktopLyricsSettings(settings);
    const [ready, setReady] = useState(false);
    const [saving, setSaving] = useState(false);
    const [openColor, setOpenColor] = useState<null | string>(null);
    const [fontSizeInput, setFontSizeInput] = useState<number | string>(displaySettings.fontSize);
    const [translationFontSizeInput, setTranslationFontSizeInput] = useState<number | string>(
        displaySettings.translationFontSize,
    );
    const [outlineInput, setOutlineInput] = useState(displaySettings.outline);
    const [translationOutlineInput, setTranslationOutlineInput] = useState(
        displaySettings.translationOutline,
    );
    const [widthInput, setWidthInput] = useState(displaySettings.widthCharacters);
    const [opacityInput, setOpacityInput] = useState(displaySettings.backgroundOpacity);
    const [textColorInput, setTextColorInput] = useState({
        fontColor: displaySettings.fontColor,
        fontGradientColor: displaySettings.fontGradientColor,
        fontGradientTop: displaySettings.fontGradientTop,
        outlineColor: displaySettings.outlineColor,
        translationFontColor: displaySettings.translationFontColor,
        translationFontGradientColor: displaySettings.translationFontGradientColor,
        translationFontGradientTop: displaySettings.translationFontGradientTop,
        translationOutlineColor: displaySettings.translationOutlineColor,
    });
    useEffect(
        () =>
            setTextColorInput({
                fontColor: displaySettings.fontColor,
                fontGradientColor: displaySettings.fontGradientColor,
                fontGradientTop: displaySettings.fontGradientTop,
                outlineColor: displaySettings.outlineColor,
                translationFontColor: displaySettings.translationFontColor,
                translationFontGradientColor: displaySettings.translationFontGradientColor,
                translationFontGradientTop: displaySettings.translationFontGradientTop,
                translationOutlineColor: displaySettings.translationOutlineColor,
            }),
        [
            displaySettings.fontColor,
            displaySettings.fontGradientColor,
            displaySettings.fontGradientTop,
            displaySettings.outlineColor,
            displaySettings.translationOutlineColor,
            displaySettings.translationFontColor,
            displaySettings.translationFontGradientColor,
            displaySettings.translationFontGradientTop,
        ],
    );
    const [textOpacityInput, setTextOpacityInput] = useState({
        fontOpacity: displaySettings.fontOpacity,
        translationFontOpacity: displaySettings.translationFontOpacity,
    });
    const [nextStyleInputs, setNextStyleInputs] = useState({
        nextStyle: settings.nextStyle,
        nextTranslationStyle: settings.nextTranslationStyle,
    });
    useEffect(
        () =>
            setNextStyleInputs({
                nextStyle: settings.nextStyle,
                nextTranslationStyle: settings.nextTranslationStyle,
            }),
        [settings.nextStyle, settings.nextTranslationStyle],
    );
    useEffect(
        () => setOpenColor(null),
        [
            settings.singleLine,
            settings.translationIndependent,
            settings.nextIndependent,
            settings.nextTranslationIndependent,
        ],
    );
    const api = window.api.desktopLyrics;
    useEffect(
        () =>
            setTextOpacityInput({
                fontOpacity: settings.fontOpacity,
                translationFontOpacity: displaySettings.translationFontOpacity,
            }),
        [settings.fontOpacity, displaySettings.translationFontOpacity],
    );

    useEffect(() => setOutlineInput(settings.outline), [settings.outline]);
    useEffect(
        () => setTranslationOutlineInput(displaySettings.translationOutline),
        [displaySettings.translationOutline],
    );
    useEffect(() => setWidthInput(settings.widthCharacters), [settings.widthCharacters]);
    useEffect(() => setOpacityInput(settings.backgroundOpacity), [settings.backgroundOpacity]);
    useEffect(() => setFontSizeInput(settings.fontSize), [settings.fontSize]);
    useEffect(
        () => setTranslationFontSizeInput(displaySettings.translationFontSize),
        [displaySettings.translationFontSize],
    );

    useEffect(() => {
        let active = true;
        let receivedSettings = false;
        const unsubscribe = api.onSettings((value) => {
            receivedSettings = true;
            setSettings(value);
        });
        void api
            .getSettings()
            .then((value) => {
                if (!active) return;
                if (!receivedSettings) setSettings(value);
                setReady(true);
            })
            .catch((error) => {
                if (!active) return;
                logger.error('Failed to load desktop lyrics settings', { error });
                toast.error({ message: t('desktopLyrics.error') });
            });
        return () => {
            active = false;
            unsubscribe();
        };
    }, [api, t]);

    const save = async (value: DesktopLyricsSettings) => {
        const previous = settings;
        setSettings(value);
        setSaving(true);
        try {
            setSettings(await api.setSettings(value));
        } catch (error) {
            setSettings(previous);
            logger.error('Failed to save desktop lyrics settings', { error });
            toast.error({ message: t('desktopLyrics.error') });
        } finally {
            setSaving(false);
        }
    };
    const reset = async () => {
        setSaving(true);
        try {
            setSettings(await api.resetSettings());
        } catch (error) {
            logger.error('Failed to reset desktop lyrics settings', { error });
            toast.error({ message: t('desktopLyrics.error') });
        } finally {
            setSaving(false);
        }
    };
    const disabled = !ready || saving;
    const controlDisabled = (key: string) =>
        disabled ||
        (key.startsWith('translation') &&
            key !== 'translationIndependent' &&
            !settings.translationIndependent);
    const options: SettingOption[] = [
        {
            control: <DesktopLyricsControls />,
            description: t('desktopLyrics.description'),
            title: t('desktopLyrics.title'),
        },
    ];
    for (const key of ['font', 'fontSize', 'translationFont', 'translationFontSize'] as const) {
        if (key.startsWith('translation') && !settings.translationIndependent) continue;
        const sizeInput = key === 'translationFontSize' ? translationFontSizeInput : fontSizeInput;
        const setSizeInput =
            key === 'translationFontSize' ? setTranslationFontSizeInput : setFontSizeInput;
        const fontSetting = key === 'font' || key === 'translationFont';
        options.push({
            control: fontSetting ? (
                <DesktopLyricsFontInput
                    disabled={controlDisabled(key)}
                    label={t(`desktopLyrics.${key}`)}
                    onChange={(value) => void save({ ...settings, [key]: value })}
                    value={displaySettings[key]}
                    width={compact ? '100%' : 220}
                />
            ) : compact ? (
                <Slider
                    aria-label={t(`desktopLyrics.${key}`)}
                    disabled={controlDisabled(key)}
                    label={(value) => `${value}px`}
                    marks={[1, 64, 96, 128].map((value) => ({ label: String(value), value }))}
                    max={128}
                    min={1}
                    onChange={setSizeInput}
                    onChangeEnd={(value) => void save({ ...settings, [key]: value })}
                    step={1}
                    thumbLabel={t(`desktopLyrics.${key}`)}
                    value={Number(sizeInput)}
                    w="75%"
                />
            ) : (
                <NumberInput
                    allowDecimal={false}
                    allowNegative={false}
                    aria-label={t(`desktopLyrics.${key}`)}
                    disabled={controlDisabled(key)}
                    hideControls={false}
                    max={128}
                    min={1}
                    onBlur={() => {
                        const value = Number(sizeInput);
                        const parsed = desktopLyricsSettingsSchema.safeParse({
                            ...settings,
                            [key]: Math.max(1, Math.min(128, value)),
                        });
                        if (parsed.success) {
                            setSizeInput(parsed.data[key]);
                            if (parsed.data[key] !== settings[key]) void save(parsed.data);
                        } else {
                            setSizeInput(settings[key]);
                        }
                    }}
                    onChange={setSizeInput}
                    step={1}
                    value={sizeInput}
                    width={compact ? '100%' : 220}
                />
            ),
            description: t(`desktopLyrics.${key}Description`),
            title: t(`desktopLyrics.${key}`),
        });
    }
    options.push(
        {
            control: (
                <Slider
                    aria-label={t('desktopLyrics.outline')}
                    disabled={disabled}
                    label={(value) => `${value}px`}
                    marks={
                        compact
                            ? [0, 10, 20].map((value) => ({ label: String(value), value }))
                            : undefined
                    }
                    max={20}
                    min={0}
                    onChange={setOutlineInput}
                    onChangeEnd={(value) => void save({ ...settings, outline: value })}
                    step={1}
                    thumbLabel={t('desktopLyrics.outline')}
                    value={outlineInput}
                    w={compact ? '75%' : 100}
                />
            ),
            description: t('desktopLyrics.outlineDescription'),
            title: t('desktopLyrics.outline'),
        },
        {
            control: (
                <SegmentedControl
                    aria-label={t('desktopLyrics.layout')}
                    data={['center', 'diagonal'].map((value) => ({
                        label: t(`desktopLyrics.${value}`),
                        value,
                    }))}
                    disabled={disabled}
                    onChange={(value) => {
                        if (value === 'center' || value === 'diagonal')
                            void save({ ...settings, layout: value });
                    }}
                    value={settings.layout}
                />
            ),
            description: t('desktopLyrics.layoutDescription'),
            title: t('desktopLyrics.layout'),
        },
    );
    if (settings.translationIndependent)
        options.push({
            control: (
                <Slider
                    aria-label={t('desktopLyrics.translationOutline')}
                    disabled={controlDisabled('translationOutline')}
                    label={(value) => `${value}px`}
                    marks={
                        compact
                            ? [0, 10, 20].map((value) => ({ label: String(value), value }))
                            : undefined
                    }
                    max={20}
                    min={0}
                    onChange={setTranslationOutlineInput}
                    onChangeEnd={(value) => void save({ ...settings, translationOutline: value })}
                    step={1}
                    thumbLabel={t('desktopLyrics.translationOutline')}
                    value={translationOutlineInput}
                    w={compact ? '75%' : 100}
                />
            ),
            description: t('desktopLyrics.translationOutlineDescription'),
            title: t('desktopLyrics.translationOutline'),
        });
    for (const key of ['fontGradient', 'translationFontGradient'] as const) {
        if (key === 'translationFontGradient' && !settings.translationIndependent) continue;
        options.push({
            control: (
                <Switch
                    aria-label={t(`desktopLyrics.${key}`)}
                    checked={displaySettings[key]}
                    disabled={controlDisabled(key)}
                    onChange={(event) =>
                        void save({ ...settings, [key]: event.currentTarget.checked })
                    }
                />
            ),
            description: t(`desktopLyrics.${key}Description`),
            title: t(`desktopLyrics.${key}`),
        });
    }
    for (const key of [
        'fontColor',
        'fontGradientTop',
        'fontGradientColor',
        'translationFontColor',
        'translationFontGradientTop',
        'translationFontGradientColor',
        'outlineColor',
        'translationOutlineColor',
    ] as const) {
        if (key.startsWith('translation') && !settings.translationIndependent) continue;
        if (
            (key === 'fontColor' && settings.fontGradient) ||
            (key === 'translationFontColor' && displaySettings.translationFontGradient)
        )
            continue;
        if ((key === 'fontGradientTop' || key === 'fontGradientColor') && !settings.fontGradient)
            continue;
        if (
            (key === 'translationFontGradientTop' || key === 'translationFontGradientColor') &&
            !displaySettings.translationFontGradient
        )
            continue;
        options.push({
            control: (
                <ColorInput
                    aria-label={t(`desktopLyrics.${key}`)}
                    disabled={controlDisabled(key)}
                    format="rgb"
                    onBlur={() => setOpenColor(null)}
                    onChange={(value) =>
                        setTextColorInput((previous) => ({ ...previous, [key]: value }))
                    }
                    onChangeEnd={(value) => {
                        const parsed = desktopLyricsSettingsSchema.safeParse({
                            ...settings,
                            [key]: value,
                        });
                        if (parsed.success) void save(parsed.data);
                        else
                            setTextColorInput((previous) => ({
                                ...previous,
                                [key]: settings[key],
                            }));
                    }}
                    onClick={() => setOpenColor(key)}
                    onFocus={() => setOpenColor(key)}
                    // Saving can disable the focused input, so dismiss without relying on blur.
                    popoverProps={{
                        onDismiss: () => setOpenColor(null),
                        opened: openColor === key,
                    }}
                    swatches={COLOR_SWATCHES}
                    swatchesPerRow={5}
                    value={colorToRgb(textColorInput[key])}
                    withEyeDropper={false}
                />
            ),
            description: t(`desktopLyrics.${key}Description`),
            title: t(`desktopLyrics.${key}`),
        });
    }
    for (const key of ['fontOpacity', 'translationFontOpacity'] as const) {
        if (key === 'translationFontOpacity' && !settings.translationIndependent) continue;
        options.push({
            control: (
                <Slider
                    aria-label={t(`desktopLyrics.${key}`)}
                    disabled={controlDisabled(key)}
                    label={(value) => `${value}%`}
                    marks={
                        compact
                            ? [0, 50, 100].map((value) => ({ label: `${value}%`, value }))
                            : undefined
                    }
                    max={100}
                    min={0}
                    onChange={(value) =>
                        setTextOpacityInput((previous) => ({ ...previous, [key]: value }))
                    }
                    onChangeEnd={(value) => void save({ ...settings, [key]: value })}
                    step={1}
                    thumbLabel={t(`desktopLyrics.${key}`)}
                    value={textOpacityInput[key]}
                    w={compact ? '75%' : 100}
                />
            ),
            description: t(`desktopLyrics.${key}Description`),
            title: t(`desktopLyrics.${key}`),
        });
    }
    options.push({
        control: (
            <Switch
                aria-label={t('desktopLyrics.transparentBackground')}
                checked={settings.transparentBackground}
                disabled={disabled}
                onChange={(event) =>
                    void save({ ...settings, transparentBackground: event.currentTarget.checked })
                }
            />
        ),
        description: t('desktopLyrics.transparentBackgroundDescription'),
        title: t('desktopLyrics.transparentBackground'),
    });
    for (const key of ['widthCharacters', 'backgroundOpacity'] as const) {
        const width = key === 'widthCharacters';
        options.push({
            control: (
                <Slider
                    aria-label={t(`desktopLyrics.${key}`)}
                    disabled={disabled || (!width && settings.transparentBackground)}
                    label={(value) => (width ? String(value) : `${value}%`)}
                    marks={
                        compact
                            ? (width ? [10, 20, 35, 50] : [0, 50, 100]).map((value) => ({
                                  label: width ? String(value) : `${value}%`,
                                  value,
                              }))
                            : undefined
                    }
                    max={width ? 50 : 100}
                    min={width ? 10 : 0}
                    onChange={width ? setWidthInput : setOpacityInput}
                    onChangeEnd={(value) => void save({ ...settings, [key]: value })}
                    step={1}
                    thumbLabel={t(`desktopLyrics.${key}`)}
                    value={width ? widthInput : opacityInput}
                    w={compact ? '75%' : 100}
                />
            ),
            description: t(`desktopLyrics.${key}Description`),
            title: t(`desktopLyrics.${key}`),
        });
    }
    for (const key of [
        'translationBelow',
        'splitSlashLyrics',
        'singleLine',
        ...(!settings.singleLine ? (['rollingMode'] as const) : []),
        'shadow',
        'translationIndependent',
    ] as const)
        options.push({
            control: (
                <Switch
                    aria-label={t(`desktopLyrics.${key}`)}
                    checked={settings[key]}
                    disabled={disabled}
                    onChange={(event) =>
                        void save(
                            key === 'translationIndependent'
                                ? setDesktopLyricsIndependent(
                                      settings,
                                      key,
                                      event.currentTarget.checked,
                                  )
                                : { ...settings, [key]: event.currentTarget.checked },
                        )
                    }
                />
            ),
            description: t(`desktopLyrics.${key}Description`),
            title: t(`desktopLyrics.${key}`),
        });
    options.push({
        control: (
            <SegmentedControl
                aria-label={t('desktopLyrics.showTranslation')}
                data={['both', 'translation', 'original'].map((value) => ({
                    label: t(`desktopLyrics.displayMode_${value}`),
                    value,
                }))}
                disabled={disabled}
                onChange={(value) => {
                    if (value === 'both' || value === 'translation' || value === 'original')
                        void save({
                            ...settings,
                            displayMode: value,
                            showTranslation: value === 'both',
                        });
                }}
                value={settings.displayMode}
            />
        ),
        description: t('desktopLyrics.showTranslationDescription'),
        title: t('desktopLyrics.showTranslation'),
    });
    const order = [
        'title',
        'singleLine',
        'showTranslation',
        'translationBelow',
        'splitSlashLyrics',
        'layout',
        'rollingMode',
        'shadow',
        'widthCharacters',
        'transparentBackground',
        'backgroundOpacity',
        'font',
        'fontSize',
        'fontGradient',
        'fontColor',
        'fontGradientTop',
        'fontGradientColor',
        'fontOpacity',
        'outline',
        'outlineColor',
        'translationIndependent',
        'translationFont',
        'translationFontSize',
        'translationFontGradient',
        'translationFontColor',
        'translationFontGradientTop',
        'translationFontGradientColor',
        'translationFontOpacity',
        'translationOutline',
        'translationOutlineColor',
    ].map((key) => t(`desktopLyrics.${key}`));
    options.sort((left, right) => order.indexOf(left.title) - order.indexOf(right.title));
    const nextOptions: SettingOption[] = [];
    const addIndependenceToggle = (
        key: 'nextIndependent' | 'nextTranslationIndependent',
        source: string,
    ) => {
        nextOptions.push({
            control: (
                <Switch
                    aria-label={t(`desktopLyrics.${key}`)}
                    checked={settings[key]}
                    disabled={disabled}
                    onChange={(event) =>
                        void save(
                            setDesktopLyricsIndependent(settings, key, event.currentTarget.checked),
                        )
                    }
                />
            ),
            description: t('desktopLyrics.styleInheritanceDescription', {
                source: t(`desktopLyrics.${source}`),
            }),
            title: t(`desktopLyrics.${key}`),
        });
    };
    const addNextStyleOptions = (
        role: 'nextStyle' | 'nextTranslationStyle',
        name: 'nextLyrics' | 'nextTranslation',
    ) => {
        const input = nextStyleInputs[role];
        const edit = (patch: Partial<DesktopLyricsTextStyle>) =>
            setNextStyleInputs((previous) => ({
                ...previous,
                [role]: { ...previous[role], ...patch },
            }));
        const commit = (patch: Partial<DesktopLyricsTextStyle>) => {
            const parsed = desktopLyricsSettingsSchema.safeParse({
                ...settings,
                [role]: { ...settings[role], ...patch },
            });
            if (parsed.success) void save(parsed.data);
            else edit(settings[role]);
        };
        const label = (key: string) =>
            `${t(`desktopLyrics.${name}`)} · ${t(`desktopLyrics.style${key[0].toUpperCase()}${key.slice(1)}`)}`;
        const add = (key: string, control: SettingOption['control']) =>
            nextOptions.push({
                control,
                description: t('desktopLyrics.styleDescription'),
                title: label(key),
            });
        add(
            'font',
            <DesktopLyricsFontInput
                disabled={disabled}
                label={label('font')}
                onChange={(font) => commit({ font })}
                value={settings[role].font}
                width={compact ? '100%' : 220}
            />,
        );
        add(
            'fontSize',
            compact ? (
                <Slider
                    aria-label={label('fontSize')}
                    disabled={disabled}
                    label={(value) => `${value}px`}
                    marks={[1, 64, 96, 128].map((value) => ({ label: String(value), value }))}
                    max={128}
                    min={1}
                    onChange={(fontSize) => edit({ fontSize })}
                    onChangeEnd={(fontSize) => commit({ fontSize })}
                    step={1}
                    thumbLabel={label('fontSize')}
                    value={input.fontSize}
                    w="75%"
                />
            ) : (
                <NumberInput
                    allowDecimal={false}
                    allowNegative={false}
                    aria-label={label('fontSize')}
                    disabled={disabled}
                    max={128}
                    min={1}
                    onBlur={() => commit({ fontSize: Math.max(1, Math.min(128, input.fontSize)) })}
                    onChange={(value) =>
                        edit({ fontSize: typeof value === 'number' ? value : Number(value) })
                    }
                    step={1}
                    value={input.fontSize}
                    width={220}
                />
            ),
        );
        add(
            'fontGradient',
            <Switch
                aria-label={label('fontGradient')}
                checked={settings[role].fontGradient}
                disabled={disabled}
                onChange={(event) => commit({ fontGradient: event.currentTarget.checked })}
            />,
        );
        for (const key of (settings[role].fontGradient
            ? ['fontGradientTop', 'fontGradientColor', 'outlineColor']
            : ['fontColor', 'outlineColor']) as (
            | 'fontColor'
            | 'fontGradientColor'
            | 'fontGradientTop'
            | 'outlineColor'
        )[]) {
            const colorId = `${role}.${key}`;
            add(
                key,
                <ColorInput
                    aria-label={label(key)}
                    disabled={disabled}
                    format="rgb"
                    onBlur={() => setOpenColor(null)}
                    onChange={(value) => edit({ [key]: value })}
                    onChangeEnd={(value) => commit({ [key]: value })}
                    onClick={() => setOpenColor(colorId)}
                    onFocus={() => setOpenColor(colorId)}
                    popoverProps={{
                        onDismiss: () => setOpenColor(null),
                        opened: openColor === colorId,
                    }}
                    swatches={COLOR_SWATCHES}
                    swatchesPerRow={5}
                    value={colorToRgb(input[key])}
                    w={compact ? 200 : 100}
                    withEyeDropper={false}
                />,
            );
        }
        for (const key of ['fontOpacity', 'outline'] as const) {
            const max = key === 'outline' ? 20 : 100;
            const unit = key === 'outline' ? 'px' : '%';
            add(
                key,
                <Slider
                    aria-label={label(key)}
                    disabled={disabled}
                    label={(value) => `${value}${unit}`}
                    marks={
                        compact
                            ? [0, max / 2, max].map((value) => ({
                                  label: `${value}${unit}`,
                                  value,
                              }))
                            : undefined
                    }
                    max={max}
                    min={0}
                    onChange={(value) => edit({ [key]: value })}
                    onChangeEnd={(value) => commit({ [key]: value })}
                    step={1}
                    thumbLabel={label(key)}
                    value={input[key]}
                    w={compact ? '75%' : 100}
                />,
            );
        }
    };
    if (!settings.singleLine) {
        addIndependenceToggle('nextIndependent', 'primaryLyrics');
        if (settings.nextIndependent) addNextStyleOptions('nextStyle', 'nextLyrics');
        addIndependenceToggle('nextTranslationIndependent', 'nextLyrics');
        if (settings.nextTranslationIndependent)
            addNextStyleOptions('nextTranslationStyle', 'nextTranslation');
    }
    options.push(...nextOptions, {
        control: (
            <Button disabled={disabled} onClick={() => void reset()} variant="default">
                {t('desktopLyrics.resetSettings')}
            </Button>
        ),
        description: t('desktopLyrics.resetDescription'),
        title: t('desktopLyrics.resetSettings'),
    });
    if (compact) {
        return (
            <Fieldset legend={t('desktopLyrics.settingsTitle')}>
                <ListConfigTable
                    options={options.map(({ control, description, title }) => ({
                        component: control,
                        description,
                        id: title,
                        label: title,
                    }))}
                />
            </Fieldset>
        );
    }
    return <SettingsSection options={options} title={t('desktopLyrics.settingsTitle')} />;
};
