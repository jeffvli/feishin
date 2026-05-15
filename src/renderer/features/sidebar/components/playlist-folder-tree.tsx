import clsx from 'clsx';
import {
    ComponentPropsWithoutRef,
    CSSProperties,
    MouseEvent,
    ReactElement,
    useCallback,
    useMemo,
    useState,
} from 'react';
import { useTranslation } from 'react-i18next';

import styles from './playlist-folder-tree.module.css';

import { useUpdatePlaylist } from '/@/renderer/features/playlists/mutations/update-playlist-mutation';
import { PlaylistRowButton } from '/@/renderer/features/sidebar/components/sidebar-playlist-list';
import { useDragDrop } from '/@/renderer/hooks/use-drag-drop';
import {
    useCurrentServerId,
    useSidebarPlaylistFolders,
    useSidebarPlaylistFolderSeparator,
    useSidebarPlaylistFolderTreeIndent,
    useSidebarPlaylistFolderTreeLineColor,
    useSidebarPlaylistFolderView,
} from '/@/renderer/store';
import { Accordion } from '/@/shared/components/accordion/accordion';
import { Icon } from '/@/shared/components/icon/icon';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';
import { useLocalStorage } from '/@/shared/hooks/use-local-storage';
import { LibraryItem, Playlist } from '/@/shared/types/domain-types';
import { DragData, DragOperation, DragTarget } from '/@/shared/types/drag-and-drop';

const STORAGE_KEY_PREFIX = 'feishin:playlist-folder-state';

export const getPlaylistLeafName = (name: string, separator: string): string => {
    if (!separator) return name;
    const segments = name.split(separator).filter((segment) => segment.length > 0);
    return segments[segments.length - 1] ?? name;
};

export const buildPlaylistNameInFolder = (
    folderPath: string,
    leafName: string,
    separator: string,
): string => {
    if (!folderPath) return leafName;
    return `${folderPath}${separator}${leafName}`;
};

export const getFolderName = (folderPath: string, separator: string): string => {
    const segments = folderPath.split(separator).filter((segment) => segment.length > 0);
    return segments[segments.length - 1] ?? folderPath;
};

export const isDirectChildFolder = (
    childFolderPath: string,
    parentFolderPath: string,
    separator: string,
): boolean => {
    // True when child is exactly one folder level below parent (Rock/Classic under Rock).
    if (!childFolderPath || !parentFolderPath) return false;
    if (childFolderPath === parentFolderPath) return false;

    const prefix = `${parentFolderPath}${separator}`;
    if (!childFolderPath.startsWith(prefix)) return false;

    const relativePath = childFolderPath.slice(prefix.length);
    return relativePath.length > 0 && !relativePath.includes(separator);
};

export const isValidFolderNest = (
    sourceFolderPath: string,
    targetFolderPath: string,
    separator: string,
): boolean => {
    // Folder-on-folder drops are allowed except onto self or onto a descendant folder.
    if (!sourceFolderPath || !targetFolderPath) return false;
    if (sourceFolderPath === targetFolderPath) return false;
    if (targetFolderPath.startsWith(`${sourceFolderPath}${separator}`)) return false;
    return true;
};

export const getPlaylistsInFolderTree = (
    playlists: Playlist[],
    folderPath: string,
    separator: string,
): Playlist[] => {
    // Every playlist whose name lives under this folder path (including nested subfolders).
    const prefix = `${folderPath}${separator}`;
    return playlists.filter((playlist) => playlist.name.startsWith(prefix));
};

export const remapPlaylistFolderPath = (
    playlistName: string,
    sourceFolderPath: string,
    targetFolderPath: string,
    separator: string,
): null | string => {
    // Rename one playlist when its containing folder is dropped onto another folder.
    const sourcePrefix = `${sourceFolderPath}${separator}`;
    if (!playlistName.startsWith(sourcePrefix)) return null;

    const remainder = playlistName.slice(sourcePrefix.length);
    if (!remainder) return null;

    if (isDirectChildFolder(sourceFolderPath, targetFolderPath, separator)) {
        // Direct parent: flatten playlists into the parent (Rock/Classic/x -> Rock/x).
        return `${targetFolderPath}${separator}${remainder}`;
    }

    if (sourceFolderPath.startsWith(`${targetFolderPath}${separator}`)) {
        // Higher ancestor: move the folder as a unit (Pop/Rock/Classic/x -> Pop/Classic/x).
        const folderName = getFolderName(sourceFolderPath, separator);
        return `${targetFolderPath}${separator}${folderName}${separator}${remainder}`;
    }

    // Unrelated target: nest the full source folder path (Classic/x -> Rock/Classic/x).
    return `${targetFolderPath}${separator}${sourceFolderPath}${separator}${remainder}`;
};

