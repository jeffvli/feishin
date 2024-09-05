import React, { MouseEvent } from 'react';
import { Center, Group } from '@mantine/core';
import { useHotkeys } from '@mantine/hooks';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { RiArrowUpSLine, RiDiscLine, RiMore2Fill } from 'react-icons/ri';
import { generatePath, Link } from 'react-router-dom';
import styled from 'styled-components';
import { Button, Text, Tooltip } from '/@/renderer/components';
import { AppRoute } from '/@/renderer/router/routes';
import {
    useAppStoreActions,
    useCurrentSong,
    useSetFullScreenPlayerStore,
    useFullScreenPlayerStore,
    useSidebarStore,
    useHotkeySettings,
} from '/@/renderer/store';
import { fadeIn } from '/@/renderer/styles';
import { LibraryItem } from '/@/renderer/api/types';
import { SONG_CONTEXT_MENU_ITEMS } from '/@/renderer/features/context-menu/context-menu-items';
import { useHandleGeneralContextMenu } from '/@/renderer/features/context-menu/hooks/use-handle-context-menu';
import { Separator } from '/@/renderer/components/separator';

const ImageWrapper = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem 1rem 1rem 0;
`;

const MetadataStack = styled(motion.div)`
    display: flex;
    flex-direction: column;
    gap: 0;
    justify-content: center;
    width: 100%;
    overflow: hidden;
`;

const Image = styled(motion.div)`
    position: relative;
    width: 60px;
    height: 60px;
    cursor: pointer;
    background-color: var(--placeholder-bg);
    filter: drop-shadow(0 5px 6px rgb(0 0 0 / 50%));

    ${fadeIn};
    animation: fadein 0.2s ease-in-out;

    button {
        display: none;
    }

    &:hover button {
        display: block;
    }
`;

const PlayerbarImage = styled.img`
    width: 100%;
    height: 100%;
    object-fit: var(--image-fit);
`;

const LineItem = styled.div<{ $secondary?: boolean }>`
    display: inline-block;
    width: fit-content;
    max-width: 20vw;
    overflow: hidden;
    line-height: 1.3;
    color: ${(props) => props.$secondary && 'var(--main-fg-secondary)'};
    text-overflow: ellipsis;
    white-space: nowrap;

    a {
        color: ${(props) => props.$secondary && 'var(--text-secondary)'};
    }
`;

const LeftControlsContainer = styled.div`
    display: flex;
    width: 100%;
    height: 100%;
    padding-left: 1rem;

    @media (width <= 640px) {
        ${ImageWrapper} {
            display: none;
        }
    }
