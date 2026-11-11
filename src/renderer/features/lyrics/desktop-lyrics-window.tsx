import type { DesktopLyricsState, DesktopLyricsUpdate } from '/@/shared/types/desktop-lyrics';

import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useTranslation } from 'react-i18next';

import { DesktopLyricsLine } from './desktop-lyrics-line';
import styles from './desktop-lyrics-window.module.css';

import i18n from '/@/i18n/i18n';
import { logger } from '/@/renderer/utils/logger';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Group } from '/@/shared/components/group/group';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { Popover } from '/@/shared/components/popover/popover';
import { Slider } from '/@/shared/components/slider/slider';
import {
    defaultDesktopLyricsSettings,
    getDesktopLyricsControlsLayout,
    getDesktopLyricsFontSizes,
    getDesktopLyricsPair,
    getDesktopLyricsTiming,
    getEffectiveDesktopLyricsSettings,
    isDesktopLyricsCurrentOnBottom,
} from '/@/shared/utils/desktop-lyrics';

const api = window.api.desktopLyrics;

const DesktopLyricsWindow = () => {
    const { t } = useTranslation();
    const [update, setUpdate] = useState<DesktopLyricsUpdate>({ revision: -1, snapshot: null });
    const [state, setState] = useState<DesktopLyricsState>({
        locked: false,
        open: false,
        revision: -1,
        wayland: false,
    });
    const [hovered, setHovered] = useState(false);
    const [error, setError] = useState(false);
    const [switchingLayout, setSwitchingLayout] = useState(false);
    const [offsetOpen, setOffsetOpen] = useState(false);
    useEffect(() => {
        const dismissOffset = () => setOffsetOpen(false);
        window.addEventListener('blur', dismissOffset);
        return () => window.removeEventListener('blur', dismissOffset);
    }, []);
    const [offsetInput, setOffsetInput] = useState<number | string>(0);
    const [savedSettings, setSettings] = useState(defaultDesktopLyricsSettings);
    const settings = getEffectiveDesktopLyricsSettings(savedSettings);
    useEffect(() => {
        setOffsetInput(update.snapshot?.offsetMs ?? 0);
    }, [update.snapshot?.offsetMs, update.snapshot?.trackKey]);
    useEffect(() => {
        setOffsetOpen(false);
    }, [state.locked, update.snapshot?.trackKey]);
    const primaryType = settings.font.type;
    const primaryName = primaryType === 'system' ? settings.font.system : settings.font.custom;
    const translationType = settings.translationFont.type;
    const translationName =
        translationType === 'system'
            ? settings.translationFont.system
            : settings.translationFont.custom;
    const nextType = settings.nextStyle.font.type;
    const nextName =
        nextType === 'system' ? settings.nextStyle.font.system : settings.nextStyle.font.custom;
    const nextTranslationType = settings.nextTranslationStyle.font.type;
    const nextTranslationName =
        nextTranslationType === 'system'
            ? settings.nextTranslationStyle.font.system
            : settings.nextTranslationStyle.font.custom;
    useEffect(() => {
        let active = true;
        const faces: FontFace[] = [];
        for (const [role, type, name] of [
            ['primary', primaryType, primaryName],
            ['translation', translationType, translationName],
            ['next', nextType, nextName],
            ['next-translation', nextTranslationType, nextTranslationName],
        ] as const) {
            if (type === 'builtIn' || !name || (role.startsWith('next') && settings.singleLine))
                continue;
            // FontFace parses a single source; no user-controlled stylesheet is injected.
            const source =
                type === 'system'
                    ? `local(${JSON.stringify(name)})`
                    : `url(${JSON.stringify(`feishin://desktop-lyrics/${role}?v=${encodeURIComponent(name)}`)})`;
            const face = new FontFace(`desktop-lyrics-${role}`, source);
            faces.push(face);
            void face
                .load()
                .then((loaded) => {
                    if (active) document.fonts.add(loaded);
                })
                .catch((error: unknown) => {
                    if (!active) return;
                    logger.error('Failed to load desktop lyrics font', { error, role });
                    setError(true);
                });
        }
        return () => {
            active = false;
            for (const face of faces) document.fonts.delete(face);
        };
    }, [
        primaryName,
        primaryType,
        translationName,
        translationType,
        nextName,
        nextType,
        nextTranslationName,
        nextTranslationType,
        settings.singleLine,
    ]);

    const snapshotRevision = useRef(-1);
    const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
    const controls = getDesktopLyricsControlsLayout(update.screenHeight ?? 1080);
    const availableHeight = Math.max(1, viewportHeight - controls.chromeHeight);

    useEffect(() => {
        const resize = () => setViewportHeight(window.innerHeight);
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, []);

    useEffect(() => {
        const receive = (next: DesktopLyricsUpdate) => {
            if (next.revision < snapshotRevision.current) {
                return;
            }
            snapshotRevision.current = next.revision;
            setUpdate(next);
            if (next.snapshot && i18n.language !== next.snapshot.language) {
                void i18n.changeLanguage(next.snapshot.language);
            }
        };
        const receiveState = (next: DesktopLyricsState) =>
            setState((previous) => (next.revision >= previous.revision ? next : previous));
        const fail = (failure: unknown) => {
            logger.error('Failed to initialize desktop lyrics window', { error: failure });
            setError(true);
        };
        const unsubscribeHover = api.onHover(setHovered);
        const unsubscribeSnapshot = api.onSnapshot(receive);
        const unsubscribeState = api.onState(receiveState);
        let receivedSettings = false;
        const unsubscribeSettings = api.onSettings((value) => {
            receivedSettings = true;
            setSettings(value);
        });
        void api
            .getSettings()
            .then((value) => {
                if (!receivedSettings) setSettings(value);
            })
            .catch(fail);
        void api.getSnapshot().then(receive).catch(fail);
        void api.getState().then(receiveState).catch(fail);
        return () => {
            unsubscribeSettings();
            unsubscribeHover();
            unsubscribeSnapshot();
            unsubscribeState();
        };
    }, []);

    const run = async (action: () => Promise<unknown>) => {
        try {
            await action();
            setError(false);
        } catch (failure) {
            logger.error('Desktop lyrics window action failed', { error: failure });
            setError(true);
        }
    };
    const switchLayoutLabel = t('desktopLyrics.switchLayout', {
        layout: t(settings.layout === 'center' ? 'desktopLyrics.diagonal' : 'desktopLyrics.center'),
    });
    const applyOffset = (value: number) => {
        const trackKey = update.snapshot?.trackKey;
        if (trackKey && Number.isSafeInteger(value)) {
            setOffsetInput(value);
            void run(() => api.setOffset(trackKey, value));
        }
    };
    const toggleLayout = async () => {
        setSwitchingLayout(true);
        try {
            await run(api.toggleLayout);
        } finally {
            setSwitchingLayout(false);
        }
    };
    const [current, next] = update.snapshot
        ? getDesktopLyricsPair(update.snapshot, settings)
        : [[], []];
    const [currentRomaji, nextRomaji] = update.snapshot?.romajiLines
        ? getDesktopLyricsPair(
              {
                  ...update.snapshot,
                  lines: update.snapshot.romajiLines,
                  title: '',
                  // Generated translations have no corresponding generated pronunciation.
                  translationLines: update.snapshot.translationLines?.map(({ startMs }) => ({
                      startMs,
                      text: '',
                  })),
              },
              settings,
          )
        : [[], []];
    const currentLines =
        current.length && !(current.length === 1 && !current[0])
            ? current
            : [t('desktopLyrics.noLyrics')];
    const currentOnBottom = isDesktopLyricsCurrentOnBottom(update.snapshot, settings);
    const timing = update.snapshot ? getDesktopLyricsTiming(update.snapshot) : null;
    // Reserve padding, header and group gap.
    const [currentSize, nextSize, currentTranslationSize, nextTranslationSize] =
        getDesktopLyricsFontSizes(
            currentLines,
            next,
            settings.fontSize,
            availableHeight,
            settings.translationFontSize,
            settings.nextStyle.fontSize,
            settings.nextTranslationStyle.fontSize,
            !!update.snapshot?.romajiLines?.length,
        );

    const nextVariables = {
        '--desktop-outline-color': settings.nextStyle.outlineColor,
        '--desktop-outline-width': `${settings.nextStyle.outline}px`,
        '--desktop-primary-bottom-color': settings.nextStyle.fontGradientColor,
        '--desktop-primary-color': settings.nextStyle.fontColor,
        '--desktop-primary-font':
            settings.nextStyle.font.type === 'builtIn'
                ? settings.nextStyle.font.builtIn
                : 'desktop-lyrics-next, sans-serif',
        '--desktop-primary-opacity': settings.nextStyle.fontOpacity / 100,
        '--desktop-primary-top-color': settings.nextStyle.fontGradientTop,
        '--desktop-translation-bottom-color': settings.nextTranslationStyle.fontGradientColor,
        '--desktop-translation-color': settings.nextTranslationStyle.fontColor,
        '--desktop-translation-font':
            settings.nextTranslationStyle.font.type === 'builtIn'
                ? settings.nextTranslationStyle.font.builtIn
                : 'desktop-lyrics-next-translation, sans-serif',
        '--desktop-translation-opacity': settings.nextTranslationStyle.fontOpacity / 100,
        '--desktop-translation-outline-color': settings.nextTranslationStyle.outlineColor,
        '--desktop-translation-outline-width': `${settings.nextTranslationStyle.outline}px`,
        '--desktop-translation-top-color': settings.nextTranslationStyle.fontGradientTop,
    } as CSSProperties;

    return (
        <div
            className={styles.window}
            data-current-on-bottom={currentOnBottom}
            data-hovered={hovered}
            data-layout={settings.layout}
            data-offset-open={offsetOpen}
            data-shadow={settings.shadow}
            data-single-line={settings.singleLine}
            data-transparent={settings.transparentBackground}
            data-wayland={state.wayland}
            style={
                {
                    '--desktop-background-opacity': settings.backgroundOpacity / 100,
                    '--desktop-controls-height': `${controls.buttonSize}px`,
                    '--desktop-outline-color': settings.outlineColor,
                    '--desktop-outline-width': `${settings.outline}px`,
                    '--desktop-primary-bottom-color': settings.fontGradientColor,
                    '--desktop-primary-color': settings.fontColor,
                    '--desktop-primary-font':
                        settings.font.type === 'builtIn'
                            ? settings.font.builtIn
                            : 'desktop-lyrics-primary, sans-serif',
                    '--desktop-primary-opacity': settings.fontOpacity / 100,
                    '--desktop-primary-top-color': settings.fontGradientTop,
                    '--desktop-translation-bottom-color': settings.translationFontGradientColor,
                    '--desktop-translation-color': settings.translationFontColor,
                    '--desktop-translation-font':
                        settings.translationFont.type === 'builtIn'
                            ? settings.translationFont.builtIn
                            : 'desktop-lyrics-translation, sans-serif',
                    '--desktop-translation-opacity': settings.translationFontOpacity / 100,
                    '--desktop-translation-outline-color': settings.translationOutlineColor,
                    '--desktop-translation-outline-width': `${settings.translationOutline}px`,
                    '--desktop-translation-top-color': settings.translationFontGradientTop,
                } as CSSProperties
            }
        >
            <div className={styles.header}>
                {state.wayland && !state.locked && <span>{t('desktopLyrics.wayland')}</span>}
                {!state.locked && (
                    <div className={styles.controls}>
                        <Popover
                            onChange={setOffsetOpen}
                            onDismiss={() => setOffsetOpen(false)}
                            opened={offsetOpen}
                            position="bottom-end"
                            width={280}
                            withinPortal={false}
                        >
                            <Popover.Target>
                                <ActionIcon
                                    aria-expanded={offsetOpen}
                                    aria-label={t('setting.lyricOffset')}
                                    disabled={!update.snapshot?.trackKey}
                                    icon="arrowLeftRight"
                                    iconProps={{ size: controls.iconSize }}
                                    onClick={() => setOffsetOpen((open) => !open)}
                                    size={controls.buttonSize}
                                    tooltip={{
                                        label: t('setting.lyricOffset'),
                                        withinPortal: false,
                                    }}
                                    variant="subtle"
                                />
                            </Popover.Target>
                            <Popover.Dropdown className={styles.offsetPanel}>
                                <Group gap="xs" justify="center" wrap="nowrap">
                                    <ActionIcon
                                        aria-label={t('common.slower')}
                                        icon="minus"
                                        onClick={() => applyOffset(Number(offsetInput) - 50)}
                                        variant="subtle"
                                    />
                                    <NumberInput
                                        allowDecimal={false}
                                        aria-label={t('setting.lyricOffset')}
                                        hideControls
                                        max={Number.MAX_SAFE_INTEGER}
                                        min={Number.MIN_SAFE_INTEGER}
                                        onChange={(value) => {
                                            setOffsetInput(value);
                                            if (typeof value === 'number') applyOffset(value);
                                        }}
                                        step={50}
                                        styles={{ input: { textAlign: 'center' } }}
                                        suffix=" ms"
                                        value={offsetInput}
                                        width={120}
                                    />
                                    <ActionIcon
                                        aria-label={t('common.faster')}
                                        icon="plus"
                                        onClick={() => applyOffset(Number(offsetInput) + 50)}
                                        variant="subtle"
                                    />
                                </Group>
                                <Slider
                                    aria-label={t('setting.lyricOffset')}
                                    label={(value) => `${value} ms`}
                                    max={Math.max(5000, Number(offsetInput) || 0)}
                                    min={Math.min(-5000, Number(offsetInput) || 0)}
                                    onChange={setOffsetInput}
                                    onChangeEnd={applyOffset}
                                    step={50}
                                    value={Number(offsetInput) || 0}
                                />
                            </Popover.Dropdown>
                        </Popover>
                        <ActionIcon
                            aria-label={t('desktopLyrics.settingsTitle')}
                            icon="settings"
                            iconProps={{ size: controls.iconSize }}
                            onClick={() => void run(api.openSettings)}
                            size={controls.buttonSize}
                            tooltip={{
                                label: t('desktopLyrics.settingsTitle'),
                                withinPortal: false,
                            }}
                            variant="subtle"
                        />
                        <ActionIcon
                            aria-label={switchLayoutLabel}
                            aria-pressed={settings.layout === 'diagonal'}
                            disabled={switchingLayout}
                            icon={settings.layout === 'center' ? 'alignCenter' : 'expand'}
                            iconProps={{ size: controls.iconSize }}
                            onClick={() => void toggleLayout()}
                            size={controls.buttonSize}
                            tooltip={{ label: switchLayoutLabel, withinPortal: false }}
                            variant="subtle"
                        />
                        <ActionIcon
                            aria-label={t('desktopLyrics.lock')}
                            icon="lock"
                            iconProps={{ size: controls.iconSize }}
                            onClick={() => void run(() => api.setLocked(true))}
                            size={controls.buttonSize}
                            tooltip={{ label: t('desktopLyrics.lock'), withinPortal: false }}
                            variant="subtle"
                        />
                        <ActionIcon
                            aria-label={t('desktopLyrics.close')}
                            icon="x"
                            iconProps={{ size: controls.iconSize }}
                            onClick={() => void run(api.close)}
                            size={controls.buttonSize}
                            tooltip={{ label: t('desktopLyrics.close'), withinPortal: false }}
                            variant="subtle"
                        />
                    </div>
                )}
            </div>
            <div className={styles.lyrics}>
                <div className={styles.current}>
                    {currentLines.map((text, index) => (
                        <DesktopLyricsLine
                            alignment={
                                settings.layout === 'center'
                                    ? 'center'
                                    : settings.singleLine && index === currentLines.length - 1
                                      ? 'right'
                                      : currentOnBottom
                                        ? 'right'
                                        : 'left'
                            }
                            className={styles.line}
                            data-font={
                                index === currentLines.length - 1 ? 'primary' : 'translation'
                            }
                            data-gradient={
                                index === currentLines.length - 1
                                    ? settings.fontGradient
                                    : settings.translationFontGradient
                            }
                            elapsedMs={Math.max(
                                0,
                                (update.snapshot?.timestamp ?? 0) * 1000 +
                                    (update.snapshot?.offsetMs ?? 0) -
                                    (timing?.startMs ?? 0),
                            )}
                            fontSize={
                                index === currentLines.length - 1
                                    ? currentSize
                                    : currentTranslationSize
                            }
                            key={`${update.snapshot?.trackKey}:${timing?.startMs}:${index}`}
                            playing={update.snapshot?.playing ?? false}
                            romajiText={currentRomaji[index]}
                            scrollDurationMs={timing?.durationMs ?? 4000}
                            text={text}
                        />
                    ))}
                </div>
                {next.length > 0 && (
                    <div className={styles.next} style={nextVariables}>
                        {next.map((text, index) => (
                            <DesktopLyricsLine
                                alignment={
                                    settings.layout === 'center'
                                        ? 'center'
                                        : currentOnBottom
                                          ? 'left'
                                          : 'right'
                                }
                                className={styles.line}
                                data-font={index === next.length - 1 ? 'primary' : 'translation'}
                                data-gradient={
                                    index === next.length - 1
                                        ? settings.nextStyle.fontGradient
                                        : settings.nextTranslationStyle.fontGradient
                                }
                                fontSize={
                                    index === next.length - 1 ? nextSize : nextTranslationSize
                                }
                                key={`${update.snapshot?.trackKey}:${index}`}
                                romajiText={nextRomaji[index]}
                                scrollDurationMs={0}
                                text={text}
                            />
                        ))}
                    </div>
                )}
            </div>
            {error && (
                <span className={styles.error} role="alert">
                    {t('desktopLyrics.error')}
                </span>
            )}
        </div>
    );
};

document.body.style.backgroundColor = 'transparent';
document.documentElement.style.backgroundColor = 'transparent';
createRoot(document.getElementById('root')!).render(
    <MantineProvider forceColorScheme="dark">
        <DesktopLyricsWindow />
    </MantineProvider>,
);
