import { Box, Grid, Group } from '@mantine/core';
import isElectron from 'is-electron';
import { useTranslation } from 'react-i18next';
import { RiAddFill, RiSubtractFill } from 'react-icons/ri';
import { LyricsOverride } from '/@/renderer/api/types';
import { Button, NumberInput, Tooltip } from '/@/renderer/components';
import { openLyricSearchModal } from '/@/renderer/features/lyrics/components/lyrics-search-form';
import {
    useAppStoreActions,
    useCurrentSong,
    useLyricsSettings,
    useLyricsStore,
    useSettingsStore,
    useSettingsStoreActions,
} from '/@/renderer/store';
import { useCallback } from 'react';

interface LyricsActionsProps {
    onRemoveLyric: () => void;
    onResetLyric: () => void;
    onSearchOverride: (params: LyricsOverride) => void;
}

export const LyricsActions = ({
    onRemoveLyric,
    onResetLyric,
    onSearchOverride,
}: LyricsActionsProps) => {
    const { t } = useTranslation();
    const currentSong = useCurrentSong();
    const { setSettings } = useSettingsStoreActions();
    const { setLyrics } = useAppStoreActions();
    const { delayMs, sources } = useLyricsSettings();
    const { open, width } = useLyricsStore();

    const handleLyricOffset = (e: number) => {
        setSettings({
            lyrics: {
                ...useSettingsStore.getState().lyrics,
                delayMs: e,
            },
        });
    };

    const setWidth = useCallback(
        (newWidth: number) => {
            setLyrics({ open, width: newWidth });
        },
        [open, setLyrics],
    );

    const isActionsDisabled = !currentSong;
    const isDesktop = isElectron();

    return (
        <Box style={{ position: 'relative', width: '100%' }}>
            <Grid
                grow
                justify="center"
            >
                {true && (
                    <Grid.Col span="content">
                        <Tooltip
                            label={t('setting.lyricWdith', { postProcess: 'sentenceCase' })}
                            openDelay={500}
                        >
                            <NumberInput
                                aria-label="Lyric offset"
                                max={1000}
                                min={400}
                                rightSection="px"
                                styles={{ input: { textAlign: 'center' } }}
                                value={width}
                                w={100}
                                onBlur={(e) => setWidth(Number(e.currentTarget.value))}
                            />
                        </Tooltip>
                    </Grid.Col>
                )}
                {isDesktop && sources.length ? (
                    <Grid.Col span="content">
                        <Button
                            fullWidth
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
                    </Grid.Col>
                ) : null}
                <Grid.Col span="content">
                    <Group>
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
                                width={75}
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
                    </Group>
                </Grid.Col>

                {isDesktop && sources.length ? (
                    <Grid.Col span="content">
                        <Button
                            fullWidth
                            uppercase
                            disabled={isActionsDisabled}
                            variant="subtle"
                            onClick={onResetLyric}
                        >
                            {t('common.reset', { postProcess: 'sentenceCase' })}
                        </Button>
                    </Grid.Col>
                ) : null}

                {isDesktop && sources.length ? (
                    <Grid.Col span="content">
                        <Button
                            fullWidth
                            uppercase
                            color="red"
                            disabled={isActionsDisabled}
                            variant="subtle"
                            onClick={onRemoveLyric}
                        >
                            {t('common.clear', { postProcess: 'sentenceCase' })}
                        </Button>
                    </Grid.Col>
                ) : null}
            </Grid>
        </Box>
    );
};