export const remapPlaylistToRoot = (playlistName: string, separator: string): string => {
    return getPlaylistLeafName(playlistName, separator).trim();
};

const updatePlaylistName = async (
    updateMutation: ReturnType<typeof useUpdatePlaylist>,
    serverId: string,
    playlist: Playlist,
    newName: string,
) => {
    if (newName === playlist.name) return;

    await updateMutation.mutateAsync({
        apiClientProps: { serverId },
        body: {
            comment: playlist.description || '',
            name: newName,
            ownerId: playlist.ownerId || '',
            public: playlist.public || false,
            queryBuilderRules: playlist.rules ?? undefined,
            sync: playlist.sync ?? undefined,
        },
        query: { id: playlist.id },
    });
};

export const usePlaylistRootDrop = (allPlaylists: Playlist[]) => {
    const { t } = useTranslation();
    const serverId = useCurrentServerId();
    const separator = useSidebarPlaylistFolderSeparator();
    const updateMutation = useUpdatePlaylist({});

    const handleDrop = useCallback(
        async (source: DragData) => {
            if (!serverId) return;

            try {
                if (source.type === DragTarget.SIDEBAR_PLAYLIST_FOLDER) {
                    const sourceFolderPath =
                        source.id[0] ??
                        (source.metadata as undefined | { folderName?: string })?.folderName;
                    if (!sourceFolderPath) return;

                    const affected = getPlaylistsInFolderTree(
                        allPlaylists,
                        sourceFolderPath,
                        separator,
                    );

                    for (const playlist of affected) {
                        await updatePlaylistName(
                            updateMutation,
                            serverId,
                            playlist,
                            remapPlaylistToRoot(playlist.name, separator),
                        );
                    }

                    return;
                }

                const playlists = source.item as Playlist[] | undefined;
                if (!Array.isArray(playlists) || playlists.length === 0) return;

                for (const playlist of playlists) {
                    await updatePlaylistName(
                        updateMutation,
                        serverId,
                        playlist,
                        remapPlaylistToRoot(playlist.name, separator),
                    );
                }
            } catch (err: unknown) {
                toast.error({
                    message: err instanceof Error ? err.message : undefined,
                    title: t('error.genericError'),
                });
            }
        },
        [allPlaylists, separator, serverId, t, updateMutation],
    );

    const { isDraggedOver, ref } = useDragDrop<HTMLButtonElement>({
        drop: {
            canDrop: (args) => {
                if (args.source.type === DragTarget.SIDEBAR_PLAYLIST_FOLDER) {
                    return Boolean(args.source.id[0]);
                }

                if (args.source.itemType !== LibraryItem.PLAYLIST) return false;
                const items = args.source.item as Playlist[] | undefined;
                return Array.isArray(items) && items.length > 0;
            },
            getData: () => ({
                id: [''],
                type: DragTarget.SIDEBAR_PLAYLIST_FOLDER,
            }),
            onDrag: () => {
                return;
            },
            onDragLeave: () => {
                return;
            },
            onDrop: ({ source }) => {
                void handleDrop(source);
            },
        },
        isEnabled: true,
    });

    return { isDraggedOver, ref };
};

interface PlaylistRootAccordionControlProps extends Omit<
    ComponentPropsWithoutRef<typeof Accordion.Control>,
    'ref'
> {
    allPlaylists: Playlist[];
}

export const PlaylistRootAccordionControl = ({
    allPlaylists,
    children,
    className,
    ...controlProps
}: PlaylistRootAccordionControlProps) => {
    const { isDraggedOver, ref } = usePlaylistRootDrop(allPlaylists);

    return (
        <Accordion.Control
            className={clsx(className, {
                [styles.rootDropTargetDraggedOver]: isDraggedOver,
            })}
            component="div"
            ref={ref}
            role="button"
            style={{ userSelect: 'none' }}
            {...controlProps}
        >
            {children}
        </Accordion.Control>
    );
};

