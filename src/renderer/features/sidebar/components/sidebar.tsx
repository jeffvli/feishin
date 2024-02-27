import { MouseEvent, useMemo } from 'react';
import { Box, Center, Divider, Group, Stack } from '@mantine/core';
import { closeAllModals, openModal } from '@mantine/modals';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { RiAddFill, RiArrowDownSLine, RiDiscLine, RiListUnordered } from 'react-icons/ri';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import {
    SidebarItemType,
    useGeneralSettings,
    useWindowSettings,
} from '../../../store/settings.store';
import { PlaylistListSort, ServerType, SortOrder } from '/@/renderer/api/types';
import { Button, MotionStack, Spinner, Tooltip } from '/@/renderer/components';
import { CreatePlaylistForm, usePlaylistList } from '/@/renderer/features/playlists';
import { ActionBar } from '/@/renderer/features/sidebar/components/action-bar';
import { SidebarIcon } from '/@/renderer/features/sidebar/components/sidebar-icon';
import { SidebarItem } from '/@/renderer/features/sidebar/components/sidebar-item';
import { SidebarPlaylistList } from '/@/renderer/features/sidebar/components/sidebar-playlist-list';
import { useContainerQuery } from '/@/renderer/hooks';
import { AppRoute } from '/@/renderer/router/routes';
import {
    useAppStoreActions,
    useCurrentServer,
    useCurrentSong,
    useFullScreenPlayerStore,
    useSetFullScreenPlayerStore,
    useSidebarStore,
} from '/@/renderer/store';
import { fadeIn } from '/@/renderer/styles';
import { Platform } from '/@/renderer/types';
import { RescanSiderbar } from '/@/renderer/features/sidebar/components/rescan';

const SidebarContainer = styled.div<{ $windowBarStyle: Platform }>`
    height: 100%;
    max-height: ${
        (props) =>
            props.$windowBarStyle === Platform.WEB || props.$windowBarStyle === Platform.LINUX
                ? 'calc(100vh - 160px)' // Playerbar (90px) & ActionBar (70px)
                : 'calc(100vh - 190px)' // plus windowbar (30px) if the windowBarStyle is Windows/Mac
        // We use the height of the SidebarContainer to keep the Stack below the ActionBar at the correct height
        // ActionBar uses height: 100%; so it has the full height of its parent
    };
    user-select: none;
`;

const ImageContainer = styled(motion.div)<{ height: string }>`
    position: relative;
    height: ${(props) => props.height};
    cursor: pointer;

    ${fadeIn};
    animation: fadein 0.2s ease-in-out;

    button {
        display: none;
    }

    &:hover button {
        display: block;
    }
`;

const SidebarImage = styled.img`
    width: 100%;
    height: 100%;
    object-fit: cover;
    background: var(--placeholder-bg);
`;

