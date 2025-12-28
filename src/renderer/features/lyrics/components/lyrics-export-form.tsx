import { closeAllModals, openModal } from '@mantine/modals';
import formatDuration from 'format-duration';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import i18n from '/@/i18n/i18n';
import { Button } from '/@/shared/components/button/button';
import { Checkbox } from '/@/shared/components/checkbox/checkbox';
import { Code } from '/@/shared/components/code/code';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { Stack } from '/@/shared/components/stack/stack';
import { useForm } from '/@/shared/hooks/use-form';
import { FullLyricsMetadata } from '/@/shared/types/domain-types';

interface LyricsExportFormProps {
    lyrics: FullLyricsMetadata;
    offsetMs: number;
    synced: boolean;
}

export const LyricsExportForm = ({ lyrics, offsetMs, synced }: LyricsExportFormProps) => {
    const { t } = useTranslation();

    const form = useForm({
        initialValues: {
            offsetMs,
            synced,
        },
    });

    const displayedLyrics = useMemo(() => {
        if (form.values.synced && Array.isArray(lyrics.lyrics)) {
            const contents = lyrics.lyrics
                .map(
                    (lyric) =>
                        `[${formatDuration(lyric[0], { leading: true, ms: true })}]${lyric[1]}`,
                )
                .join('\n');

            return `[ar:${lyrics.artist}]
[ti:${lyrics.name}]
[offset:${form.values.offsetMs + (lyrics.offsetMs ?? 0)}]
${contents}
`;
        } else {
            if (Array.isArray(lyrics.lyrics)) {
                return lyrics.lyrics.map((lyric) => lyric[1]).join('\n') + '\n';
            }
            return lyrics.lyrics;
        }
    }, [
        form.values.offsetMs,
        form.values.synced,
        lyrics.artist,
        lyrics.lyrics,
        lyrics.name,
        lyrics.offsetMs,
    ]);

    const exportLyrics = useCallback(() => {
        const extension = form.values.synced ? '.lrc' : '.txt';
        const lyricFile = new File([displayedLyrics], lyrics.name + extension, {
            type: 'text/plain',
        });

        const lyricsFileLink = document.createElement('a');
        const lyricsFileUrl = URL.createObjectURL(lyricFile);
        lyricsFileLink.href = lyricsFileUrl;
        lyricsFileLink.download = lyricFile.name;
        lyricsFileLink.click();

        URL.revokeObjectURL(lyricsFileUrl);

        closeAllModals();
    }, [displayedLyrics, form.values.synced, lyrics.name]);

    return (
        <Stack h="100%" w="100%">
            {synced && (
                <form>
                    <Group grow>
                        <Checkbox
                            data-autofocus
                            label={t('form.lyricsExport.input', {
                                context: 'synced',
                                postProcess: 'titleCase',
                            })}
                            {...form.getInputProps('synced', { type: 'checkbox' })}
                        />
                        <NumberInput
                            data-autofocus
                            label={t('form.lyricsExport.input', {
                                context: 'offset',
                                postProcess: 'titleCase',
                            })}
                            {...form.getInputProps('offsetMs')}
                        />
                    </Group>
                </form>
            )}
            <Code block>{displayedLyrics}</Code>
            <Divider />
            <Group justify="flex-end">
                <Button onClick={() => closeAllModals()} variant="default">
                    {t('common.close', { postProcess: 'titleCase' })}
                </Button>
                <Button onClick={exportLyrics} variant="filled">
                    {t('form.lyricsExport.export', { postProcess: 'titleCase' })}
                </Button>
            </Group>
        </Stack>
    );
};

export const openLyricsExportModal = ({ lyrics, offsetMs, synced }: LyricsExportFormProps) => {
    openModal({
        children: <LyricsExportForm lyrics={lyrics} offsetMs={offsetMs} synced={synced} />,
        size: 'xl',
        styles: {
            body: {
                height: '600px',
            },
        },
        title: i18n.t('form.lyricSearch.title', { postProcess: 'titleCase' }) as string,
    });
};