// Drag-and-drop on folder headers: folders can be dragged, and accept folder or playlist drops.
const usePlaylistFolderDrop = (folderPath: string, allPlaylists: Playlist[]) => {
    const { t } = useTranslation();
    const serverId = useCurrentServerId();
    const separator = useSidebarPlaylistFolderSeparator();
    const updateMutation = useUpdatePlaylist({});

    const handleDrop = useCallback(
        async (source: DragData) => {
            if (!serverId) return;

            try {
                if (source.type === DragTarget.SIDEBAR_PLAYLIST_FOLDER) {
                    // Folder drop: rename every playlist under the dragged folder tree.
                    const sourceFolderPath =
                        source.id[0] ??
                        (source.metadata as undefined | { folderName?: string })?.folderName;
                    if (
                        !sourceFolderPath ||
                        !isValidFolderNest(sourceFolderPath, folderPath, separator)
                    ) {
                        return;
                    }

                    const affected = getPlaylistsInFolderTree(
                        allPlaylists,
                        sourceFolderPath,
                        separator,
                    );

                    for (const playlist of affected) {
                        const newName = remapPlaylistFolderPath(
                            playlist.name,
                            sourceFolderPath,
                            folderPath,
                            separator,
                        );
                        if (!newName || newName === playlist.name) continue;

                        await updateMutation.mutateAsync({
                            apiClientProps: { serverId },
                            body: {
                                comment: playlist.description || '',
                                name: newName,
                                ownerId: playlist.ownerId || '',
                                public: playlist.public || false,
                                queryBuilderRules: playlist.rules ?? undefined,
                                sync: playlist.sync ?? undefined,
                            },
                            query: { id: playlist.id },
                        });
                    }

                    return;
                }

                // Playlist drop: move a single playlist into this folder using its leaf name only.
                const playlists = source.item as Playlist[] | undefined;
                if (!Array.isArray(playlists) || playlists.length === 0) return;

                for (const playlist of playlists) {
                    const leafName = getPlaylistLeafName(playlist.name, separator);
                    const newName = buildPlaylistNameInFolder(folderPath, leafName, separator);
                    if (newName === playlist.name) continue;

                    await updateMutation.mutateAsync({
                        apiClientProps: { serverId },
                        body: {
                            comment: playlist.description || '',
                            name: newName,
                            ownerId: playlist.ownerId || '',
                            public: playlist.public || false,
                            queryBuilderRules: playlist.rules ?? undefined,
                            sync: playlist.sync ?? undefined,
                        },
                        query: { id: playlist.id },
                    });
                }
            } catch (err: unknown) {
                toast.error({
                    message: err instanceof Error ? err.message : undefined,
                    title: t('error.genericError'),
                });
            }
        },
        [allPlaylists, folderPath, separator, serverId, t, updateMutation],
    );

    const { isDraggedOver, isDragging, ref } = useDragDrop<HTMLButtonElement>({
        drag: {
            // Folders are virtual; drag data carries the folder path, not playlist items.
            getId: () => [folderPath],
            getItem: () => [],
            metadata: { folderName: folderPath },
            operation: [DragOperation.ADD],
            target: DragTarget.SIDEBAR_PLAYLIST_FOLDER,
        },
        drop: {
            canDrop: (args) => {
                if (args.source.type === DragTarget.SIDEBAR_PLAYLIST_FOLDER) {
                    const sourceFolderPath =
                        args.source.id[0] ??
                        (args.source.metadata as undefined | { folderName?: string })?.folderName;
                    if (!sourceFolderPath) return false;
                    return isValidFolderNest(sourceFolderPath, folderPath, separator);
                }

                // Single playlist rows can also be dropped onto a folder header.
                if (args.source.itemType !== LibraryItem.PLAYLIST) return false;
                const items = args.source.item as Playlist[] | undefined;
                return Array.isArray(items) && items.length > 0;
            },
            getData: () => ({
                id: [folderPath],
                type: DragTarget.SIDEBAR_PLAYLIST_FOLDER,
            }),
            onDrag: () => {
                return;
            },
            onDragLeave: () => {
                return;
            },
            onDrop: ({ source }) => {
                void handleDrop(source);
            },
        },
        isEnabled: true,
    });

    return { isDraggedOver, isDragging, ref };
};

