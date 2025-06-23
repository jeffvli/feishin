import { useForm } from '@mantine/form';
import { useDebouncedValue } from '@mantine/hooks';
import { openModal } from '@mantine/modals';
import orderBy from 'lodash/orderBy';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './lyrics-search-form.module.css';

import i18n from '/@/i18n/i18n';
import { useLyricSearch } from '/@/renderer/features/lyrics/queries/lyric-search-query';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { ScrollArea } from '/@/shared/components/scroll-area/scroll-area';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Stack } from '/@/shared/components/stack/stack';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Text } from '/@/shared/components/text/text';
import {
    InternetProviderLyricSearchResponse,
    LyricSource,
    LyricsOverride,
} from '/@/shared/types/domain-types';

interface SearchResultProps {
    data: InternetProviderLyricSearchResponse;
    onClick?: () => void;
}
const SearchResult = ({ data, onClick }: SearchResultProps) => {
    const { artist, id, name, score, source } = data;

    const percentageScore = useMemo(() => {
        if (!score) return 0;
        return ((1 - score) * 100).toFixed(2);
    }, [score]);

    const cleanId =
        source === LyricSource.GENIUS ? id.replace(/^((http[s]?|ftp):\/)?\/?([^:/\s]+)/g, '') : id;

    return (
        <button
            className={styles.searchItem}
            onClick={onClick}
        >
            <Group
                justify="space-between"
                wrap="nowrap"
            >
                <Stack
                    gap={0}
                    maw="65%"
                >
                    <Text
                        fw={600}
                        size="md"
                    >
                        {name}
                    </Text>
                    <Text isMuted>{artist}</Text>
                    <Group
                        gap="sm"
                        wrap="nowrap"
                    >
                        <Text
                            isMuted
                            size="sm"
                        >
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
    const form = useForm({
        initialValues: {
            artist: artist || '',
            name: name || '',
        },
    });

    const [debouncedArtist] = useDebouncedValue(form.values.artist, 500);
    const [debouncedName] = useDebouncedValue(form.values.name, 500);

    const { data, isInitialLoading } = useLyricSearch({
        query: { artist: debouncedArtist, name: debouncedName },
    });

    const searchResults = useMemo(() => {
        if (!data) return [];

        const results: InternetProviderLyricSearchResponse[] = [];
        Object.keys(data).forEach((key) => {
            (data[key as keyof typeof data] || []).forEach((result) => results.push(result));
        });

        const scoredResults = orderBy(results, ['score'], ['asc']);

        return scoredResults;
    }, [data]);

    return (
        <Stack w="100%">
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
            {isInitialLoading ? (
                <Spinner container />
            ) : (
                <ScrollArea
                    style={{
                        height: '400px',
                        paddingRight: '1rem',
                    }}
                >
                    <Stack gap="md">
                        {searchResults.map((result) => (
                            <SearchResult
                                data={result}
                                key={`${result.source}-${result.id}`}
                                onClick={() => {
                                    onSearchOverride?.({
                                        artist: result.artist,
                                        id: result.id,
                                        name: result.name,
                                        remote: true,
                                        source: result.source as LyricSource,
                                    });
                                }}
                            />
                        ))}
                    </Stack>
                </ScrollArea>
            )}
        </Stack>
    );
};

export const openLyricSearchModal = ({ artist, name, onSearchOverride }: LyricSearchFormProps) => {
    openModal({
        children: (
            <LyricsSearchForm
                artist={artist}
                name={name}
                onSearchOverride={onSearchOverride}
            />
        ),
        size: 'lg',
        title: i18n.t('form.lyricSearch.title', { postProcess: 'titleCase' }) as string,
    });
};
