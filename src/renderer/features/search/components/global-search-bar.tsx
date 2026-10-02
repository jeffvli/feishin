import { useClickOutside, useDebouncedValue } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { ChangeEvent, KeyboardEvent, MouseEvent, useEffect, useRef, useState } from 'react';
import { createSearchParams, generatePath, useLocation, useNavigate } from 'react-router';

import styles from './global-search-bar.module.css';

import { ItemImage } from '/@/renderer/components/item-image/item-image';
import { ContextMenuController } from '/@/renderer/features/context-menu/context-menu-controller';
import { searchQueries } from '/@/renderer/features/search/api/search-api';
import { LibraryCommandItem } from '/@/renderer/features/search/components/library-command-item';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer } from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { Icon } from '/@/shared/components/icon/icon';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { LibraryItem } from '/@/shared/types/domain-types';

export const GLOBAL_SEARCH_FOCUS_EVENT = 'katiesamp:focus-global-search';
const SEARCH_PLACEHOLDER = 'Search tracks or artists';

export const focusGlobalSearch = () => {
    window.dispatchEvent(new Event(GLOBAL_SEARCH_FOCUS_EVENT));
};

export const GlobalSearchBar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const server = useCurrentServer();
    const inputRef = useRef<HTMLInputElement>(null);
    const isSearchRoute = location.pathname.startsWith('/search/');
    const routeQuery = isSearchRoute ? new URLSearchParams(location.search).get('query') || '' : '';
    const [query, setQuery] = useState(routeQuery);
    const [opened, setOpened] = useState(false);
    const containerRef = useClickOutside<HTMLDivElement>(() => setOpened(false));
    const [debouncedQuery] = useDebouncedValue(query.trim(), 250);

    useEffect(() => {
        setQuery(routeQuery);
    }, [routeQuery]);

    useEffect(() => {
        const focus = () => {
            inputRef.current?.focus();
            inputRef.current?.select();
            setOpened(true);
        };

        window.addEventListener(GLOBAL_SEARCH_FOCUS_EVENT, focus);
        return () => window.removeEventListener(GLOBAL_SEARCH_FOCUS_EVENT, focus);
    }, []);

    const { data, isFetching } = useQuery(
        searchQueries.search({
            options: {
                enabled: Boolean(server?.id && debouncedQuery),
            },
            query: {
                albumArtistLimit: 4,
                albumArtistStartIndex: 0,
                albumLimit: 0,
                albumStartIndex: 0,
                query: debouncedQuery,
                songLimit: 4,
                songStartIndex: 0,
            },
            serverId: server?.id,
        }),
    );

    const artists = data?.albumArtists ?? [];
    const songs = data?.songs ?? [];
    const hasResults = artists.length > 0 || songs.length > 0;
    const showResults = opened && query.trim().length > 0;

    const openResultsPage = (searchQuery = query) => {
        const trimmedQuery = searchQuery.trim();
        if (!trimmedQuery) return;

        navigate({
            pathname: generatePath(AppRoute.SEARCH, { itemType: LibraryItem.SONG }),
            search: createSearchParams({ query: trimmedQuery }).toString(),
        });
        setOpened(false);
    };

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        setQuery(event.target.value);
        setOpened(true);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            openResultsPage();
        } else if (event.key === 'Escape') {
            setOpened(false);
            inputRef.current?.blur();
        }
    };

    const keepFocus = (event: MouseEvent) => event.preventDefault();

    return (
        <div className={styles.container}>
            <div className={styles.searchWrapper} ref={containerRef}>
                <TextInput
                    aria-label={SEARCH_PLACEHOLDER}
                    className={styles.input}
                    leftSection={<Icon icon="search" />}
                    onChange={handleChange}
                    onFocus={() => setOpened(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={SEARCH_PLACEHOLDER}
                    ref={inputRef}
                    rightSection={
                        query ? (
                            <ActionIcon
                                aria-label="Clear search"
                                icon="x"
                                onClick={() => {
                                    setQuery('');
                                    inputRef.current?.focus();
                                }}
                                onMouseDown={keepFocus}
                                variant="transparent"
                            />
                        ) : null
                    }
                    size="md"
                    value={query}
                />
                {showResults && (
                    <div aria-label="Search suggestions" className={styles.results} role="dialog">
                        {isFetching && !data ? (
                            <div className={styles.status}>
                                <Spinner />
                            </div>
                        ) : !hasResults ? (
                            <div className={styles.status}>No matching tracks or artists</div>
                        ) : (
                            <>
                                {artists.length > 0 && (
                                    <section aria-label="Artists">
                                        <div className={styles.sectionHeading}>Artists</div>
                                        {artists.map((artist) => (
                                            <button
                                                className={styles.artistResult}
                                                key={artist.id}
                                                onClick={() => openResultsPage(artist.name)}
                                                onMouseDown={keepFocus}
                                                type="button"
                                            >
                                                <ItemImage
                                                    alt=""
                                                    className={styles.artistImage}
                                                    containerClassName={styles.artistImageContainer}
                                                    height={40}
                                                    id={artist.imageId}
                                                    itemType={LibraryItem.ALBUM_ARTIST}
                                                    src={artist.imageUrl}
                                                    type="table"
                                                    width={40}
                                                />
                                                <span className={styles.artistName}>
                                                    {artist.name}
                                                </span>
                                            </button>
                                        ))}
                                    </section>
                                )}
                                {songs.length > 0 && (
                                    <section aria-label="Tracks">
                                        <div className={styles.sectionHeading}>Tracks</div>
                                        {songs.map((song) => (
                                            <div
                                                className={styles.songResult}
                                                data-testid={`search-suggestion-song-${song.id}`}
                                                key={song.id}
                                                onContextMenu={(event) => {
                                                    event.preventDefault();
                                                    event.stopPropagation();
                                                    ContextMenuController.call({
                                                        cmd: {
                                                            items: [song],
                                                            type: LibraryItem.SONG,
                                                        },
                                                        event,
                                                    });
                                                }}
                                            >
                                                <LibraryCommandItem
                                                    explicitStatus={song.explicitStatus}
                                                    id={song.id}
                                                    imageId={song.imageId}
                                                    imageUrl={song.imageUrl}
                                                    itemType={LibraryItem.SONG}
                                                    showPlaybackControls={false}
                                                    song={song}
                                                    subtitle={song.artists
                                                        .map((artist) => artist.name)
                                                        .join(', ')}
                                                    title={song.name}
                                                />
                                            </div>
                                        ))}
                                    </section>
                                )}
                                <Button
                                    className={styles.viewAll}
                                    onClick={() => openResultsPage()}
                                    onMouseDown={keepFocus}
                                    variant="subtle"
                                >
                                    Show all results
                                </Button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
