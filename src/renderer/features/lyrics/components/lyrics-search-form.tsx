import { closeAllModals, openModal } from '@mantine/modals';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import orderBy from 'lodash/orderBy';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './lyrics-search-form.module.css';

import i18n from '/@/i18n/i18n';
import { lyricsQueries } from '/@/renderer/features/lyrics/api/lyrics-api';
import { openLyricsExportModal } from '/@/renderer/features/lyrics/components/lyrics-export-form';
import {
    SynchronizedLyrics,
    SynchronizedLyricsProps,
} from '/@/renderer/features/lyrics/synchronized-lyrics';
import {
    UnsynchronizedLyrics,
    UnsynchronizedLyricsProps,
} from '/@/renderer/features/lyrics/unsynchronized-lyrics';
import { usePlayerSong } from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';
import { Center } from '/@/shared/components/center/center';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { ScrollArea } from '/@/shared/components/scroll-area/scroll-area';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Stack } from '/@/shared/components/stack/stack';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Text } from '/@/shared/components/text/text';
import { useDebouncedValue } from '/@/shared/hooks/use-debounced-value';
import { useForm } from '/@/shared/hooks/use-form';
import {
    FullLyricsMetadata,
    InternetProviderLyricSearchResponse,
    LyricSource,
    LyricsOverride,
} from '/@/shared/types/domain-types';

interface SearchResultProps {
    data: InternetProviderLyricSearchResponse;
    isSelected?: boolean;
    onClick?: () => void;
}
const SearchResult = ({ data, isSelected, onClick }: SearchResultProps) => {
    const { artist, id, name, score, source } = data;

    const percentageScore = useMemo(() => {
        if (!score) return 0;
        return ((1 - score) * 100).toFixed(2);
    }, [score]);

    const cleanId =
        source === LyricSource.GENIUS ? id.replace(/^((http[s]?|ftp):\/)?\/?([^:/\s]+)/g, '') : id;

    return (
        <button
            className={clsx(styles.searchItem, {
                [styles.selected]: isSelected,
            })}
            onClick={onClick}
        >
            <Group justify="space-between" wrap="nowrap">
                <Stack gap={0} maw="65%">
                    <Text fw={600} size="md">
                        {name}
                    </Text>
                    <Text isMuted>{artist}</Text>
                    <Group gap="sm" wrap="nowrap">
                        <Text isMuted size="sm">
                            {[source, cleanId].join(' — ')}
                        </Text>
                    </Group>
                </Stack>
                <Text>{percentageScore}%</Text>
            </Group>
        </button>
    );
};

interface LyricSearchFormProps {
    artist?: string;
    name?: string;
    onSearchOverride?: (params: LyricsOverride) => void;
}