`;

export const LeftControls = () => {
    const { t } = useTranslation();
    const { setSideBar } = useAppStoreActions();
    const { expanded: isFullScreenPlayerExpanded } = useFullScreenPlayerStore();
    const setFullScreenPlayerStore = useSetFullScreenPlayerStore();
    const { image, collapsed } = useSidebarStore();
    const hideImage = image && !collapsed;
    const currentSong = useCurrentSong();
    const title = currentSong?.name;
    const artists = currentSong?.artists;
    const { bindings } = useHotkeySettings();

    const isSongDefined = Boolean(currentSong?.id);

    const handleGeneralContextMenu = useHandleGeneralContextMenu(
        LibraryItem.SONG,
        SONG_CONTEXT_MENU_ITEMS,
    );

    const handleToggleFullScreenPlayer = (e?: MouseEvent<HTMLDivElement> | KeyboardEvent) => {
        e?.stopPropagation();
        setFullScreenPlayerStore({ expanded: !isFullScreenPlayerExpanded });
    };

    const handleToggleSidebarImage = (e?: MouseEvent<HTMLButtonElement>) => {
        e?.stopPropagation();
        setSideBar({ image: true });
    };

    const stopPropagation = (e?: MouseEvent) => e?.stopPropagation();

    useHotkeys([
        [
            bindings.toggleFullscreenPlayer.allowGlobal
                ? ''
                : bindings.toggleFullscreenPlayer.hotkey,
            handleToggleFullScreenPlayer,
        ],
    ]);

    return (
        <LeftControlsContainer>
            <LayoutGroup>
                <AnimatePresence
                    initial={false}
                    mode="wait"
                >
                    {!hideImage && (
                        <ImageWrapper>
                            <Image
                                key="playerbar-image"
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                initial={{ opacity: 0, x: -50 }}
                                role="button"
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                onClick={handleToggleFullScreenPlayer}
                            >
                                <Tooltip
                                    label={t('player.toggleFullscreenPlayer', {
                                        postProcess: 'sentenceCase',
                                    })}
                                    openDelay={500}
                                >
                                    {currentSong?.imageUrl ? (
                                        <PlayerbarImage
                                            loading="eager"
                                            src={currentSong?.imageUrl}
                                        />
                                    ) : (
                                        <Center
                                            sx={{
                                                background: 'var(--placeholder-bg)',
                                                height: '100%',
                                            }}
                                        >
                                            <RiDiscLine
                                                color="var(--placeholder-fg)"
                                                size={50}
                                            />
                                        </Center>
                                    )}
                                </Tooltip>

                                {!collapsed && (
                                    <Button
                                        compact
                                        opacity={0.8}
                                        radius={50}
                                        size="md"
                                        sx={{
                                            cursor: 'default',
                                            position: 'absolute',
                                            right: 2,
                                            top: 2,
                                        }}
                                        tooltip={{
                                            label: t('common.expand', {
                                                postProcess: 'titleCase',
                                            }),
                                            openDelay: 500,
                                        }}
                                        variant="default"
                                        onClick={handleToggleSidebarImage}
                                    >
                                        <RiArrowUpSLine
                                            color="white"
                                            size={20}
                                        />
                                    </Button>
                                )}
                            </Image>
                        </ImageWrapper>
                    )}
                </AnimatePresence>
                <MetadataStack layout="position">
                    <LineItem onClick={stopPropagation}>
                        <Group
                            noWrap
                            align="flex-start"
                            spacing="xs"
                        >
                            <Text
                                $link
                                component={Link}
                                overflow="hidden"
                                size="md"
                                to={AppRoute.NOW_PLAYING}
                                weight={500}
                            >
                                {title || '—'}
                            </Text>
                            {isSongDefined && (
                                <Button
                                    compact
                                    variant="subtle"
                                    onClick={(e) => handleGeneralContextMenu(e, [currentSong!])}
                                >
                                    <RiMore2Fill size="1.2rem" />
                                </Button>
                            )}
                        </Group>
                    </LineItem>
                    <LineItem
                        $secondary
                        onClick={stopPropagation}
                    >
                        {artists?.map((artist, index) => (
                            <React.Fragment key={`bar-${artist.id}`}>
                                {index > 0 && <Separator />}
                                <Text
                                    $link={artist.id !== ''}
                                    component={artist.id ? Link : undefined}
                                    overflow="hidden"
                                    size="md"
                                    to={
                                        artist.id
                                            ? generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL, {
                                                  albumArtistId: artist.id,
                                              })
                                            : undefined
                                    }
                                    weight={500}
                                >
                                    {artist.name || '—'}
                                </Text>
                            </React.Fragment>
                        ))}
                    </LineItem>
                    <LineItem
                        $secondary
                        onClick={stopPropagation}
                    >
                        <Text
                            $link
                            component={Link}
                            overflow="hidden"
                            size="md"
                            to={
                                currentSong?.albumId
                                    ? generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, {
                                          albumId: currentSong.albumId,
                                      })
                                    : ''
                            }
                            weight={500}
                        >
                            {currentSong?.album || '—'}
                        </Text>
                    </LineItem>
                </MetadataStack>
            </LayoutGroup>
        </LeftControlsContainer>
    );
};
