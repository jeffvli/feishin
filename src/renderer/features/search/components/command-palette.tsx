import { useCallback, useDeferredValue, useRef, useState } from 'react';

import { Command, CommandPalettePages } from '/@/renderer/features/search/components/command';
import { GoToCommands } from '/@/renderer/features/search/components/go-to-commands';
import { HomeCommands } from '/@/renderer/features/search/components/home-commands';
import { SearchAlbumArtistsSection } from '/@/renderer/features/search/components/search-album-artists-section';
import { SearchAlbumsSection } from '/@/renderer/features/search/components/search-albums-section';
import { SearchSongsSection } from '/@/renderer/features/search/components/search-songs-section';
import { ServerCommands } from '/@/renderer/features/search/components/server-commands';
import { useAppStore } from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Breadcrumb } from '/@/shared/components/breadcrumb/breadcrumb';
import { Button } from '/@/shared/components/button/button';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Kbd } from '/@/shared/components/kbd/kbd';
import { Modal } from '/@/shared/components/modal/modal';
import { Stack } from '/@/shared/components/stack/stack';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { useDebouncedValue } from '/@/shared/hooks/use-debounced-value';
import { useDisclosure } from '/@/shared/hooks/use-disclosure';

interface CommandPaletteProps {
    modalProps: (typeof useDisclosure)['arguments'];
}

const SEARCH_SECTION_IDS = {
    albums: 'albums',
    artists: 'artists',
    tracks: 'tracks',
} as const;

interface CommandPaletteSearchProps {
    children?: React.ReactNode;
    isHome: boolean;
    onSelectResult: () => void;
    query: string;
    searchInputRef: React.RefObject<HTMLInputElement | null>;
    setQuery: (query: string) => void;
}

function CommandPaletteSearch({
    children,
    isHome,
    onSelectResult,
    query,
    searchInputRef,
    setQuery,
}: CommandPaletteSearchProps) {
    const [debouncedQuery] = useDebouncedValue(query, 400);
    const deferredSearchQuery = useDeferredValue(debouncedQuery ?? '');
    const searchSectionsExpanded = useAppStore(
        (state) => state.commandPaletteSearchSectionsExpanded,
    );
    const setSearchSectionExpanded = useAppStore(
        (state) => state.actions.setCommandPaletteSearchSectionExpanded,
    );

    return (
        <>
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
            <Divider my="sm" />
            <Command.List>
                <Stack gap="xs">
                    <SearchAlbumsSection
                        debouncedQuery={deferredSearchQuery}
                        expanded={searchSectionsExpanded[SEARCH_SECTION_IDS.albums] ?? true}
                        isHome={isHome}
                        onSelectResult={onSelectResult}
                        onToggle={() =>
                            setSearchSectionExpanded(
                                SEARCH_SECTION_IDS.albums,
                                !(searchSectionsExpanded[SEARCH_SECTION_IDS.albums] ?? true),
                            )
                        }
                        query={query}
                    />
                    <SearchAlbumArtistsSection
                        debouncedQuery={deferredSearchQuery}
                        expanded={searchSectionsExpanded[SEARCH_SECTION_IDS.artists] ?? true}
                        isHome={isHome}
                        onSelectResult={onSelectResult}
                        onToggle={() =>
                            setSearchSectionExpanded(
                                SEARCH_SECTION_IDS.artists,
                                !(searchSectionsExpanded[SEARCH_SECTION_IDS.artists] ?? true),
                            )
                        }
                        query={query}
                    />
                    <SearchSongsSection
                        debouncedQuery={deferredSearchQuery}
                        expanded={searchSectionsExpanded[SEARCH_SECTION_IDS.tracks] ?? true}
                        isHome={isHome}
                        onSelectResult={onSelectResult}
                        onToggle={() =>
                            setSearchSectionExpanded(
                                SEARCH_SECTION_IDS.tracks,
                                !(searchSectionsExpanded[SEARCH_SECTION_IDS.tracks] ?? true),
                            )
                        }
                        query={query}
                    />
                </Stack>
                {children}
            </Command.List>
        </>
    );
}

export const CommandPalette = ({ modalProps }: CommandPaletteProps) => {
    const [value, setValue] = useState('');
    const [query, setQuery] = useState('');
    const [pages, setPages] = useState<CommandPalettePages[]>([CommandPalettePages.HOME]);
    const activePage = pages[pages.length - 1];
    const isHome = activePage === CommandPalettePages.HOME;
    const commandRootRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const popPage = useCallback(() => {
        setPages((pages) => {
            const x = [...pages];
            x.splice(-1, 1);
            return x;
        });
    }, []);

    const handleSelectResult = useCallback(() => {
        modalProps.handlers.close();
        setQuery('');
    }, [modalProps.handlers]);

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
                body: { padding: '0' },
                header: { display: 'none' },
            }}
        >
            <Command
                filter={(value, search) => {
                    if (value.includes(search)) return 1;
                    if (value.includes('search')) return 1;
                    return 0;
                }}
                label="Global Command Menu"
                onKeyDown={(e) => {
                    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                        searchInputRef.current?.focus();
                    }

                    if (e.key === 'Tab' && !e.shiftKey) {
                        const root = commandRootRef.current;
                        if (!root) return;

                        const selectedItem = root.querySelector(
                            '[cmdk-item][aria-selected="true"]',
                        ) as HTMLElement | null;

                        if (!selectedItem) return;

                        const focusTarget = selectedItem.querySelector(
                            'button:not([disabled]), [tabindex]:not([tabindex="-1"])',
                        ) as HTMLElement | null;

                        if (!focusTarget) return;

                        e.preventDefault();
                        e.stopPropagation();

                        requestAnimationFrame(() => {
                            focusTarget.focus();
                        });
                    }
                }}
                onValueChange={setValue}
                ref={commandRootRef}
                value={value}
            >
                <CommandPaletteSearch
                    isHome={isHome}
                    onSelectResult={handleSelectResult}
                    query={query}
                    searchInputRef={searchInputRef}
                    setQuery={setQuery}
                >
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
                </CommandPaletteSearch>
            </Command>
            <Divider my="sm" />
            <Group justify="space-between">
                <Breadcrumb separator={<Icon icon="arrowRight" />}>
                    {pages.map((page, index) => (
                        <Button
                            key={page}
                            onClick={() => setPages((prev) => prev.slice(0, index + 1))}
                            size="compact-xs"
                            variant="subtle"
                        >
                            {page?.toLocaleUpperCase()}
                        </Button>
                    ))}
                </Breadcrumb>

                <Group gap="sm">
                    <Kbd size="md">ESC</Kbd>
                    <Kbd size="md">↑</Kbd>
                    <Kbd size="md">↓</Kbd>
                    <Kbd size="md">⏎</Kbd>
                </Group>
            </Group>
        </Modal>
    );
};
