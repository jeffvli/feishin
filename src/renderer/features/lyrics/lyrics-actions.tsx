import isElectron from 'is-electron';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './lyrics-actions.module.css';

import { openLyricSearchModal } from '/@/renderer/features/lyrics/components/lyrics-search-form';
import { useLyricsSettings, usePlayerSong } from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { DropdownMenu } from '/@/shared/components/dropdown-menu/dropdown-menu';
import { Group } from '/@/shared/components/group/group';
import { AppIcon } from '/@/shared/components/icon/icon';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { Popover } from '/@/shared/components/popover/popover';
import { Stack } from '/@/shared/components/stack/stack';
import { Switch } from '/@/shared/components/switch/switch';
import { Text } from '/@/shared/components/text/text';
import { Tooltip } from '/@/shared/components/tooltip/tooltip';
import { LyricsKind, LyricsOverride } from '/@/shared/types/domain-types';

export type OverlayLayerToggle = {
    key: string;
    kind: LyricsKind;
    label: string;
};

interface LyricsActionsProps {
    hasLyrics: boolean;
    index: number;
    languages: { label: string; value: string }[];
    offsetMs: number;
    onExportLyrics: () => void;
    onRemoveLyric: () => void;
    onSearchOverride: (params: LyricsOverride) => void;
    onToggleOverlayLayer?: (key: string) => void;
    onTranslateLyric?: () => void;
    onUpdateOffset: (offsetMs: number) => void;
    overlayLayers?: OverlayLayerToggle[];
    setIndex: (idx: number) => void;
    settingsKey?: string;
    synced?: boolean;
    visibleOverlayKeys?: Set<string>;
}

const OVERLAY_KIND_ICONS: Partial<Record<LyricsKind, keyof typeof AppIcon>> = {
    pronunciation: 'audioLines',
    translation: 'languages',
};

const getOverlayTooltip = (
    layer: OverlayLayerToggle,
    t: (key: string) => string,
    isActive: boolean,
): string => {
    const action = isActive ? 'Hide' : 'Show';

    if (layer.kind === 'pronunciation') {
        return `${action} ${t('page.fullscreenPlayer.showPronunciation').toLowerCase()}`;
    }

    if (layer.kind === 'translation') {
        return `${action} ${t('page.fullscreenPlayer.showTranslation').toLowerCase()}`;
    }

    return `${action} ${layer.label}`;
};

