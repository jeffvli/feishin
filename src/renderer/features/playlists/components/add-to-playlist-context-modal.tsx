import { useForm } from '@mantine/form';
import { closeModal, ContextModalProps } from '@mantine/modals';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './add-to-playlist-context-modal.module.css';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { getGenreSongsById } from '/@/renderer/features/player';
import { useAddToPlaylist } from '/@/renderer/features/playlists/mutations/add-to-playlist-mutation';
import { usePlaylistList } from '/@/renderer/features/playlists/queries/playlist-list-query';
import { queryClient } from '/@/renderer/lib/react-query';
import { useCurrentServer } from '/@/renderer/store';
import { formatDurationString } from '/@/renderer/utils';
import { Box } from '/@/shared/components/box/box';
import { Button } from '/@/shared/components/button/button';
import { Checkbox } from '/@/shared/components/checkbox/checkbox';
import { Flex } from '/@/shared/components/flex/flex';
import { Grid } from '/@/shared/components/grid/grid';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Image } from '/@/shared/components/image/image';
import { ModalButton } from '/@/shared/components/modal/model-shared';
import { Pill } from '/@/shared/components/pill/pill';
import { ScrollArea } from '/@/shared/components/scroll-area/scroll-area';
import { Stack } from '/@/shared/components/stack/stack';
import { Switch } from '/@/shared/components/switch/switch';
import { Table } from '/@/shared/components/table/table';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';
import {
    Playlist,
    PlaylistListSort,
    SongListQuery,
    SongListSort,
    SortOrder,
} from '/@/shared/types/domain-types';