interface PlaylistFolderHeaderProps {
    allPlaylists: Playlist[];
    folderPath: string;
    isOpen?: boolean;
    leafCount: number;
    name: string;
    onClick: () => void;
    variant: 'header' | 'nav';
}

const PlaylistFolderHeader = ({
    allPlaylists,
    folderPath,
    isOpen,
    leafCount,
    name,
    onClick,
    variant,
}: PlaylistFolderHeaderProps) => {
    const { isDraggedOver, isDragging, ref } = usePlaylistFolderDrop(folderPath, allPlaylists);

    if (variant === 'nav') {
        return (
            <button
                aria-label={name}
                className={clsx(styles.navFolder, {
                    [styles.headerDraggedOver]: isDraggedOver,
                })}
                onClick={onClick}
                ref={ref}
                style={{ opacity: isDragging ? 0.5 : 1 }}
                type="button"
            >
                <div className={styles.navFolderIcon}>
                    <Icon color="muted" icon="folder" size="xl" />
                </div>
                <Text className={styles.name} fw={500} size="md">
                    {name}
                </Text>
                <Text className={styles.count} isMuted size="sm">
                    {leafCount}
                </Text>
                <Icon className={styles.navChevron} icon="arrowRightS" size="sm" />
            </button>
        );
    }

    return (
        <button
            aria-expanded={isOpen}
            aria-label={name}
            className={clsx(styles.header, {
                [styles.headerDraggedOver]: isDraggedOver,
            })}
            onClick={onClick}
            ref={ref}
            style={{ opacity: isDragging ? 0.5 : 1 }}
            type="button"
        >
            <Icon
                className={styles.chevron}
                icon={isOpen ? 'arrowDownS' : 'arrowRightS'}
                size="sm"
            />
            <Icon color="muted" icon="folder" size="sm" />
            <Text className={styles.name} fw={500} size="md">
                {name}
            </Text>
            <Text className={styles.count} isMuted size="sm">
                {leafCount}
            </Text>
        </button>
    );
};

export type FolderNode = {
    children: TreeNode[];
    leafCount: number;
    name: string;
    path: string;
    type: 'folder';
};

export type LeafNode = {
    displayName: string;
    item: Playlist;
    type: 'leaf';
};

export type PlaylistFolderScope = 'owned' | 'shared';

export type PlaylistGroup =
    | { item: Playlist; type: 'root' }
    | { items: Playlist[]; name: string; type: 'folder' };

export type TreeNode = FolderNode | LeafNode;

const splitOnce = (name: string, separator: string): [string, string] | null => {
    const idx = name.indexOf(separator);
    // Reject any separators at the end
    if (idx <= 0 || idx >= name.length - separator.length) return null;
    return [name.slice(0, idx), name.slice(idx + separator.length)];
};

export const groupPlaylists = (items: Playlist[], separator: string): PlaylistGroup[] => {
    const folders: PlaylistGroup[] = [];
    const roots: PlaylistGroup[] = [];
    const folderIndex = new Map<string, number>();

    for (const item of items) {
        const split = splitOnce(item.name, separator);
        if (split) {
            const [folderName] = split;
            const existing = folderIndex.get(folderName);
            if (existing !== undefined) {
                const group = folders[existing];
                if (group.type === 'folder') {
                    group.items.push(item);
                    continue;
                }
            }
            folderIndex.set(folderName, folders.length);
            folders.push({ items: [item], name: folderName, type: 'folder' });
        } else {
            roots.push({ item, type: 'root' });
        }
    }

    return [...folders, ...roots];
};

