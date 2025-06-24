import { useDebouncedValue, useDisclosure } from '@mantine/hooks';
import { Fragment, useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, useNavigate } from 'react-router';

import { usePlayQueueAdd } from '/@/renderer/features/player';
import { Command, CommandPalettePages } from '/@/renderer/features/search/components/command';
import { GoToCommands } from '/@/renderer/features/search/components/go-to-commands';
import { HomeCommands } from '/@/renderer/features/search/components/home-commands';
import { LibraryCommandItem } from '/@/renderer/features/search/components/library-command-item';
import { ServerCommands } from '/@/renderer/features/search/components/server-commands';
import { useSearch } from '/@/renderer/features/search/queries/search-query';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer } from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Box } from '/@/shared/components/box/box';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Kbd } from '/@/shared/components/kbd/kbd';
import { Modal } from '/@/shared/components/modal/modal';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { LibraryItem } from '/@/shared/types/domain-types';

interface CommandPaletteProps {
    modalProps: (typeof useDisclosure)['arguments'];
}

export const CommandPalette = ({ modalProps }: CommandPaletteProps) => {
    const navigate = useNavigate();
    const server = useCurrentServer();
    const [value, setValue] = useState('');
    const [query, setQuery] = useState('');
    const [debouncedQuery] = useDebouncedValue(query, 400);
    const [pages, setPages] = useState<CommandPalettePages[]>([CommandPalettePages.HOME]);
    const activePage = pages[pages.length - 1];
    const isHome = activePage === CommandPalettePages.HOME;
    const searchInputRef = useRef<HTMLInputElement>(null);
    const { t } = useTranslation();

    const popPage = useCallback(() => {
        setPages((pages) => {
            const x = [...pages];
            x.splice(-1, 1);
            return x;
        });
    }, []);

    const { data, isLoading } = useSearch({
        options: { enabled: isHome && debouncedQuery !== '' && query !== '' },
        query: {
            albumArtistLimit: 4,
            albumArtistStartIndex: 0,
            albumLimit: 4,
            albumStartIndex: 0,
            query: debouncedQuery,
            songLimit: 4,
            songStartIndex: 0,
        },
        serverId: server?.id,
    });

    const showAlbumGroup = isHome && Boolean(query && data && data?.albums?.length > 0);
    const showArtistGroup = isHome && Boolean(query && data && data?.albumArtists?.length > 0);
    const showTrackGroup = isHome && Boolean(query && data && data?.songs?.length > 0);

    const handlePlayQueueAdd = usePlayQueueAdd();

    return (
        <Modal
            {...modalProps}
            centered
            handlers={{
                ...modalProps.handlers,
                close: () => {
                    if (isHome) {
                        modalProps.handlers.close();
                        setQuery('');
                    } else {
                        popPage();
                    }
                },
                toggle: () => {
                    if (isHome) {
                        modalProps.handlers.toggle();
                        setQuery('');
                    } else {
                        popPage();
                    }
                },
            }}
            size="lg"
            styles={{
                header: { display: 'none' },
            }}
        >
            <Group
                gap="sm"
                mb="1rem"
            >
                {pages.map((page, index) => (
                    <Fragment key={page}>
                        {index > 0 && ' > '}
                        <Button
                            disabled
                            size="compact-md"
                            variant="default"
                        >
                            {page?.toLocaleUpperCase()}
                        </Button>
                    </Fragment>
                ))}
            </Group>
            <Command
                filter={(value, search) => {
                    if (value.includes(search)) return 1;
                    if (value.includes('search')) return 1;
                    return 0;
                }}
                label="Global Command Menu"
                onValueChange={setValue}
                value={value}
            >
                <TextInput
                    data-autofocus
                    leftSection={<Icon icon="search" />}
                    onChange={(e) => setQuery(e.currentTarget.value)}
                    ref={searchInputRef}
                    rightSection={
                        query && (
                            <ActionIcon
                                onClick={() => {
                                    setQuery('');
                                    searchInputRef.current?.focus();
                                }}
                                variant="transparent"
                            >
                                <Icon icon="x" />
                            </ActionIcon>
                        )
                    }
                    size="sm"
                    value={query}
                />
                <Command.Separator />
                <Command.List>
                    <Command.Empty>No results found.</Command.Empty>
                    {showAlbumGroup && (
                        <Command.Group heading="Albums">
                            {data?.albums?.map((album) => (
                                <Command.Item
                                    key={`search-album-${album.id}`}
                                    onSelect={() => {
                                        navigate(
                                            generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, {
                                                albumId: album.id,
                                            }),
                                        );
                                        modalProps.handlers.close();
                                        setQuery('');
                                    }}
                                    value={`search-${album.id}`}
                                >
                                    <LibraryCommandItem
                                        handlePlayQueueAdd={handlePlayQueueAdd}
                                        id={album.id}
                                        imageUrl={album.imageUrl}
                                        itemType={LibraryItem.ALBUM}
                                        subtitle={album.albumArtists
                                            .map((artist) => artist.name)
                                            .join(', ')}
                                        title={album.name}
                                    />
                                </Command.Item>
                            ))}
                        </Command.Group>
                    )}
                    {showArtistGroup && (
                        <Command.Group heading="Artists">
                            {data?.albumArtists.map((artist) => (
                                <Command.Item
                                    key={`artist-${artist.id}`}
                                    onSelect={() => {
                                        navigate(
                                            generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL, {
                                                albumArtistId: artist.id,
                                            }),
                                        );
                                        modalProps.handlers.close();
                                        setQuery('');
                                    }}
                                    value={`search-${artist.id}`}
                                >
                                    <LibraryCommandItem
                                        disabled={artist?.albumCount === 0}
                                        handlePlayQueueAdd={handlePlayQueueAdd}
                                        id={artist.id}
                                        imageUrl={artist.imageUrl}
                                        itemType={LibraryItem.ALBUM_ARTIST}
                                        subtitle={
                                            artist?.albumCount !== undefined &&
                                            artist?.albumCount !== null
                                                ? t('entity.albumWithCount', {
                                                      count: artist.albumCount,
                                                  })
                                                : undefined
                                        }
                                        title={artist.name}
                                    />
                                </Command.Item>
                            ))}
                        </Command.Group>
                    )}
                    {showTrackGroup && (
                        <Command.Group heading="Tracks">
                            {data?.songs.map((song) => (
                                <Command.Item
                                    key={`artist-${song.id}`}
                                    onSelect={() => {
                                        navigate(
                                            generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, {
                                                albumId: song.albumId,
                                            }),
                                        );
                                        modalProps.handlers.close();
                                        setQuery('');
                                    }}
                                    value={`search-${song.id}`}
                                >
                                    <LibraryCommandItem
                                        handlePlayQueueAdd={handlePlayQueueAdd}
                                        id={song.id}
                                        imageUrl={song.imageUrl}
                                        itemType={LibraryItem.SONG}
                                        subtitle={song.artists
                                            .map((artist) => artist.name)
                                            .join(', ')}
                                        title={song.name}
                                    />
                                </Command.Item>
                            ))}
                        </Command.Group>
                    )}
                    {activePage === CommandPalettePages.HOME && (
                        <HomeCommands
                            handleClose={modalProps.handlers.close}
                            pages={pages}
                            query={query}
                            setPages={setPages}
                            setQuery={setQuery}
                        />
                    )}
                    {activePage === CommandPalettePages.GO_TO && (
                        <GoToCommands
                            handleClose={modalProps.handlers.close}
                            setPages={setPages}
                            setQuery={setQuery}
                        />
                    )}
                    {activePage === CommandPalettePages.MANAGE_SERVERS && (
                        <ServerCommands
                            handleClose={modalProps.handlers.close}
                            setPages={setPages}
                            setQuery={setQuery}
                        />
                    )}
                </Command.List>
            </Command>
            <Box
                mt="0.5rem"
                p="0.5rem"
            >
                <Group justify="space-between">
                    <Command.Loading>
                        {isHome && isLoading && query !== '' && <Spinner />}
                    </Command.Loading>
                    <Group gap="sm">
                        <Kbd size="md">ESC</Kbd>
                        <Kbd size="md">↑</Kbd>
                        <Kbd size="md">↓</Kbd>
                        <Kbd size="md">⏎</Kbd>
                    </Group>
                </Group>
            </Box>
        </Modal>
    );
};
