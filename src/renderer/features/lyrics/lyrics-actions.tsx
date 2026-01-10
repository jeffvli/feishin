import isElectron from 'is-electron';
import { useTranslation } from 'react-i18next';

import { openLyricSearchModal } from '/@/renderer/features/lyrics/components/lyrics-search-form';
import { useLyricsSettings, usePlayerSong } from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { Center } from '/@/shared/components/center/center';
import { Group } from '/@/shared/components/group/group';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { Select } from '/@/shared/components/select/select';
import { Tooltip } from '/@/shared/components/tooltip/tooltip';
import { LyricsOverride } from '/@/shared/types/domain-types';

interface LyricsActionsProps {
    hasLyrics: boolean;
    index: number;
    languages: { label: string; value: string }[];
    offsetMs: number;
    onExportLyrics: () => void;
    onRemoveLyric: () => void;
    onSearchOverride: (params: LyricsOverride) => void;
    onTranslateLyric?: () => void;
    onUpdateOffset: (offsetMs: number) => void;
    setIndex: (idx: number) => void;
    settingsKey?: string;
    synced?: boolean;
}

export const LyricsActions = ({
    hasLyrics,
    index,
    languages,
    offsetMs,
    onExportLyrics,
    onRemoveLyric,
    onSearchOverride,
    onTranslateLyric,
    onUpdateOffset,
    setIndex,
}: LyricsActionsProps) => {
    const { t } = useTranslation();
    const currentSong = usePlayerSong();
    const { sources } = useLyricsSettings();

    const handleLyricOffset = (e: number | string) => {
        onUpdateOffset(Number(e));
    };

    const isActionsDisabled = !currentSong;
    const isDesktop = isElectron();

    return (
        <>
            <div style={{ position: 'relative', width: '100%' }}>
                {hasLyrics && (
                    <Center pb="md">
                        {languages.length > 1 && (
                            <Select
                                clearable={false}
                                data={languages}
                                onChange={(value) => setIndex(parseInt(value!, 10))}
                                style={{ bottom: 30, position: 'absolute' }}
                                value={index.toString()}
                            />
                        )}
                        <Button
                            onClick={onExportLyrics}
                            size="compact-sm"
                            uppercase
                            variant="subtle"
                        >
                            {t('form.lyricsExport.export', { postProcess: 'sentenceCase ' })}
                        </Button>
                    </Center>
                )}

                <Group justify="center">
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
                            {t('common.search', { postProcess: 'titleCase' })}
                        </Button>
                    ) : null}
                    <ActionIcon
                        aria-label="Decrease lyric offset"
                        icon="minus"
                        onClick={() => handleLyricOffset(offsetMs - 50)}
                        tooltip={{
                            label: t('common.slower', { postProcess: 'sentenceCase' }),
                            openDelay: 0,
                        }}
                        variant="subtle"
                    />
                    <Tooltip
                        label={t('setting.lyricOffset', { postProcess: 'sentenceCase' })}
                        openDelay={0}
                    >
                        <NumberInput
                            aria-label="Lyric offset"
                            onChange={handleLyricOffset}
                            styles={{ input: { textAlign: 'center' } }}
                            value={offsetMs || 0}
                            width={70}
                        />
                    </Tooltip>
                    <ActionIcon
                        aria-label="Increase lyric offset"
                        icon="plus"
                        onClick={() => handleLyricOffset(offsetMs + 50)}
                        tooltip={{
                            label: t('common.faster', { postProcess: 'sentenceCase' }),
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
                            {t('common.clear', { postProcess: 'sentenceCase' })}
                        </Button>
                    ) : null}
                </Group>

                <div style={{ position: 'absolute', right: 0, top: -50 }}>
                    {isDesktop && sources.length && onTranslateLyric ? (
                        <Button
                            disabled={isActionsDisabled}
                            onClick={onTranslateLyric}
                            uppercase
                            variant="subtle"
                        >
                            {t('common.translation', { postProcess: 'sentenceCase' })}
                        </Button>
                    ) : null}
                </div>
            </div>
        </>
    );
};