export const AddToPlaylistContextModal = ({
    id,
    innerProps,
}: ContextModalProps<{
    albumId?: string[];
    artistId?: string[];
    genreId?: string[];
    songId?: string[];
}>) => {
    const { t } = useTranslation();
    const { albumId, artistId, genreId, songId } = innerProps;
    const server = useCurrentServer();
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState<string>('');
    const [focusedRowIndex, setFocusedRowIndex] = useState<null | number>(null);
    const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);
    const formRef = useRef<HTMLFormElement>(null);

    const form = useForm({
        initialValues: {
            newPlaylists: [] as string[],
            selectedPlaylistIds: [] as string[],
            skipDuplicates: true,
        },
    });

    const addToPlaylistMutation = useAddToPlaylist({});

    const playlistList = usePlaylistList({
        query: {
            _custom: {
                navidrome: {
                    smart: false,
                },
            },
            sortBy: PlaylistListSort.NAME,
            sortOrder: SortOrder.ASC,
            startIndex: 0,
        },
        serverId: server?.id,
    });

    const [playlistSelect, playlistMap] = useMemo(() => {
        const existingPlaylists = new Array<Playlist & { label: string; value: string }>();
        const playlistMap = new Map<string, string>();

        for (const playlist of playlistList.data?.items ?? []) {
            existingPlaylists.push({ ...playlist, label: playlist.name, value: playlist.id });
            playlistMap.set(playlist.id, playlist.name);
        }

        return [existingPlaylists, playlistMap];
    }, [playlistList.data]);

    const filteredItems = useMemo(() => {
        if (search) {
            return playlistSelect.filter((item) =>
                item.label.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
            );
        }

        return playlistSelect;
    }, [playlistSelect, search]);

    const getSongsByAlbum = useCallback(
        async (albumId: string) => {
            const query: SongListQuery = {
                albumIds: [albumId],
                sortBy: SongListSort.ALBUM,
                sortOrder: SortOrder.ASC,
                startIndex: 0,
            };

            const queryKey = queryKeys.songs.list(server?.id || '', query);

            const songsRes = await queryClient.fetchQuery(queryKey, ({ signal }) => {
                if (!server) throw new Error('No server');
                return api.controller.getSongList({ apiClientProps: { server, signal }, query });
            });

            return songsRes;
        },
        [server],
    );

    const getSongsByArtist = useCallback(
        async (artistId: string) => {
            const query: SongListQuery = {
                artistIds: [artistId],
                sortBy: SongListSort.ARTIST,
                sortOrder: SortOrder.ASC,
                startIndex: 0,
            };

            const queryKey = queryKeys.songs.list(server?.id || '', query);

            const songsRes = await queryClient.fetchQuery(queryKey, ({ signal }) => {
                if (!server) throw new Error('No server');
                return api.controller.getSongList({ apiClientProps: { server, signal }, query });
            });

            return songsRes;
        },
        [server],
    );

    const handleSubmit = form.onSubmit(async (values) => {
        if (isLoading) {
            return;
        }

        setIsLoading(true);
        const allSongIds: string[] = [];
        let totalUniquesAdded = 0;

        try {
            if (albumId && albumId.length > 0) {
                for (const id of albumId) {
                    const songs = await getSongsByAlbum(id);
                    allSongIds.push(...(songs?.items?.map((song) => song.id) || []));
                }
            }

            if (artistId && artistId.length > 0) {
                for (const id of artistId) {
                    const songs = await getSongsByArtist(id);
                    allSongIds.push(...(songs?.items?.map((song) => song.id) || []));
                }
            }

            if (genreId && genreId.length > 0) {
                const songs = await getGenreSongsById({
                    id: genreId,
                    queryClient,
                    server,
                });

                allSongIds.push(...(songs?.items?.map((song) => song.id) || []));
            }

            if (songId && songId.length > 0) {
                allSongIds.push(...songId);
            }

            const playlistIds = [...values.selectedPlaylistIds];

            if (values.newPlaylists) {
                for (const playlist of values.newPlaylists) {
                    try {
                        const response = await api.controller.createPlaylist({
                            apiClientProps: { server },
                            body: {
                                name: playlist,
                                public: false,
                            },
                        });

                        if (response?.id) {
                            playlistIds.push(response?.id);
                        }
                    } catch (error: any) {
                        toast.error({
                            message: `[${playlist}] ${error?.message}`,
                            title: t('error.genericError', { postProcess: 'sentenceCase' }),
                        });
                    }
                }
            }

            for (const playlistId of playlistIds) {
                const uniqueSongIds: string[] = [];

                if (values.skipDuplicates) {
                    const queryKey = queryKeys.playlists.songList(server?.id || '', playlistId);

                    const playlistSongsRes = await queryClient.fetchQuery(
                        queryKey,
                        ({ signal }) => {
                            if (!server)
                                throw new Error(
                                    t('error.serverNotSelectedError', {
                                        postProcess: 'sentenceCase',
                                    }),
                                );
                            return api.controller.getPlaylistSongList({
                                apiClientProps: {
                                    server,
                                    signal,
                                },
                                query: {
                                    id: playlistId,
                                },
                            });
                        },
                    );

                    const playlistSongIds = playlistSongsRes?.items?.map((song) => song.id);

                    for (const songId of allSongIds) {
                        if (!playlistSongIds?.includes(songId)) {
                            uniqueSongIds.push(songId);
                        }
                    }
                    totalUniquesAdded += uniqueSongIds.length;
                }

                if (values.skipDuplicates ? uniqueSongIds.length > 0 : allSongIds.length > 0) {
                    if (!server) {
                        setIsLoading(false);
                        return;
                    }
                    addToPlaylistMutation.mutate(
                        {
                            body: { songId: values.skipDuplicates ? uniqueSongIds : allSongIds },
                            query: { id: playlistId },
                            serverId: server?.id,
                        },
                        {
                            onError: (err) => {
                                toast.error({
                                    message: `[${
                                        playlistSelect.find(
                                            (playlist) => playlist.value === playlistId,
                                        )?.label
                                    }] ${err.message}`,
                                    title: t('error.genericError', { postProcess: 'sentenceCase' }),
                                });
                            },
                        },
                    );
                }
            }

            const addMessage =
                values.skipDuplicates &&
                allSongIds.length * playlistIds.length !== totalUniquesAdded
                    ? Math.floor(totalUniquesAdded / playlistIds.length)
                    : allSongIds.length;

            setIsLoading(false);
            toast.success({
                message: t('form.addToPlaylist.success', {
                    message: addMessage,
                    numOfPlaylists: playlistIds.length,
                    postProcess: 'sentenceCase',
                }),
            });
            closeModal(id);
        } catch (error: any) {
            setIsLoading(false);
            toast.error({
                message: error?.message || t('error.genericError', { postProcess: 'sentenceCase' }),
                title: t('error.genericError', { postProcess: 'sentenceCase' }),
            });
        }
    });

    const handleSelectItem = useCallback(
        (item: { value: string }) => {
            const currentIds = form.values.selectedPlaylistIds;
            if (currentIds.includes(item.value)) {
                form.setFieldValue(
                    'selectedPlaylistIds',
                    currentIds.filter((id) => id !== item.value),
                );
            } else {
                form.setFieldValue('selectedPlaylistIds', [...currentIds, item.value]);
            }
        },
        [form],
    );

    const handleCheckboxChange = useCallback(
        (itemValue: string, checked: boolean) => {
            const currentIds = form.values.selectedPlaylistIds;
            if (checked) {
                form.setFieldValue('selectedPlaylistIds', [...currentIds, itemValue]);
            } else {
                form.setFieldValue(
                    'selectedPlaylistIds',
                    currentIds.filter((id) => id !== itemValue),
                );
            }
        },
        [form],
    );

    const handleCreatePlaylist = useCallback(() => {
        form.setFieldValue('newPlaylists', [...form.values.newPlaylists, search]);
        setSearch('');
    }, [form, search]);

    const handleRemoveSelectedPlaylist = useCallback(
        (playlistId: string) => {
            form.setFieldValue(
                'selectedPlaylistIds',
                form.values.selectedPlaylistIds.filter((id) => id !== playlistId),
            );
        },
        [form],
    );

    const handleRemoveNewPlaylist = useCallback(
        (index: number) => {
            form.setFieldValue(
                'newPlaylists',
                form.values.newPlaylists.filter((_, existingIdx) => index !== existingIdx),
            );
        },
        [form],
    );

    const handleKeyDown = useCallback(
        (
            event: React.KeyboardEvent<HTMLTableRowElement>,
            index: number,
            item: { value: string },
        ) => {
            const totalRows = filteredItems.length;

            switch (event.key) {
                case ' ': {
                    event.preventDefault();
                    event.stopPropagation();
                    handleSelectItem(item);
                    break;
                }
                case 'ArrowDown': {
                    event.preventDefault();
                    const nextIndex = index < totalRows - 1 ? index + 1 : index;
                    setFocusedRowIndex(nextIndex);
                    rowRefs.current[nextIndex]?.focus();
                    break;
                }
                case 'ArrowUp': {
                    event.preventDefault();
                    const prevIndex = index > 0 ? index - 1 : 0;
                    setFocusedRowIndex(prevIndex);
                    rowRefs.current[prevIndex]?.focus();
                    break;
                }
                case 'Enter': {
                    event.preventDefault();
                    if (formRef.current) {
                        formRef.current.requestSubmit();
                    }
                    break;
                }
                case 'Tab': {
                    // Allow Tab to exit the table naturally - don't prevent default
                    setFocusedRowIndex(null);
                    break;
                }
                default:
                    break;
            }
        },
        [filteredItems.length, handleSelectItem],
    );

    const setRowRef = useCallback(
        (index: number) => (el: HTMLTableRowElement | null) => {
            rowRefs.current[index] = el;
        },
        [],
    );

    return (
        <Box>
            <form onSubmit={handleSubmit} ref={formRef}>
                <Stack>
                    <TextInput
                        data-autofocus
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('form.addToPlaylist.searchOrCreate', {
                            postProcess: 'sentenceCase',
                        })}
                        value={search}
                    />
                    <ScrollArea style={{ maxHeight: '18rem' }}>
                        <Table styles={{ td: { padding: 'var(--theme-spacing-sm)' } }}>
                            <Table.Tbody>
                                {filteredItems.map((item, index) => (
                                    <Table.Tr
                                        key={item.value}
                                        onBlur={() => setFocusedRowIndex(null)}
                                        onClick={() => handleSelectItem(item)}
                                        onFocus={() => setFocusedRowIndex(index)}
                                        onKeyDown={(e) => handleKeyDown(e, index, item)}
                                        ref={setRowRef(index)}
                                        role="button"
                                        style={{
                                            background:
                                                focusedRowIndex === index
                                                    ? 'var(--theme-colors-surface)'
                                                    : 'transparent',
                                            cursor: 'pointer',
                                            outline: 'none',
                                        }}
                                        tabIndex={index === 0 ? 0 : -1}
                                    >
                                        <Table.Td w={10}>
                                            <Checkbox
                                                checked={form.values.selectedPlaylistIds.includes(
                                                    item.value,
                                                )}
                                                onChange={(event) => {
                                                    handleCheckboxChange(
                                                        item.value,
                                                        event.target.checked,
                                                    );
                                                    event.preventDefault();
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                tabIndex={-1}
                                            />
                                        </Table.Td>
                                        <Table.Td style={{ maxWidth: 0, width: '100%' }}>
                                            <PlaylistTableItem item={item} />
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </ScrollArea>
                    {search && (
                        <Button
                            leftSection={<Icon icon="add" size="lg" />}
                            onClick={handleCreatePlaylist}
                            variant="subtle"
                            w="100%"
                        >
                            {t('form.addToPlaylist.create', {
                                playlist: search,
                                postProcess: 'sentenceCase',
                            })}
                        </Button>
                    )}
                    <Pill.Group>
                        {form.values.selectedPlaylistIds.map((item) => (
                            <Pill
                                key={item}
                                onRemove={() => handleRemoveSelectedPlaylist(item)}
                                withRemoveButton
                            >
                                {playlistMap.get(item)}
                            </Pill>
                        ))}
                        {form.values.newPlaylists.map((item, idx) => (
                            <Pill
                                key={idx}
                                onRemove={() => handleRemoveNewPlaylist(idx)}
                                withRemoveButton
                            >
                                <Flex align="center" gap="lg" wrap="nowrap">
                                    <Icon icon="plus" />
                                    {item}
                                </Flex>
                            </Pill>
                        ))}
                    </Pill.Group>
                    <Switch
                        label={t('form.addToPlaylist.input', {
                            context: 'skipDuplicates',
                            postProcess: 'titleCase',
                        })}
                        {...form.getInputProps('skipDuplicates', { type: 'checkbox' })}
                    />
                    <Group justify="flex-end">
                        <ModalButton
                            disabled={isLoading || addToPlaylistMutation.isLoading}
                            onClick={() => closeModal(id)}
                            uppercase
                            variant="subtle"
                        >
                            {t('common.cancel', { postProcess: 'titleCase' })}
                        </ModalButton>
                        <ModalButton
                            disabled={
                                isLoading ||
                                addToPlaylistMutation.isLoading ||
                                (form.values.selectedPlaylistIds.length === 0 &&
                                    form.values.newPlaylists.length === 0)
                            }
                            loading={isLoading}
                            type="submit"
                            uppercase
                            variant="filled"
                        >
                            {t('common.add', { postProcess: 'titleCase' })}
                        </ModalButton>
                    </Group>
                </Stack>
            </form>
        </Box>
    );
};

const PlaylistTableItem = memo(
    ({ item }: { item: Playlist & { label: string; value: string } }) => {
        const { t } = useTranslation();

        return (
            <Box className={styles.container} w="100%">
                <Grid align="center" gutter="xs" w="100%">
                    <Grid.Col span="content">
                        <Flex align="center" justify="center" px="sm">
                            {item.imageUrl && (
                                <Image
                                    imageContainerProps={{
                                        className: styles.imageContainer,
                                    }}
                                    src={item.imageUrl}
                                />
                            )}
                        </Flex>
                    </Grid.Col>
                    <Grid.Col className={styles.gridCol} span="auto">
                        <Stack gap="xs" w="100%">
                            <Text className={styles.labelText} isNoSelect overflow="hidden">
                                {item.label}
                            </Text>
                            <Group justify="space-between" wrap="nowrap">
                                <Group gap="md" wrap="nowrap">
                                    <Group align="center" gap="xs" wrap="nowrap">
                                        <Icon color="muted" icon="track" size="sm" />
                                        <Text isMuted size="sm">
                                            {item.songCount}
                                        </Text>
                                    </Group>
                                    <Group align="center" gap="xs" wrap="nowrap">
                                        <Icon color="muted" icon="duration" size="sm" />
                                        <Text isMuted size="sm">
                                            {formatDurationString(item.duration ?? 0)}
                                        </Text>
                                    </Group>
                                </Group>

                                <Text className={styles.statusText} isMuted size="sm">
                                    {item.public
                                        ? t('common.public', {
                                              postProcess: 'titleCase',
                                          })
                                        : t('common.private', {
                                              postProcess: 'titleCase',
                                          })}
                                </Text>
                            </Group>
                        </Stack>
                    </Grid.Col>
                </Grid>
            </Box>
        );
    },
);