export const buildPlaylistTree = (items: Playlist[], separator: string): TreeNode[] => {
    const root: TreeNode[] = [];
    const folderByPath = new Map<string, FolderNode>();

    const ensureFolder = (segments: string[], parent: TreeNode[]): FolderNode => {
        const path = segments.join(separator);
        const existing = folderByPath.get(path);
        if (existing) return existing;
        const node: FolderNode = {
            children: [],
            leafCount: 0,
            name: segments[segments.length - 1],
            path,
            type: 'folder',
        };
        folderByPath.set(path, node);
        parent.push(node);
        return node;
    };

    for (const item of items) {
        const segments = separator ? item.name.split(separator) : [item.name];
        const validSegments = segments.filter((s) => s.length > 0);

        if (validSegments.length <= 1) {
            root.push({ displayName: item.name, item, type: 'leaf' });
            continue;
        }

        let parent: TreeNode[] = root;
        const pathStack: string[] = [];
        for (let i = 0; i < validSegments.length - 1; i++) {
            pathStack.push(validSegments[i]);
            const folder = ensureFolder([...pathStack], parent);
            parent = folder.children;
        }
        const leafName = validSegments[validSegments.length - 1];
        parent.push({ displayName: leafName, item, type: 'leaf' });
    }

    const sortFoldersFirst = (nodes: TreeNode[]): TreeNode[] => {
        const folderNodes: TreeNode[] = [];
        const leafNodes: TreeNode[] = [];
        for (const node of nodes) {
            if (node.type === 'folder') {
                node.children = sortFoldersFirst(node.children);
                folderNodes.push(node);
            } else {
                leafNodes.push(node);
            }
        }
        return [...folderNodes, ...leafNodes];
    };

    const countLeaves = (nodes: TreeNode[]): number => {
        let total = 0;
        for (const node of nodes) {
            if (node.type === 'leaf') {
                total += 1;
            } else {
                node.leafCount = countLeaves(node.children);
                total += node.leafCount;
            }
        }
        return total;
    };

    const sorted = sortFoldersFirst(root);
    countLeaves(sorted);

    return sorted;
};

export const collectFolderPaths = (nodes: TreeNode[]): string[] => {
    const paths: string[] = [];
    const walk = (list: TreeNode[]) => {
        for (const node of list) {
            if (node.type === 'folder') {
                paths.push(node.path);
                walk(node.children);
            }
        }
    };
    walk(nodes);
    return paths;
};

export const usePlaylistFolderState = (scope: PlaylistFolderScope) => {
    const [expanded, setExpanded] = useLocalStorage<string[]>({
        defaultValue: [],
        key: `${STORAGE_KEY_PREFIX}:${scope}`,
    });

    const expandedSet = useMemo(() => new Set(expanded), [expanded]);

    const toggle = useCallback(
        (path: string) => {
            setExpanded((prev) => {
                const next = new Set(prev);
                if (next.has(path)) next.delete(path);
                else next.add(path);
                return Array.from(next);
            });
        },
        [setExpanded],
    );

    const setMany = useCallback(
        (paths: string[], shouldExpand: boolean) => {
            setExpanded((prev) => {
                const next = new Set(prev);
                if (shouldExpand) {
                    for (const p of paths) next.add(p);
                } else {
                    for (const p of paths) next.delete(p);
                }
                return Array.from(next);
            });
        },
        [setExpanded],
    );

    return { expandedSet, setMany, toggle };
};

interface PlaylistFolderTreeProps {
    allPlaylists: Playlist[];
    expandedSet: Set<string>;
    groups: PlaylistGroup[];
    onContextMenu: (e: MouseEvent<HTMLAnchorElement>, item: Playlist) => void;
    onReorder: (sourceIds: string[], targetId: string, edge: 'bottom' | 'top' | null) => void;
    onToggleFolder: (name: string) => void;
}

