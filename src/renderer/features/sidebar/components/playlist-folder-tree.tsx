import { CSSProperties, MouseEvent, ReactElement, useCallback, useMemo, useState } from 'react';

import styles from './playlist-folder-tree.module.css';

import { PlaylistRowButton } from '/@/renderer/features/sidebar/components/sidebar-playlist-list';
import {
    useSidebarPlaylistFolders,
    useSidebarPlaylistFolderSeparator,
    useSidebarPlaylistFolderTreeIndent,
    useSidebarPlaylistFolderTreeLineColor,
    useSidebarPlaylistFolderView,
} from '/@/renderer/store';
import { Icon } from '/@/shared/components/icon/icon';
import { Text } from '/@/shared/components/text/text';
import { useLocalStorage } from '/@/shared/hooks/use-local-storage';
import { Playlist } from '/@/shared/types/domain-types';

const STORAGE_KEY_PREFIX = 'feishin:playlist-folder-state';

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
    expandedSet: Set<string>;
    groups: PlaylistGroup[];
    onContextMenu: (e: MouseEvent<HTMLAnchorElement>, item: Playlist) => void;
    onReorder: (sourceIds: string[], targetId: string, edge: 'bottom' | 'top' | null) => void;
    onToggleFolder: (name: string) => void;
}

export const PlaylistFolderTree = ({
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
                        <button
                            aria-expanded={isOpen}
                            aria-label={group.name}
                            className={styles.header}
                            onClick={() => onToggleFolder(group.name)}
                            type="button"
                        >
                            <Icon
                                className={styles.chevron}
                                icon={isOpen ? 'arrowDownS' : 'arrowRightS'}
                                size="sm"
                            />
                            <Icon color="muted" icon="folder" size="sm" />
                            <Text className={styles.name} fw={500} size="md">
                                {group.name}
                            </Text>
                            <Text className={styles.count} isMuted size="sm">
                                {group.items.length}
                            </Text>
                        </button>
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
    expandedSet: Set<string>;
    nodes: TreeNode[];
    onContextMenu: (e: MouseEvent<HTMLAnchorElement>, item: Playlist) => void;
    onReorder: (sourceIds: string[], targetId: string, edge: 'bottom' | 'top' | null) => void;
    onToggleFolder: (path: string) => void;
}

export const PlaylistFolderTreeView = ({
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
                <button
                    aria-expanded={isOpen}
                    aria-label={node.name}
                    className={styles.header}
                    onClick={() => onToggleFolder(node.path)}
                    type="button"
                >
                    <Icon
                        className={styles.chevron}
                        icon={isOpen ? 'arrowDownS' : 'arrowRightS'}
                        size="sm"
                    />
                    <Icon color="muted" icon="folder" size="sm" />
                    <Text className={styles.name} fw={500} size="md">
                        {node.name}
                    </Text>
                    <Text className={styles.count} isMuted size="sm">
                        {node.leafCount}
                    </Text>
                </button>
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
    nodes: TreeNode[];
    onContextMenu: (e: MouseEvent<HTMLAnchorElement>, item: Playlist) => void;
    onEnter: (name: string) => void;
    onReorder: (sourceIds: string[], targetId: string, edge: 'bottom' | 'top' | null) => void;
    pathStack: string[];
}

export const PlaylistFolderNavigationView = ({
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
                <button
                    aria-label={folder.name}
                    className={styles.navFolder}
                    key={`navfolder:${folder.path}`}
                    onClick={() => onEnter(folder.name)}
                    type="button"
                >
                    <div className={styles.navFolderIcon}>
                        <Icon color="muted" icon="folder" size="xl" />
                    </div>
                    <Text className={styles.name} fw={500} size="md">
                        {folder.name}
                    </Text>
                    <Text className={styles.count} isMuted size="sm">
                        {folder.leafCount}
                    </Text>
                    <Icon className={styles.navChevron} icon="arrowRightS" size="sm" />
                </button>
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
    expandedSet: Set<string>;
    navigation: PlaylistNavigationState;
    onContextMenu: (e: MouseEvent<HTMLAnchorElement>, item: Playlist) => void;
    onReorder: (sourceIds: string[], targetId: string, edge: 'bottom' | 'top' | null) => void;
    onToggleFolder: (path: string) => void;
}

export const PlaylistFolderViews = ({
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
            expandedSet={expandedSet}
            groups={groups}
            onContextMenu={onContextMenu}
            onReorder={onReorder}
            onToggleFolder={onToggleFolder}
        />
    );
};