export const LyricsSearchForm = ({ artist, name, onSearchOverride }: LyricSearchFormProps) => {
    const { t } = useTranslation();
    const currentSong = usePlayerSong();
    const [selectedResult, setSelectedResult] =
        useState<InternetProviderLyricSearchResponse | null>(null);

    const form = useForm({
        initialValues: {
            artist: artist || '',
            name: name || '',
        },
    });

    const [debouncedArtist] = useDebouncedValue(form.values.artist, 500);
    const [debouncedName] = useDebouncedValue(form.values.name, 500);

    const { data, isInitialLoading } = useQuery(
        lyricsQueries.search({
            query: { artist: debouncedArtist, name: debouncedName },
        }),
    );

    const { data: previewData, isInitialLoading: isPreviewLoading } = useQuery(
        lyricsQueries.songLyricsByRemoteId({
            options: {
                enabled: !!selectedResult,
            },
            query: {
                remoteSongId: selectedResult?.id,
                remoteSource: selectedResult?.source as LyricSource | undefined,
                song: currentSong,
            },
            serverId: currentSong?._serverId || '',
        }),
    );

    const searchResults = useMemo(() => {
        if (!data) return [];

        const results: InternetProviderLyricSearchResponse[] = [];
        Object.keys(data).forEach((key) => {
            (data[key as keyof typeof data] || []).forEach((result) => results.push(result));
        });

        const scoredResults = orderBy(results, ['score'], ['asc']);

        return scoredResults;
    }, [data]);

    const handleApply = () => {
        if (selectedResult && onSearchOverride) {
            onSearchOverride({
                artist: selectedResult.artist,
                id: selectedResult.id,
                name: selectedResult.name,
                remote: true,
                source: selectedResult.source as LyricSource,
            });
            closeAllModals();
        }
    };

    const handleExport = () => {
        if (selectedResult && previewData) {
            const lyricsMetadata: FullLyricsMetadata = {
                artist: selectedResult.artist,
                lyrics: previewData,
                name: selectedResult.name,
                offsetMs: 0,
                remote: true,
                source: selectedResult.source,
            };
            const synced = Array.isArray(previewData);
            openLyricsExportModal({ lyrics: lyricsMetadata, offsetMs: 0, synced });
        }
    };

    return (
        <Stack h="100%" w="100%">
            <form>
                <Group grow>
                    <TextInput
                        data-autofocus
                        label={t('form.lyricSearch.input', {
                            context: 'name',
                            postProcess: 'titleCase',
                        })}
                        {...form.getInputProps('name')}
                    />
                    <TextInput
                        label={t('form.lyricSearch.input', {
                            context: 'artist',
                            postProcess: 'titleCase',
                        })}
                        {...form.getInputProps('artist')}
                    />
                </Group>
            </form>
            <Divider />
            <Group align="flex-start" grow style={{ flex: 1, minHeight: 0 }}>
                <Stack style={{ flex: 1, height: '100%', minHeight: 0 }}>
                    <ScrollArea
                        style={{
                            height: '100%',
                            paddingRight: '1rem',
                        }}
                    >
                        {isInitialLoading ? (
                            <Spinner container />
                        ) : (
                            <Stack gap="md">
                                {searchResults.map((result) => (
                                    <SearchResult
                                        data={result}
                                        isSelected={
                                            selectedResult?.id === result.id &&
                                            selectedResult?.source === result.source
                                        }
                                        key={`${result.source}-${result.id}`}
                                        onClick={() => setSelectedResult(result)}
                                    />
                                ))}
                            </Stack>
                        )}
                    </ScrollArea>
                </Stack>
                {selectedResult && (
                    <Stack style={{ flex: 1, height: '100%', minHeight: 0 }}>
                        {isPreviewLoading ? (
                            <Spinner container />
                        ) : previewData ? (
                            Array.isArray(previewData) ? (
                                <SynchronizedLyrics
                                    style={{ padding: 0 }}
                                    {...({
                                        artist: selectedResult.artist,
                                        lyrics: previewData,
                                        name: selectedResult.name,
                                        remote: true,
                                        source: selectedResult.source,
                                    } as SynchronizedLyricsProps)}
                                />
                            ) : (
                                <UnsynchronizedLyrics
                                    {...({
                                        artist: selectedResult.artist,
                                        lyrics: previewData,
                                        name: selectedResult.name,
                                        remote: true,
                                        source: selectedResult.source,
                                    } as UnsynchronizedLyricsProps)}
                                />
                            )
                        ) : (
                            <Center>
                                <Text isMuted>
                                    {t('page.fullscreenPlayer.noLyrics', {
                                        postProcess: 'sentenceCase',
                                    })}
                                </Text>
                            </Center>
                        )}
                    </Stack>
                )}
            </Group>
            <Divider />
            <Group justify="flex-end">
                <Button onClick={() => closeAllModals()} variant="default">
                    {t('common.cancel', { postProcess: 'titleCase' })}
                </Button>
                <Button
                    disabled={!selectedResult || !previewData}
                    onClick={handleExport}
                    variant="default"
                >
                    {t('form.lyricsExport.export', { postProcess: 'titleCase' })}
                </Button>
                <Button disabled={!selectedResult} onClick={handleApply} variant="filled">
                    {t('common.confirm', { postProcess: 'titleCase' })}
                </Button>
            </Group>
        </Stack>
    );
};

export const openLyricSearchModal = ({ artist, name, onSearchOverride }: LyricSearchFormProps) => {
    openModal({
        children: (
            <LyricsSearchForm artist={artist} name={name} onSearchOverride={onSearchOverride} />
        ),
        size: 'xl',
        styles: {
            body: {
                height: '600px',
            },
        },
        title: i18n.t('form.lyricSearch.title', { postProcess: 'titleCase' }) as string,
    });
};
