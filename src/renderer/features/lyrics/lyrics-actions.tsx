import { Box, Center, Group, Select, SelectItem } from '@mantine/core';
import isElectron from 'is-electron';
import { useTranslation } from 'react-i18next';
import { RiAddFill, RiSubtractFill } from 'react-icons/ri';
import { LyricsOverride } from '/@/renderer/api/types';
import { Button, NumberInput, Tooltip } from '/@/renderer/components';
import { openLyricSearchModal } from '/@/renderer/features/lyrics/components/lyrics-search-form';
import {
    useCurrentSong,
    useLyricsSettings,
    useSettingsStore,
    useSettingsStoreActions,
} from '/@/renderer/store';

interface LyricsActionsProps {
    index: number;
    languages: SelectItem[];

    onRemoveLyric: () => void;
    onResetLyric: () => void;
    onSearchOverride: (params: LyricsOverride) => void;
    onTranslateLyric: () => void;
    setIndex: (idx: number) => void;
}

export const LyricsActions = ({
    index,
    languages,
    onRemoveLyric,
    onResetLyric,
    onSearchOverride,
    onTranslateLyric,
    setIndex,
}: LyricsActionsProps) => {
    const { t } = useTranslation();
    const currentSong = useCurrentSong();
    const { setSettings } = useSettingsStoreActions();
    const { delayMs, sources } = useLyricsSettings();

    const handleLyricOffset = (e: number) => {
        setSettings({
            lyrics: {
                ...useSettingsStore.getState().lyrics,
                delayMs: e,
            },
        });
    };

    const isActionsDisabled = !currentSong;
    const isDesktop = isElectron();

    return (
        <Box style={{ position: 'relative', width: '100%' }}>
            {languages.length > 1 && (
                <Center>
                    <Select
                        clearable={false}
                        data={languages}
                        style={{ bottom: 30, position: 'absolute' }}
                        value={index.toString()}
                        onChange={(value) => setIndex(parseInt(value!, 10))}
                    />
                </Center>
            )}

            <Group position="center">
                {isDesktop && sources.length ? (
                    <Button
                        uppercase
                        disabled={isActionsDisabled}
                        variant="subtle"
                        onClick={() =>
                            openLyricSearchModal({
                                artist: currentSong?.artistName,
                                name: currentSong?.name,
                                onSearchOverride,
                            })
                        }
                    >
                        {t('common.search', { postProcess: 'titleCase' })}
                    </Button>
                ) : null}
                <Button
                    aria-label="Decrease lyric offset"
                    variant="subtle"
                    onClick={() => handleLyricOffset(delayMs - 50)}
                >
                    <RiSubtractFill />
                </Button>
                <Tooltip
                    label={t('setting.lyricOffset', { postProcess: 'sentenceCase' })}
                    openDelay={500}
                >
                    <NumberInput
                        aria-label="Lyric offset"
                        styles={{ input: { textAlign: 'center' } }}
                        value={delayMs || 0}
                        width={55}
                        onChange={handleLyricOffset}
                    />
                </Tooltip>
                <Button
                    aria-label="Increase lyric offset"
                    variant="subtle"
                    onClick={() => handleLyricOffset(delayMs + 50)}
                >
                    <RiAddFill />
                </Button>
                {isDesktop && sources.length ? (
                    <Button
                        uppercase
                        disabled={isActionsDisabled}
                        variant="subtle"
                        onClick={onResetLyric}
                    >
                        {t('common.reset', { postProcess: 'sentenceCase' })}
                    </Button>
                ) : null}
            </Group>

            <Box style={{ position: 'absolute', right: 0, top: 0 }}>
                {isDesktop && sources.length ? (
                    <Button
                        uppercase
                        disabled={isActionsDisabled}
                        variant="subtle"
                        onClick={onRemoveLyric}
                    >
                        {t('common.clear', { postProcess: 'sentenceCase' })}
                    </Button>
                ) : null}
            </Box>

            <Box style={{ position: 'absolute', right: 0, top: -50 }}>
                {isDesktop && sources.length ? (
                    <Button
                        uppercase
                        disabled={isActionsDisabled}
                        variant="subtle"
                        onClick={onTranslateLyric}
                    >
                        {t('common.translation', { postProcess: 'sentenceCase' })}
                    </Button>
                ) : null}
            </Box>
        </Box>
    );
};