export const Sidebar = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const sidebar = useSidebarStore();
    const { setSideBar } = useAppStoreActions();
    const { windowBarStyle } = useWindowSettings();
    const { sidebarPlaylistList } = useGeneralSettings();
    const imageUrl = useCurrentSong()?.imageUrl;
    const server = useCurrentServer();

    const translatedSidebarItemMap = useMemo(
        () => ({
            Albums: t('page.sidebar.albums', { postProcess: 'titleCase' }),
            Artists: t('page.sidebar.artists', { postProcess: 'titleCase' }),
            Folders: t('page.sidebar.folders', { postProcess: 'titleCase' }),
            Genres: t('page.sidebar.genres', { postProcess: 'titleCase' }),
            Home: t('page.sidebar.home', { postProcess: 'titleCase' }),
            'Now Playing': t('page.sidebar.nowPlaying', { postProcess: 'titleCase' }),
            Playlists: t('page.sidebar.playlists', { postProcess: 'titleCase' }),
            Search: t('page.sidebar.search', { postProcess: 'titleCase' }),
            Settings: t('page.sidebar.settings', { postProcess: 'titleCase' }),
            Tracks: t('page.sidebar.tracks', { postProcess: 'titleCase' }),
        }),
        [t],
    );
    const upsizedImageUrl = imageUrl
        ?.replace(/size=\d+/, 'size=450')
        .replace(/width=\d+/, 'width=450')
        .replace(/height=\d+/, 'height=450');

    const showImage = sidebar.image;

    const handleCreatePlaylistModal = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();

        openModal({
            children: <CreatePlaylistForm onCancel={() => closeAllModals()} />,
            size: server?.type === ServerType?.NAVIDROME ? 'xl' : 'sm',
            title: t('form.createPlaylist.title', { postProcess: 'titleCase' }),
        });
    };

    const playlistsQuery = usePlaylistList({
        query: {
            sortBy: PlaylistListSort.NAME,
            sortOrder: SortOrder.ASC,
            startIndex: 0,
        },
        serverId: server?.id,
    });

    const setFullScreenPlayerStore = useSetFullScreenPlayerStore();
    const { expanded: isFullScreenPlayerExpanded } = useFullScreenPlayerStore();
    const expandFullScreenPlayer = () => {
        setFullScreenPlayerStore({ expanded: !isFullScreenPlayerExpanded });
    };

    const cq = useContainerQuery({ sm: 300 });

    const { sidebarItems } = useGeneralSettings();

    const sidebarItemsWithRoute: SidebarItemType[] = useMemo(() => {
        if (!sidebarItems) return [];

        const items = sidebarItems
            .filter((item) => !item.disabled)
            .map((item) => ({
                ...item,
                label:
                    translatedSidebarItemMap[item.id as keyof typeof translatedSidebarItemMap] ??
                    item.label,
            }));

        return items;
    }, [sidebarItems, translatedSidebarItemMap]);

    return (
        <SidebarContainer
            ref={cq.ref}
            $windowBarStyle={windowBarStyle}
        >
            <ActionBar />
            <Stack
                h="100%"
                justify="space-between"
                spacing={0}
            >
                <MotionStack
                    h="100%"
                    layout="position"
                    spacing={0}
                    sx={{ maxHeight: showImage ? `calc(100% - ${sidebar.leftWidth})` : '100%' }}
                >
                    <Stack spacing={0}>
                        {sidebarItemsWithRoute.map((item) =>
                            item.route === AppRoute.RESCAN ? (
                                <RescanSiderbar />
                            ) : (
                                <SidebarItem
                                    key={`sidebar-${item.route}`}
                                    to={item.route}
                                >
                                    <Group spacing="sm">
                                        <SidebarIcon
                                            active={location.pathname === item.route}
                                            route={item.route}
                                            size="1.1em"
                                        />
                                        {item.label}
                                    </Group>
                                </SidebarItem>
                            ),
                        )}
                    </Stack>
                    <Divider
                        mx="1rem"
                        my="0.5rem"
                    />
                    {sidebarPlaylistList && (
                        <>
                            <Group
                                position="apart"
                                pt="1rem"
                                px="1.5rem"
                            >
                                <Group>
                                    <Box
                                        fw="600"
                                        sx={{ fontSize: '1.2rem' }}
                                    >
                                        {t('page.sidebar.playlists', { postProcess: 'titleCase' })}
                                    </Box>
                                    {playlistsQuery.isLoading && <Spinner />}
                                </Group>
                                <Group spacing="sm">
                                    <Button
                                        compact
                                        size="md"
                                        tooltip={{
                                            label: t('action.createPlaylist', {
                                                postProcess: 'sentenceCase',
                                            }),
                                            openDelay: 500,
                                        }}
                                        variant="default"
                                        onClick={handleCreatePlaylistModal}
                                    >
                                        <RiAddFill size="1em" />
                                    </Button>
                                    <Button
                                        compact
                                        component={Link}
                                        size="md"
                                        to={AppRoute.PLAYLISTS}
                                        tooltip={{
                                            label: t('action.viewPlaylists', {
                                                postProcess: 'sentenceCase',
                                            }),
                                            openDelay: 500,
                                        }}
                                        variant="default"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <RiListUnordered size="1em" />
                                    </Button>
                                </Group>
                            </Group>
                            <SidebarPlaylistList data={playlistsQuery.data} />
                        </>
                    )}
                </MotionStack>
                <AnimatePresence
                    initial={false}
                    mode="popLayout"
                >
                    {showImage && (
                        <ImageContainer
                            key="sidebar-image"
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 200 }}
                            height={sidebar.leftWidth}
                            initial={{ opacity: 0, y: 200 }}
                            role="button"
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            onClick={expandFullScreenPlayer}
                        >
                            <Tooltip
                                label={t('player.toggleFullscreenPlayer', {
                                    postProcess: 'sentenceCase',
                                })}
                                openDelay={500}
                            >
                                {upsizedImageUrl ? (
                                    <SidebarImage
                                        loading="eager"
                                        src={upsizedImageUrl}
                                    />
                                ) : (
                                    <Center
                                        sx={{ background: 'var(--placeholder-bg)', height: '100%' }}
                                    >
                                        <RiDiscLine
                                            color="var(--placeholder-fg)"
                                            size={50}
                                        />
                                    </Center>
                                )}
                            </Tooltip>
                            <Button
                                compact
                                opacity={0.8}
                                radius={100}
                                size="md"
                                sx={{ cursor: 'default', position: 'absolute', right: 5, top: 5 }}
                                tooltip={{
                                    label: t('common.collapse', { postProcess: 'titleCase' }),
                                    openDelay: 500,
                                }}
                                variant="default"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSideBar({ image: false });
                                }}
                            >
                                <RiArrowDownSLine
                                    color="white"
                                    size={20}
                                />
                            </Button>
                        </ImageContainer>
                    )}
                </AnimatePresence>
            </Stack>
        </SidebarContainer>
    );
};
