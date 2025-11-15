import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { ActionIcon, Box, Breadcrumbs, Group, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RiArrowLeftLine, RiFolderLine, RiMusicLine, RiPlayFill } from 'react-icons/ri';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import styles from '../routes/folder-list-route.module.css';

import { api } from '/@/renderer/api';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid/virtual-infinite-grid';
import { FOLDER_CONTEXT_MENU_ITEMS } from '/@/renderer/features/context-menu/context-menu-items';
import { useHandleGeneralContextMenu } from '/@/renderer/features/context-menu/hooks/use-handle-context-menu';
import { usePlayQueueAdd } from '/@/renderer/features/player/hooks/use-playqueue-add';
import { useCurrentServer } from '/@/renderer/store';
import { useFolderPath, useFolderStoreActions } from '/@/renderer/store/folder.store';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Tooltip } from '/@/shared/components/tooltip/tooltip';
import {
    FolderItem,
    FolderListResponse,
    LibraryItem,
    MusicFolderListResponse,
    ServerListItemWithCredential,
    Song,
} from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

interface FolderListContentProps {
    gridRef: MutableRefObject<null | VirtualInfiniteGridRef>;
    itemCount?: number;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const FolderListContent = ({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    gridRef: _gridRef,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    itemCount: _itemCount,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    tableRef: _tableRef,
}: FolderListContentProps) => {
    const server = useCurrentServer();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const folderId = searchParams.get('folderId');
    const folderActions = useFolderStoreActions();
    const { path } = useFolderPath();
    const handlePlayQueueAdd = usePlayQueueAdd();
    const queryClient = useQueryClient();
    const [loadingFolderId, setLoadingFolderId] = useState<null | string>(null);
    const [emptyFolders, setEmptyFolders] = useState<Set<string>>(new Set());
    const [checkingEmptyFolders, setCheckingEmptyFolders] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Sync breadcrumb path with browser history state
    useEffect(() => {
        if (!folderId) {
            // At root level, reset path
            folderActions.resetPath();
        } else {
            // Try to restore path from history state
            const historyState = location.state as any;
            if (historyState?.breadcrumbPath) {
                folderActions.setPath(historyState.breadcrumbPath);
            } else {
                // No history state, reset path to avoid incorrect breadcrumbs
                folderActions.resetPath();
            }
        }
    }, [folderId, folderActions, location.state]);

    const handleFolderContextMenu = useHandleGeneralContextMenu(
        LibraryItem.FOLDER,
        FOLDER_CONTEXT_MENU_ITEMS,
    );

    const folderQuery = useQuery({
        enabled: !!folderId,
        queryFn: ({ signal }) =>
            api.controller.getFolderList({
                apiClientProps: {
                    server: server as ServerListItemWithCredential,
                    serverId: server?.id || '',
                    signal,
                },
                query: {
                    id: folderId || '',
                },
            }),
        queryKey: ['folder', server?.id, folderId],
    });

    const musicFoldersQuery = useQuery({
        enabled: !folderId,
        queryFn: ({ signal }) =>
            api.controller.getMusicFolderList({
                apiClientProps: {
                    server: server as ServerListItemWithCredential,
                    serverId: server?.id || '',
                    signal,
                },
            }),
        queryKey: ['music-folders', server?.id],
    });

    const items = useMemo(() => {
        if (folderId && folderQuery.data) {
            const data = folderQuery.data as FolderListResponse;
            return data.items || [];
        }
        if (!folderId && musicFoldersQuery.data) {
            const data = musicFoldersQuery.data as MusicFolderListResponse;
            return (data.items || []).map((folder) => ({
                id: folder.id,
                imageUrl: null,
                isDir: true,
                itemType: 'folder' as const,
                name: folder.name,
                serverId: server?.id || '',
                serverType: server?.type || 'subsonic',
                title: folder.name,
            }));
        }
        return [];
    }, [folderId, folderQuery.data, musicFoldersQuery.data, server]);

    // Proactively check which folders are empty
    useEffect(() => {
        const checkEmptyFolders = async () => {
            if (!items || items.length === 0 || !folderId) return;

            setCheckingEmptyFolders(true);
            const emptyFolderIds: string[] = [];

            for (const item of items) {
                if (item.isDir && !emptyFolders.has(item.id)) {
                    try {
                        // Fetch folder contents to check if it has any items
                        const folderData = await queryClient.fetchQuery({
                            queryFn: ({ signal }) =>
                                api.controller.getFolderList({
                                    apiClientProps: {
                                        server: server as ServerListItemWithCredential,
                                        serverId: server?.id || '',
                                        signal,
                                    },
                                    query: { id: item.id },
                                }),
                            queryKey: ['folder', server?.id, item.id],
                            staleTime: 1000 * 60 * 5, // 5 minutes
                        });

                        // If folder has no items, mark it as empty
                        if (!folderData.items || folderData.items.length === 0) {
                            emptyFolderIds.push(item.id);
                        }
                    } catch (error) {
                        // On error, don't mark as empty (assume it might have content)
                        console.warn(`Failed to check folder ${item.id}:`, error);
                    }
                }
            }

            if (emptyFolderIds.length > 0) {
                setEmptyFolders((prev) => {
                    const newSet = new Set(prev);
                    emptyFolderIds.forEach((id) => newSet.add(id));
                    return newSet;
                });
            }
            setCheckingEmptyFolders(false);
        };

        checkEmptyFolders();
    }, [items, folderId, server, queryClient, emptyFolders]);

    const handleFolderClick = useCallback(
        (item: FolderItem) => {
            const newFolderId = item.id;
            const folderName = item.name || item.title || 'Unknown Folder';

            // Update the path in the store
            folderActions.pushPath({ id: newFolderId, name: folderName });

            // Navigate to the new folder with breadcrumb path in state
            const currentPath = path || [];
            navigate(`/library/folders?folderId=${newFolderId}`, {
                state: { breadcrumbPath: [...currentPath, { id: newFolderId, name: folderName }] },
            });
        },
        [navigate, folderActions, path],
    );

    const handleBack = useCallback(() => {
        if (path && path.length > 0) {
            // Navigate to the previous folder in the path
            const previousFolder = path[path.length - 2]; // Second to last item
            if (previousFolder) {
                const newPath = path.slice(0, -1); // Remove last item
                navigate(`/library/folders?folderId=${previousFolder.id}`, {
                    state: { breadcrumbPath: newPath },
                });
                folderActions.setPath(newPath);
            } else {
                // Go to root if no previous folder
                navigate('/library/folders');
                folderActions.resetPath();
            }
        } else {
            // If no path, go to root
            navigate('/library/folders');
            folderActions.resetPath();
        }
    }, [navigate, folderActions, path]);

    const handleBreadcrumbClick = useCallback(
        (index: number) => {
            const currentPath = path || [];
            const targetPath = currentPath.slice(0, index + 1);

            // Navigate to the selected folder
            if (index === -1) {
                // Root level
                navigate('/library/folders');
                folderActions.resetPath();
            } else {
                const targetFolder = targetPath[index];
                navigate(`/library/folders?folderId=${targetFolder.id}`, {
                    state: { breadcrumbPath: targetPath },
                });
                folderActions.setPath(targetPath);
            }
        },
        [navigate, folderActions, path],
    );

    const handlePlaySong = useCallback(
        (item: FolderItem) => {
            if (!item.isDir && item.id) {
                // Play the song
                handlePlayQueueAdd?.({
                    byItemType: {
                        id: [item.id],
                        type: LibraryItem.SONG,
                    },
                    playType: Play.NOW,
                });
            }
        },
        [handlePlayQueueAdd],
    );

    // Enhanced recursive function with caching, progress tracking, and cancellation
    const collectAllSongIds = useCallback(
        async (
            folderId: string,
            signal?: AbortSignal,
            onProgress?: (current: number, total: number) => void,
        ): Promise<string[]> => {
            // Check for cancellation
            if (signal?.aborted) {
                throw new Error('Operation cancelled');
            }

            // Try to get from cache first
            const cacheKey = ['folder-songs', server?.id, folderId];
            const cached = queryClient.getQueryData<string[]>(cacheKey);
            if (cached) {
                return cached;
            }

            // Use React Query's fetchQuery for better caching
            const folderData = await queryClient.fetchQuery({
                queryFn: ({ signal }) =>
                    api.controller.getFolderList({
                        apiClientProps: {
                            server: server as ServerListItemWithCredential,
                            serverId: server?.id || '',
                            signal,
                        },
                        query: { id: folderId },
                    }),
                queryKey: ['folder', server?.id, folderId],
                staleTime: 1000 * 60 * 5, // 5 minutes
            });

            if (signal?.aborted) {
                throw new Error('Operation cancelled');
            }

            const songIds: string[] = [];
            const subfolders = folderData.items.filter((item) => item.isDir);
            const songs = folderData.items.filter((item) => !item.isDir);

            // Add immediate song IDs
            songIds.push(...songs.map((song) => song.id));

            // Process subfolders with controlled concurrency
            const BATCH_SIZE = 5; // Process 5 folders at a time
            let processedFolders = 0;

            for (let i = 0; i < subfolders.length; i += BATCH_SIZE) {
                if (signal?.aborted) {
                    throw new Error('Operation cancelled');
                }

                const batch = subfolders.slice(i, i + BATCH_SIZE);

                const batchPromises = batch.map(async (subfolder) => {
                    try {
                        return await collectAllSongIds(subfolder.id, signal, onProgress);
                    } catch (error) {
                        // Log error but continue with other folders
                        console.warn(`Failed to collect songs from folder ${subfolder.id}:`, error);
                        return [];
                    }
                });

                const batchResults = await Promise.all(batchPromises);
                songIds.push(...batchResults.flat());

                processedFolders += batch.length;
                onProgress?.(processedFolders, subfolders.length);
            }

            // Cache the result
            queryClient.setQueryData(cacheKey, songIds, {
                updatedAt: Date.now(),
            });

            return songIds;
        },
        [server, queryClient],
    );

    const handlePlayFolder = useCallback(
        async (e: React.MouseEvent, item: FolderItem | { id: string }) => {
            e.stopPropagation();

            // Cancel any existing operation
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            const abortController = new AbortController();
            abortControllerRef.current = abortController;
            setLoadingFolderId(item.id);

            const notificationId = notifications.show({
                autoClose: false,
                id: 'folder-play-progress',
                loading: true,
                message: 'Preparing to play all songs',
                title: 'Scanning folder...',
                withCloseButton: true,
            });

            try {
                // Collect song IDs with progress tracking
                const songIds = await collectAllSongIds(
                    item.id,
                    abortController.signal,
                    (current, total) => {
                        notifications.update({
                            id: notificationId,
                            loading: true,
                            message: `Processed ${current}/${total} folders`,
                            title: 'Scanning folders...',
                        });
                    },
                );

                if (abortController.signal.aborted) {
                    return;
                }

                if (songIds.length > 0) {
                    // Remove from empty folders set if it has songs
                    setEmptyFolders((prev) => {
                        const newSet = new Set(prev);
                        newSet.delete(item.id);
                        return newSet;
                    });

                    // Update notification for song fetching
                    notifications.update({
                        id: notificationId,
                        loading: true,
                        message: `Loading ${songIds.length} songs`,
                        title: 'Fetching song details...',
                    });

                    // Fetch song details in batches to avoid overwhelming the server
                    const BATCH_SIZE = 20;
                    const allSongs: Song[] = [];

                    for (let i = 0; i < songIds.length; i += BATCH_SIZE) {
                        if (abortController.signal.aborted) {
                            return;
                        }

                        const batch = songIds.slice(i, i + BATCH_SIZE);
                        const songPromises = batch.map((songId) =>
                            api.controller.getSongDetail({
                                apiClientProps: {
                                    server: server as ServerListItemWithCredential,
                                    serverId: server?.id || '',
                                    signal: abortController.signal,
                                },
                                query: { id: songId },
                            }),
                        );

                        const batchSongs = await Promise.all(songPromises);
                        allSongs.push(...batchSongs);

                        // Update progress
                        const loadedSongs = Math.min(i + BATCH_SIZE, songIds.length);
                        notifications.update({
                            id: notificationId,
                            loading: true,
                            message: `Loaded ${loadedSongs}/${songIds.length} songs`,
                            title: 'Fetching song details...',
                        });
                    }

                    if (abortController.signal.aborted) {
                        return;
                    }

                    // Play the songs
                    handlePlayQueueAdd?.({
                        byData: allSongs,
                        playType: Play.NOW,
                    });

                    // Show success notification
                    notifications.update({
                        autoClose: 3000,
                        color: 'green',
                        id: notificationId,
                        loading: false,
                        message: `Started playing ${allSongs.length} songs`,
                        title: 'Playing folder',
                    });
                } else {
                    // Mark folder as empty
                    setEmptyFolders((prev) => new Set(prev).add(item.id));

                    notifications.update({
                        autoClose: 3000,
                        color: 'yellow',
                        id: notificationId,
                        loading: false,
                        message: 'This folder contains no playable songs',
                        title: 'No songs found',
                    });
                }
            } catch (error) {
                if (abortController.signal.aborted) {
                    notifications.update({
                        autoClose: 2000,
                        color: 'orange',
                        id: notificationId,
                        loading: false,
                        message: 'Folder playback was cancelled',
                        title: 'Operation cancelled',
                    });
                } else {
                    notifications.update({
                        autoClose: 5000,
                        color: 'red',
                        id: notificationId,
                        loading: false,
                        message: error instanceof Error ? error.message : 'Unknown error occurred',
                        title: 'Failed to play folder',
                    });
                }
            } finally {
                setLoadingFolderId(null);
                abortControllerRef.current = null;
            }
        },
        [collectAllSongIds, handlePlayQueueAdd, server],
    );

    const handleCancelPlayFolder = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setLoadingFolderId(null);
        }
    }, []);

    return (
        <Stack className={styles.container} gap="md">
            {folderId && (
                <Group p="md">
                    <Box
                        aria-label="Go back to previous folder"
                        className={styles['back-button']}
                        component="button"
                        onClick={handleBack}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleBack();
                            }
                        }}
                        role="button"
                        tabIndex={0}
                    >
                        <RiArrowLeftLine size={24} />
                    </Box>
                    <Breadcrumbs
                        className={styles.breadcrumbs}
                        separator={
                            <Text c="dimmed" size="sm">
                                /
                            </Text>
                        }
                    >
                        <Box
                            className={styles['breadcrumb-item']}
                            onClick={() => handleBreadcrumbClick(-1)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleBreadcrumbClick(-1);
                                }
                            }}
                            role="button"
                            tabIndex={0}
                        >
                            <Text
                                aria-label="Go to folders list"
                                c="blue"
                                className={styles['breadcrumb-text']}
                                size="sm"
                            >
                                Folders
                            </Text>
                        </Box>
                        {path?.map((pathItem, index) =>
                            index < path.length - 1 ? (
                                <Box
                                    className={styles['breadcrumb-item']}
                                    key={pathItem.id}
                                    onClick={() => handleBreadcrumbClick(index)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            handleBreadcrumbClick(index);
                                        }
                                    }}
                                    role="button"
                                    tabIndex={0}
                                >
                                    <Text
                                        aria-label={`Navigate to: ${pathItem.name}`}
                                        c="blue"
                                        className={styles['breadcrumb-text']}
                                        size="sm"
                                    >
                                        {pathItem.name}
                                    </Text>
                                </Box>
                            ) : (
                                <Text
                                    aria-label={`Current folder: ${pathItem.name}`}
                                    c="white"
                                    className={styles['current-breadcrumb-text']}
                                    key={pathItem.id}
                                    role="text"
                                    size="sm"
                                >
                                    {pathItem.name}
                                </Text>
                            ),
                        )}
                    </Breadcrumbs>
                </Group>
            )}
            {!folderId && (
                <Text fw={700} p="md" size="xl">
                    Folders
                </Text>
            )}
            {folderQuery.isLoading && folderId && <Text p="md">Loading...</Text>}
            {musicFoldersQuery.isLoading && !folderId && <Text p="md">Loading...</Text>}
            {folderQuery.error && folderId && (
                <Stack gap="xs" p="md">
                    <Text c="red">Error: {(folderQuery.error as Error)?.message}</Text>
                    <Text c="dimmed" size="sm">
                        Note: Browsing root folders requires using artist indexes. Try browsing from
                        Albums or Artists views instead, or navigate directly to a subfolder if you
                        know its ID.
                    </Text>
                </Stack>
            )}
            {musicFoldersQuery.error && !folderId && (
                <Text c="red" p="md">
                    Error: {(musicFoldersQuery.error as Error)?.message}
                </Text>
            )}
            <Box aria-label="Folder contents" className={styles['folder-content']} role="main">
                <Stack
                    aria-label={`${folderId ? 'Folder contents' : 'Folders'} list`}
                    gap="xs"
                    role="list"
                >
                    {checkingEmptyFolders ? (
                        <Group justify="center" p="md">
                            <Spinner container />
                            <Text c="dimmed" size="sm">
                                Checking folder contents...
                            </Text>
                        </Group>
                    ) : items.length === 0 &&
                      !folderQuery.isLoading &&
                      !musicFoldersQuery.isLoading ? (
                        <Text c="dimmed" p="md">
                            No items found
                        </Text>
                    ) : null}
                    {!checkingEmptyFolders &&
                        items.map((item) => (
                            <Group
                                aria-label={`${item.isDir ? 'Folder' : 'Song'}: ${item.title || item.name}`}
                                className={styles['folder-item']}
                                key={item.id}
                                onClick={() =>
                                    item.isDir ? handleFolderClick(item) : handlePlaySong(item)
                                }
                                onContextMenu={(e) => {
                                    if (item.isDir) {
                                        handleFolderContextMenu(e, [item]);
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        if (item.isDir) {
                                            handleFolderClick(item);
                                        } else {
                                            handlePlaySong(item);
                                        }
                                    }
                                }}
                                p="sm"
                                role="listitem"
                                tabIndex={0}
                            >
                                {item.isDir ? (
                                    <RiFolderLine size={24} />
                                ) : (
                                    <RiMusicLine size={24} />
                                )}
                                {item.isDir && !emptyFolders.has(item.id) && folderId && (
                                    <Tooltip
                                        label={loadingFolderId === item.id ? 'Stop' : 'Play all'}
                                    >
                                        <ActionIcon
                                            aria-label={
                                                loadingFolderId === item.id
                                                    ? 'Stop playing folder'
                                                    : `Play folder: ${item.title || item.name}`
                                            }
                                            color={loadingFolderId === item.id ? 'red' : 'blue'}
                                            onClick={(e) => {
                                                if (loadingFolderId === item.id) {
                                                    handleCancelPlayFolder();
                                                } else {
                                                    handlePlayFolder(e, item);
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    if (loadingFolderId === item.id) {
                                                        handleCancelPlayFolder();
                                                    } else {
                                                        handlePlayFolder(e as any, item);
                                                    }
                                                }
                                            }}
                                            role="button"
                                            size="lg"
                                            tabIndex={0}
                                            variant="subtle"
                                        >
                                            {loadingFolderId === item.id ? (
                                                <Spinner size={20} />
                                            ) : (
                                                <RiPlayFill size={20} />
                                            )}
                                        </ActionIcon>
                                    </Tooltip>
                                )}
                                <Text className={styles['song-title']}>
                                    {item.title || item.name}
                                </Text>
                            </Group>
                        ))}
                </Stack>
            </Box>
        </Stack>
    );
};