export const PlaylistFolderTree = ({
    allPlaylists,
    expandedSet,
    groups,
    onContextMenu,
    onReorder,
    onToggleFolder,
}: PlaylistFolderTreeProps) => {
    return (
        <>
            {groups.map((group) => {
                if (group.type === 'root') {
                    return (
                        <PlaylistRowButton
                            item={group.item}
                            key={group.item.id}
                            name={group.item.name}
                            onContextMenu={onContextMenu}
                            onReorder={onReorder}
                            to={group.item.id}
                        />
                    );
                }

                const isOpen = expandedSet.has(group.name);
                return (
                    <div className={styles.folder} key={`folder:${group.name}`}>
                        <PlaylistFolderHeader
                            allPlaylists={allPlaylists}
                            folderPath={group.name}
                            isOpen={isOpen}
                            leafCount={group.items.length}
                            name={group.name}
                            onClick={() => onToggleFolder(group.name)}
                            variant="header"
                        />
                        {isOpen && (
                            <div className={styles.children}>
                                {group.items.map((item) => (
                                    <PlaylistRowButton
                                        item={item}
                                        key={item.id}
                                        name={item.name.slice(group.name.length + 1)}
                                        onContextMenu={onContextMenu}
                                        onReorder={onReorder}
                                        to={item.id}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </>
    );
};

interface PlaylistFolderTreeViewProps {
    allPlaylists: Playlist[];
    expandedSet: Set<string>;
    nodes: TreeNode[];
    onContextMenu: (e: MouseEvent<HTMLAnchorElement>, item: Playlist) => void;
    onReorder: (sourceIds: string[], targetId: string, edge: 'bottom' | 'top' | null) => void;
    onToggleFolder: (path: string) => void;
}

export const PlaylistFolderTreeView = ({
    allPlaylists,
    expandedSet,
    nodes,
    onContextMenu,
    onReorder,
    onToggleFolder,
}: PlaylistFolderTreeViewProps) => {
    const renderNode = (node: TreeNode): ReactElement => {
        if (node.type === 'leaf') {
            return (
                <PlaylistRowButton
                    item={node.item}
                    key={node.item.id}
                    name={node.displayName}
                    onContextMenu={onContextMenu}
                    onReorder={onReorder}
                    to={node.item.id}
                />
            );
        }

        const isOpen = expandedSet.has(node.path);
        return (
            <div className={styles.folder} key={`folder:${node.path}`}>
                <PlaylistFolderHeader
                    allPlaylists={allPlaylists}
                    folderPath={node.path}
                    isOpen={isOpen}
                    leafCount={node.leafCount}
                    name={node.name}
                    onClick={() => onToggleFolder(node.path)}
                    variant="header"
                />
                {isOpen && (
                    <div className={styles.treeChildren}>
                        {node.children.map((child) => (
                            <div className={styles.treeBranch} key={getNodeKey(child)}>
                                {renderNode(child)}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return <>{nodes.map((node) => renderNode(node))}</>;
};

const getNodeKey = (node: TreeNode) =>
    node.type === 'leaf' ? `leaf:${node.item.id}` : `folder:${node.path}`;

export interface PlaylistNavigationState {
    currentName: string | undefined;
    enter: (name: string) => void;
    goUp: () => void;
    pathStack: string[];
}

export const usePlaylistNavigationState = (): PlaylistNavigationState => {
    const [pathStack, setPathStack] = useState<string[]>([]);
    const enter = useCallback((name: string) => setPathStack((prev) => [...prev, name]), []);
    const goUp = useCallback(() => setPathStack((prev) => prev.slice(0, -1)), []);
    return {
        currentName: pathStack[pathStack.length - 1],
        enter,
        goUp,
        pathStack,
    };
};

interface PlaylistFolderNavigationViewProps {
    allPlaylists: Playlist[];
    nodes: TreeNode[];
    onContextMenu: (e: MouseEvent<HTMLAnchorElement>, item: Playlist) => void;
    onEnter: (name: string) => void;
    onReorder: (sourceIds: string[], targetId: string, edge: 'bottom' | 'top' | null) => void;
    pathStack: string[];
}

export const PlaylistFolderNavigationView = ({
    allPlaylists,
    nodes,
    onContextMenu,
    onEnter,
    onReorder,
    pathStack,
}: PlaylistFolderNavigationViewProps) => {
    const currentNodes = useMemo(() => {
        let list = nodes;
        for (const segment of pathStack) {
            const folder = list.find(
                (n): n is FolderNode => n.type === 'folder' && n.name === segment,
            );
            if (!folder) return [] as TreeNode[];
            list = folder.children;
        }
        return list;
    }, [nodes, pathStack]);

    const { folders, leaves } = useMemo(() => {
        const fs: FolderNode[] = [];
        const ls: LeafNode[] = [];
        for (const node of currentNodes) {
            if (node.type === 'folder') fs.push(node);
            else ls.push(node);
        }
        return { folders: fs, leaves: ls };
    }, [currentNodes]);

    return (
        <div className={styles.navigation}>
            {folders.map((folder) => (
                <PlaylistFolderHeader
                    allPlaylists={allPlaylists}
                    folderPath={folder.path}
                    key={`navfolder:${folder.path}`}
                    leafCount={folder.leafCount}
                    name={folder.name}
                    onClick={() => onEnter(folder.name)}
                    variant="nav"
                />
            ))}
            {leaves.map((leaf) => (
                <PlaylistRowButton
                    item={leaf.item}
                    key={leaf.item.id}
                    name={leaf.displayName}
                    onContextMenu={onContextMenu}
                    onReorder={onReorder}
                    to={leaf.item.id}
                />
            ))}
        </div>
    );
};

export type PlaylistFolderViewState = {
    foldersEnabled: boolean;
    folderView: 'navigation' | 'single' | 'tree';
    groups: PlaylistGroup[];
    tree: TreeNode[];
    treeStyle: CSSProperties;
};

export const usePlaylistFolderViewState = (items: Playlist[]): PlaylistFolderViewState => {
    const foldersEnabled = useSidebarPlaylistFolders();
    const folderView = useSidebarPlaylistFolderView();
    const separator = useSidebarPlaylistFolderSeparator();
    const treeIndent = useSidebarPlaylistFolderTreeIndent();
    const treeLineColor = useSidebarPlaylistFolderTreeLineColor();

    const groups = useMemo<PlaylistGroup[]>(
        () =>
            foldersEnabled && folderView === 'single'
                ? groupPlaylists(items, separator)
                : items.map((item) => ({ item, type: 'root' as const })),
        [foldersEnabled, folderView, items, separator],
    );

    const tree = useMemo<TreeNode[]>(
        () =>
            foldersEnabled && folderView !== 'single' ? buildPlaylistTree(items, separator) : [],
        [foldersEnabled, folderView, items, separator],
    );

    const treeStyle = useMemo<CSSProperties>(
        () => ({
            ...(typeof treeIndent === 'number'
                ? { ['--playlist-folder-tree-indent' as never]: `${treeIndent}px` }
                : {}),
            ...(treeLineColor
                ? { ['--playlist-folder-tree-line-color' as never]: treeLineColor }
                : {}),
        }),
        [treeIndent, treeLineColor],
    );

    return { foldersEnabled, folderView, groups, tree, treeStyle };
};

interface PlaylistFolderViewsProps extends PlaylistFolderViewState {
    allPlaylists: Playlist[];
    expandedSet: Set<string>;
    navigation: PlaylistNavigationState;
    onContextMenu: (e: MouseEvent<HTMLAnchorElement>, item: Playlist) => void;
    onReorder: (sourceIds: string[], targetId: string, edge: 'bottom' | 'top' | null) => void;
    onToggleFolder: (path: string) => void;
}

export const PlaylistFolderViews = ({
    allPlaylists,
    expandedSet,
    foldersEnabled,
    folderView,
    groups,
    navigation,
    onContextMenu,
    onReorder,
    onToggleFolder,
    tree,
    treeStyle,
}: PlaylistFolderViewsProps) => {
    if (foldersEnabled && folderView === 'tree') {
        return (
            <div style={treeStyle}>
                <PlaylistFolderTreeView
                    allPlaylists={allPlaylists}
                    expandedSet={expandedSet}
                    nodes={tree}
                    onContextMenu={onContextMenu}
                    onReorder={onReorder}
                    onToggleFolder={onToggleFolder}
                />
            </div>
        );
    }

    if (foldersEnabled && folderView === 'navigation') {
        return (
            <PlaylistFolderNavigationView
                allPlaylists={allPlaylists}
                nodes={tree}
                onContextMenu={onContextMenu}
                onEnter={navigation.enter}
                onReorder={onReorder}
                pathStack={navigation.pathStack}
            />
        );
    }

    return (
        <PlaylistFolderTree
            allPlaylists={allPlaylists}
            expandedSet={expandedSet}
            groups={groups}
            onContextMenu={onContextMenu}
            onReorder={onReorder}
            onToggleFolder={onToggleFolder}
        />
    );
};