export const LyricsActions = ({
    hasLyrics,
    index,
    languages,
    offsetMs,
    onExportLyrics,
    onRemoveLyric,
    onSearchOverride,
    onToggleOverlayLayer,
    onTranslateLyric,
    onUpdateOffset,
    overlayLayers = [],
    setIndex,
    visibleOverlayKeys = new Set(),
}: LyricsActionsProps) => {
    const { t } = useTranslation();
    const currentSong = usePlayerSong();
    const { sources } = useLyricsSettings();

    const handleLyricOffset = (e: number | string) => {
        onUpdateOffset(Number(e));
    };

    const isActionsDisabled = !currentSong;
    const isDesktop = isElectron();
    const hasServerTranslationLayer = overlayLayers.some((layer) => layer.kind === 'translation');
    const hasMultipleLanguages = languages.length > 1;

    const selectedLanguage = useMemo(
        () => languages.find((language) => language.value === index.toString()),
        [index, languages],
    );

    const { extraOverlayLayers, quickOverlayLayers } = useMemo(() => {
        const quick: OverlayLayerToggle[] = [];
        const extra: OverlayLayerToggle[] = [];

        for (const layer of overlayLayers) {
            if (layer.kind === 'pronunciation' || layer.kind === 'translation') {
                quick.push(layer);
                continue;
            }

            extra.push(layer);
        }

        return {
            extraOverlayLayers: extra,
            quickOverlayLayers: quick,
        };
    }, [overlayLayers]);

    const hasActiveExtraOverlay = extraOverlayLayers.some((layer) =>
        visibleOverlayKeys.has(layer.key),
    );

    const languageTooltip = selectedLanguage
        ? `${t('page.fullscreenPlayer.lyricLanguage')}: ${selectedLanguage.label}`
        : t('page.fullscreenPlayer.lyricLanguage');

    const showTopRow =
        hasLyrics ||
        hasMultipleLanguages ||
        quickOverlayLayers.length > 0 ||
        extraOverlayLayers.length > 0;

    const languageMenu = hasMultipleLanguages ? (
        <DropdownMenu position="top">
            <DropdownMenu.Target>
                <ActionIcon
                    aria-label={languageTooltip}
                    disabled={isActionsDisabled}
                    icon="metadata"
                    iconProps={{ size: 'lg' }}
                    size="sm"
                    tooltip={{
                        label: languageTooltip,
                        openDelay: 0,
                    }}
                    variant="subtle"
                />
            </DropdownMenu.Target>
            <DropdownMenu.Dropdown>
                {languages.map((language) => (
                    <DropdownMenu.Item
                        isSelected={language.value === index.toString()}
                        key={language.value}
                        onClick={() => setIndex(parseInt(language.value, 10))}
                    >
                        {language.label}
                    </DropdownMenu.Item>
                ))}
            </DropdownMenu.Dropdown>
        </DropdownMenu>
    ) : null;

    const overlayToggleIcons = quickOverlayLayers.map((layer) => {
        const isActive = visibleOverlayKeys.has(layer.key);
        const icon = OVERLAY_KIND_ICONS[layer.kind] ?? 'list';

        return onToggleOverlayLayer ? (
            <ActionIcon
                aria-label={getOverlayTooltip(layer, t, isActive)}
                className={isActive ? styles.overlayToggleActive : undefined}
                disabled={isActionsDisabled}
                icon={icon}
                iconProps={isActive ? { color: 'primary', size: 'lg' } : { size: 'lg' }}
                key={layer.key}
                onClick={() => onToggleOverlayLayer(layer.key)}
                size="sm"
                tooltip={{
                    label: getOverlayTooltip(layer, t, isActive),
                    openDelay: 0,
                }}
                variant="subtle"
            />
        ) : null;
    });

    const extraLayersPopover =
        extraOverlayLayers.length > 0 && onToggleOverlayLayer ? (
            <Popover position="top" withArrow>
                <Popover.Target>
                    <ActionIcon
                        aria-label={t('page.fullscreenPlayer.lyricLayers')}
                        className={hasActiveExtraOverlay ? styles.overlayToggleActive : undefined}
                        disabled={isActionsDisabled}
                        icon="list"
                        iconProps={
                            hasActiveExtraOverlay
                                ? { color: 'primary', size: 'lg' }
                                : { size: 'lg' }
                        }
                        size="sm"
                        tooltip={{
                            label: t('page.fullscreenPlayer.lyricLayers'),
                            openDelay: 0,
                        }}
                        variant="subtle"
                    />
                </Popover.Target>
                <Popover.Dropdown maw={280} miw={220} onClick={(e) => e.stopPropagation()} p="sm">
                    <Stack gap="sm">
                        <Text fw={600} isNoSelect size="sm">
                            {t('page.fullscreenPlayer.lyricLayers')}
                        </Text>
                        {extraOverlayLayers.map((layer) => (
                            <div className={styles.layerRow} key={layer.key}>
                                <Text className={styles.layerLabel} isNoSelect size="sm">
                                    {layer.label}
                                </Text>
                                <Switch
                                    aria-label={layer.label}
                                    checked={visibleOverlayKeys.has(layer.key)}
                                    onChange={() => onToggleOverlayLayer(layer.key)}
                                />
                            </div>
                        ))}
                    </Stack>
                </Popover.Dropdown>
            </Popover>
        ) : null;

    return (
        <div className={styles.root}>
            {showTopRow ? (
                <Group className={styles.topRow} gap="xs" justify="center">
                    {hasLyrics ? (
                        <Button
                            onClick={onExportLyrics}
                            size="compact-sm"
                            uppercase
                            variant="subtle"
                        >
                            {t('form.lyricsExport.export')}
                        </Button>
                    ) : null}
                    {languageMenu}
                    {overlayToggleIcons}
                    {extraLayersPopover}
                </Group>
            ) : null}
            <Group className={styles.controlsRow} gap="xs" justify="center">
                {isDesktop && sources.length ? (
                    <Button
                        disabled={isActionsDisabled}
                        onClick={() =>
                            openLyricSearchModal({
                                artist: currentSong?.artistName,
                                name: currentSong?.name,
                                onSearchOverride,
                            })
                        }
                        uppercase
                        variant="subtle"
                    >
                        {t('common.search')}
                    </Button>
                ) : null}
                <ActionIcon
                    aria-label="Decrease lyric offset"
                    disabled={isActionsDisabled}
                    icon="minus"
                    onClick={() => handleLyricOffset(offsetMs - 50)}
                    tooltip={{
                        label: t('common.slower'),
                        openDelay: 0,
                    }}
                    variant="subtle"
                />
                <Tooltip label={t('setting.lyricOffset')} openDelay={0}>
                    <NumberInput
                        aria-label="Lyric offset"
                        disabled={isActionsDisabled}
                        onChange={handleLyricOffset}
                        styles={{ input: { textAlign: 'center' } }}
                        value={offsetMs || 0}
                        width={70}
                    />
                </Tooltip>
                <ActionIcon
                    aria-label="Increase lyric offset"
                    disabled={isActionsDisabled}
                    icon="plus"
                    onClick={() => handleLyricOffset(offsetMs + 50)}
                    tooltip={{
                        label: t('common.faster'),
                        openDelay: 0,
                    }}
                    variant="subtle"
                />
                {isDesktop && sources.length ? (
                    <Button
                        disabled={isActionsDisabled}
                        onClick={onRemoveLyric}
                        uppercase
                        variant="subtle"
                    >
                        {hasLyrics ? t('common.clear') : t('common.refresh')}
                    </Button>
                ) : null}
                {isDesktop && sources.length && onTranslateLyric && !hasServerTranslationLayer ? (
                    <Button
                        disabled={isActionsDisabled}
                        onClick={onTranslateLyric}
                        uppercase
                        variant="subtle"
                    >
                        {t('common.translation')}
                    </Button>
                ) : null}
            </Group>
        </div>
    );
};
