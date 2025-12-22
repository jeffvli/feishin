import { AnimatePresence, motion, Variants } from 'motion/react';
import {
    CSSProperties,
    memo,
    ReactNode,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';

import styles from './full-screen-player.module.css';

import { SONG_TABLE_COLUMNS } from '/@/renderer/components/item-list/item-table-list/default-columns';
import { FullScreenPlayerImage } from '/@/renderer/features/player/components/full-screen-player-image';
import { FullScreenPlayerQueue } from '/@/renderer/features/player/components/full-screen-player-queue';
import { ListConfigMenu } from '/@/renderer/features/shared/components/list-config-menu';
import { useFastAverageColor } from '/@/renderer/hooks';
import {
    useFullScreenPlayerStore,
    useFullScreenPlayerStoreActions,
    useLyricsSettings,
    usePlayerData,
    usePlayerSong,
    useSettingsStore,
    useSettingsStoreActions,
    useWindowSettings,
} from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { Option } from '/@/shared/components/option/option';
import { Popover } from '/@/shared/components/popover/popover';
import { Select } from '/@/shared/components/select/select';
import { Slider } from '/@/shared/components/slider/slider';
import { Switch } from '/@/shared/components/switch/switch';
import { useHotkeys } from '/@/shared/hooks/use-hotkeys';
import { ItemListKey, ListDisplayType, Platform } from '/@/shared/types/types';

const mainBackground = 'var(--theme-colors-background)';

const backgroundImageVariants: Variants = {
    closed: {
        opacity: 0,
        transition: {
            duration: 0.8,
            ease: 'linear',
        },
    },
    initial: {
        opacity: 0,
    },
    open: (custom) => {
        const { isOpen } = custom;
        return {
            opacity: isOpen ? 1 : 0,
            transition: {
                duration: 0.4,
                ease: 'linear',
            },
        };
    },
};

interface BackgroundImageProps {
    dynamicBackground: boolean | undefined;
    dynamicIsImage: boolean | undefined;
}

const BackgroundImage = memo(({ dynamicBackground, dynamicIsImage }: BackgroundImageProps) => {
    const currentSong = usePlayerSong();
    const { nextSong } = usePlayerData();

    const [imageState, setImageState] = useState({
        bottomImage: nextSong?.imageUrl
            ? nextSong.imageUrl.replace(/size=\d+/g, 'size=500')
            : undefined,
        current: 0,
        topImage: currentSong?.imageUrl
            ? currentSong.imageUrl.replace(/size=\d+/g, 'size=500')
            : undefined,
    });

    const previousSongRef = useRef<string | undefined>(currentSong?._uniqueId);
    const imageStateRef = useRef(imageState);

    // Keep ref in sync
    useEffect(() => {
        imageStateRef.current = imageState;
    }, [imageState]);

    // Update images when song changes
    useEffect(() => {
        if (currentSong?._uniqueId === previousSongRef.current) {
            return;
        }

        const isTop = imageStateRef.current.current === 0;
        const currentImageUrl = currentSong?.imageUrl
            ? currentSong.imageUrl.replace(/size=\d+/g, 'size=500')
            : undefined;
        const nextImageUrl = nextSong?.imageUrl
            ? nextSong.imageUrl.replace(/size=\d+/g, 'size=500')
            : undefined;

        setImageState({
            bottomImage: isTop ? currentImageUrl : nextImageUrl,
            current: isTop ? 1 : 0,
            topImage: isTop ? nextImageUrl : currentImageUrl,
        });

        previousSongRef.current = currentSong?._uniqueId;
    }, [currentSong?._uniqueId, currentSong?.imageUrl, nextSong?._uniqueId, nextSong?.imageUrl]);

    if (!dynamicBackground || !dynamicIsImage) {
        return null;
    }

    const getBackgroundImageUrl = (
        imageUrl: string | undefined,
        songId: string | undefined,
        albumId: string | undefined,
    ) => {
        if (!imageUrl || !songId || !albumId) {
            return imageUrl;
        }
        return imageUrl.replace(songId, albumId);
    };

    // Determine which song IDs to use for keys and image URLs
    const topSongId = imageState.current === 0 ? currentSong?._uniqueId : nextSong?._uniqueId;
    const bottomSongId = imageState.current === 0 ? nextSong?._uniqueId : currentSong?._uniqueId;
    const topSong = imageState.current === 0 ? currentSong : nextSong;
    const bottomSong = imageState.current === 0 ? nextSong : currentSong;

    return (
        <AnimatePresence initial={false} mode="sync">
            {imageState.current === 0 && imageState.topImage && (
                <motion.div
                    animate="open"
                    className={styles.backgroundImage}
                    custom={{ isOpen: imageState.current === 0 }}
                    exit="closed"
                    initial="closed"
                    key={`top-${topSongId || 'none'}`}
                    style={
                        {
                            backgroundImage: imageState.topImage
                                ? `url("${getBackgroundImageUrl(
                                      imageState.topImage,
                                      topSong?.id,
                                      topSong?.albumId,
                                  )}"), url("${imageState.topImage}")`
                                : undefined,
                        } as CSSProperties
                    }
                    variants={backgroundImageVariants}
                />
            )}

            {imageState.current === 1 && imageState.bottomImage && (
                <motion.div
                    animate="open"
                    className={styles.backgroundImage}
                    custom={{ isOpen: imageState.current === 1 }}
                    exit="closed"
                    initial="closed"
                    key={`bottom-${bottomSongId || 'none'}`}
                    style={
                        {
                            backgroundImage: imageState.bottomImage
                                ? `url("${getBackgroundImageUrl(
                                      imageState.bottomImage,
                                      bottomSong?.id,
                                      bottomSong?.albumId,
                                  )}"), url("${imageState.bottomImage}")`
                                : undefined,
                        } as CSSProperties
                    }
                    variants={backgroundImageVariants}
                />
            )}
        </AnimatePresence>
    );
});

BackgroundImage.displayName = 'BackgroundImage';

interface BackgroundImageOverlayProps {
    dynamicBackground: boolean | undefined;
    dynamicImageBlur: number | undefined;
}

const BackgroundImageOverlay = memo(
    ({ dynamicBackground, dynamicImageBlur }: BackgroundImageOverlayProps) => {
        if (!dynamicBackground) {
            return null;
        }

        return (
            <div
                className={styles.backgroundImageOverlay}
                style={
                    {
                        '--image-blur': `${dynamicImageBlur ?? 0}rem`,
                    } as CSSProperties
                }
            />
        );
    },
);

BackgroundImageOverlay.displayName = 'BackgroundImageOverlay';

interface ControlsProps {
    isPageHovered: boolean;
}

const Controls = ({ isPageHovered }: ControlsProps) => {
    const { t } = useTranslation();
    const {
        dynamicBackground,
        dynamicImageBlur,
        dynamicIsImage,
        expanded,
        opacity,
        useImageAspectRatio,
    } = useFullScreenPlayerStore();
    const { setStore } = useFullScreenPlayerStoreActions();
    const { setSettings } = useSettingsStoreActions();
    const lyricConfig = useLyricsSettings();

    const handleToggleFullScreenPlayer = () => {
        setStore({ expanded: !expanded });
    };

    const handleLyricsSettings = (property: string, value: any) => {
        setSettings({
            lyrics: {
                ...useSettingsStore.getState().lyrics,
                [property]: value,
            },
        });
    };

    useHotkeys([['Escape', handleToggleFullScreenPlayer]]);

    return (
        <Group
            gap="sm"
            p="1rem"
            pos="absolute"
            style={{
                background: `rgb(var(--theme-colors-background-transparent), ${opacity}%)`,
                left: 0,
                top: 0,
            }}
        >
            <ActionIcon
                icon="arrowDownS"
                iconProps={{ size: 'lg' }}
                onClick={handleToggleFullScreenPlayer}
                tooltip={{ label: t('common.minimize', { postProcess: 'titleCase' }) }}
                variant={isPageHovered ? 'default' : 'subtle'}
            />
            <Popover position="bottom-start">
                <Popover.Target>
                    <ActionIcon
                        icon="settings2"
                        iconProps={{ size: 'lg' }}
                        tooltip={{ label: t('common.configure', { postProcess: 'titleCase' }) }}
                        variant={isPageHovered ? 'default' : 'subtle'}
                    />
                </Popover.Target>
                <Popover.Dropdown>
                    <Option>
                        <Option.Label>
                            {t('page.fullscreenPlayer.config.dynamicBackground', {
                                postProcess: 'sentenceCase',
                            })}
                        </Option.Label>
                        <Option.Control>
                            <Switch
                                defaultChecked={dynamicBackground}
                                onChange={(e) =>
                                    setStore({
                                        dynamicBackground: e.target.checked,
                                    })
                                }
                            />
                        </Option.Control>
                    </Option>
                    {dynamicBackground && (
                        <Option>
                            <Option.Label>
                                {t('page.fullscreenPlayer.config.dynamicIsImage', {
                                    postProcess: 'sentenceCase',
                                })}
                            </Option.Label>
                            <Option.Control>
                                <Switch
                                    defaultChecked={dynamicIsImage}
                                    onChange={(e) =>
                                        setStore({
                                            dynamicIsImage: e.target.checked,
                                        })
                                    }
                                />
                            </Option.Control>
                        </Option>
                    )}
                    {dynamicBackground && dynamicIsImage && (
                        <Option>
                            <Option.Label>
                                {t('page.fullscreenPlayer.config.dynamicImageBlur', {
                                    postProcess: 'sentenceCase',
                                })}
                            </Option.Label>
                            <Option.Control>
                                <Slider
                                    defaultValue={dynamicImageBlur}
                                    label={(e) => `${e} rem`}
                                    max={6}
                                    min={0}
                                    onChangeEnd={(e) => setStore({ dynamicImageBlur: Number(e) })}
                                    step={0.5}
                                    w="100%"
                                />
                            </Option.Control>
                        </Option>
                    )}
                    {dynamicBackground && (
                        <Option>
                            <Option.Label>
                                {t('page.fullscreenPlayer.config.opacity', {
                                    postProcess: 'sentenceCase',
                                })}
                            </Option.Label>
                            <Option.Control>
                                <Slider
                                    defaultValue={opacity}
                                    label={(e) => `${e} %`}
                                    max={100}
                                    min={0}
                                    onChangeEnd={(e) => setStore({ opacity: Number(e) })}
                                    w="100%"
                                />
                            </Option.Control>
                        </Option>
                    )}
                    <Option>
                        <Option.Label>
                            {t('page.fullscreenPlayer.config.useImageAspectRatio', {
                                postProcess: 'sentenceCase',
                            })}
                        </Option.Label>
                        <Option.Control>
                            <Switch
                                checked={useImageAspectRatio}
                                onChange={(e) =>
                                    setStore({
                                        useImageAspectRatio: e.target.checked,
                                    })
                                }
                            />
                        </Option.Control>
                    </Option>
                    <Divider my="sm" />
                    <Option>
                        <Option.Label>
                            {t('page.fullscreenPlayer.config.followCurrentLyric', {
                                postProcess: 'sentenceCase',
                            })}
                        </Option.Label>
                        <Option.Control>
                            <Switch
                                checked={lyricConfig.follow}
                                onChange={(e) =>
                                    handleLyricsSettings('follow', e.currentTarget.checked)
                                }
                            />
                        </Option.Control>
                    </Option>
                    <Option>
                        <Option.Label>
                            {t('page.fullscreenPlayer.config.showLyricProvider', {
                                postProcess: 'sentenceCase',
                            })}
                        </Option.Label>
                        <Option.Control>
                            <Switch
                                checked={lyricConfig.showProvider}
                                onChange={(e) =>
                                    handleLyricsSettings('showProvider', e.currentTarget.checked)
                                }
                            />
                        </Option.Control>
                    </Option>
                    <Option>
                        <Option.Label>
                            {t('page.fullscreenPlayer.config.showLyricMatch', {
                                postProcess: 'sentenceCase',
                            })}
                        </Option.Label>
                        <Option.Control>
                            <Switch
                                checked={lyricConfig.showMatch}
                                onChange={(e) =>
                                    handleLyricsSettings('showMatch', e.currentTarget.checked)
                                }
                            />
                        </Option.Control>
                    </Option>
                    <Option>
                        <Option.Label>
                            {t('page.fullscreenPlayer.config.lyricSize', {
                                postProcess: 'sentenceCase',
                            })}
                        </Option.Label>
                        <Option.Control>
                            <Group w="100%" wrap="nowrap">
                                <Slider
                                    defaultValue={lyricConfig.fontSize}
                                    label={(e) =>
                                        `${t('page.fullscreenPlayer.config.synchronized', {
                                            postProcess: 'titleCase',
                                        })}: ${e}px`
                                    }
                                    max={72}
                                    min={8}
                                    onChangeEnd={(e) => handleLyricsSettings('fontSize', Number(e))}
                                    w="100%"
                                />
                                <Slider
                                    defaultValue={lyricConfig.fontSize}
                                    label={(e) =>
                                        `${t('page.fullscreenPlayer.config.unsynchronized', {
                                            postProcess: 'sentenceCase',
                                        })}: ${e}px`
                                    }
                                    max={72}
                                    min={8}
                                    onChangeEnd={(e) =>
                                        handleLyricsSettings('fontSizeUnsync', Number(e))
                                    }
                                    w="100%"
                                />
                            </Group>
                        </Option.Control>
                    </Option>
                    <Option>
                        <Option.Label>
                            {t('page.fullscreenPlayer.config.lyricGap', {
                                postProcess: 'sentenceCase',
                            })}
                        </Option.Label>
                        <Option.Control>
                            <Group w="100%" wrap="nowrap">
                                <Slider
                                    defaultValue={lyricConfig.gap}
                                    label={(e) => `Synchronized: ${e}px`}
                                    max={50}
                                    min={0}
                                    onChangeEnd={(e) => handleLyricsSettings('gap', Number(e))}
                                    w="100%"
                                />
                                <Slider
                                    defaultValue={lyricConfig.gap}
                                    label={(e) => `Unsynchronized: ${e}px`}
                                    max={50}
                                    min={0}
                                    onChangeEnd={(e) =>
                                        handleLyricsSettings('gapUnsync', Number(e))
                                    }
                                    w="100%"
                                />
                            </Group>
                        </Option.Control>
                    </Option>
                    <Option>
                        <Option.Label>
                            {t('page.fullscreenPlayer.config.lyricAlignment', {
                                postProcess: 'sentenceCase',
                            })}
                        </Option.Label>
                        <Option.Control>
                            <Select
                                data={[
                                    {
                                        label: t('common.left', {
                                            postProcess: 'titleCase',
                                        }),
                                        value: 'left',
                                    },
                                    {
                                        label: t('common.center', {
                                            postProcess: 'titleCase',
                                        }),
                                        value: 'center',
                                    },
                                    {
                                        label: t('common.right', {
                                            postProcess: 'titleCase',
                                        }),
                                        value: 'right',
                                    },
                                ]}
                                onChange={(e) => handleLyricsSettings('alignment', e)}
                                value={lyricConfig.alignment}
                            />
                        </Option.Control>
                    </Option>
                    <Option>
                        <Option.Label>
                            {t('page.fullscreenPlayer.config.lyricOffset', {
                                postProcess: 'sentenceCase',
                            })}
                        </Option.Label>
                        <Option.Control>
                            <NumberInput
                                defaultValue={lyricConfig.delayMs}
                                hideControls={false}
                                onBlur={(e) =>
                                    handleLyricsSettings('delayMs', Number(e.currentTarget.value))
                                }
                                step={10}
                            />
                        </Option.Control>
                    </Option>
                    <Divider my="sm" />
                </Popover.Dropdown>
            </Popover>
            <ListConfigMenu
                buttonProps={{
                    variant: isPageHovered ? 'default' : 'subtle',
                }}
                displayTypes={[{ hidden: true, value: ListDisplayType.GRID }]}
                listKey={ItemListKey.FULL_SCREEN}
                optionsConfig={{
                    table: {
                        itemsPerPage: { hidden: true },
                        pagination: { hidden: true },
                    },
                }}
                tableColumnsData={SONG_TABLE_COLUMNS}
            />
        </Group>
    );
};

const containerVariants: Variants = {
    closed: (custom) => {
        const { windowBarStyle } = custom;
        return {
            height:
                windowBarStyle === Platform.WINDOWS || windowBarStyle === Platform.MACOS
                    ? 'calc(100vh - 120px)'
                    : 'calc(100vh - 90px)',
            position: 'absolute',
            top: '100vh',
            transition: {
                duration: 0.5,
                ease: 'easeInOut',
            },
            width: '100vw',
            y: 0,
        };
    },
    open: (custom) => {
        const { background, dynamicBackground, windowBarStyle } = custom;
        return {
            backgroundColor: dynamicBackground ? background : mainBackground,
            height:
                windowBarStyle === Platform.WINDOWS || windowBarStyle === Platform.MACOS
                    ? 'calc(100vh - 120px)'
                    : 'calc(100vh - 90px)',
            left: 0,
            position: 'absolute',
            top: 0,
            transition: {
                delay: 0.1,
                duration: 0.5,
                ease: 'easeInOut',
            },
            width: '100vw',
            y: 0,
        };
    },
};

interface PlayerContainerProps {
    children: ReactNode;
    dynamicBackground: boolean | undefined;
    dynamicIsImage: boolean | undefined;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    windowBarStyle: Platform;
}

const PlayerContainer = memo(
    ({
        children,
        dynamicBackground,
        dynamicIsImage,
        onMouseEnter,
        onMouseLeave,
        windowBarStyle,
    }: PlayerContainerProps) => {
        const currentSong = usePlayerSong();
        const { background } = useFastAverageColor({
            algorithm: 'dominant',
            src: currentSong?.imageUrl,
            srcLoaded: true,
        });

        return (
            <motion.div
                animate="open"
                className={styles.container}
                custom={{ background, dynamicBackground, windowBarStyle }}
                exit="closed"
                initial="closed"
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                transition={{ duration: 2 }}
                variants={containerVariants}
            >
                <BackgroundImage
                    dynamicBackground={dynamicBackground}
                    dynamicIsImage={dynamicIsImage}
                />
                {children}
            </motion.div>
        );
    },
);

PlayerContainer.displayName = 'PlayerContainer';

export const FullScreenPlayer = () => {
    const { dynamicBackground, dynamicImageBlur, dynamicIsImage } = useFullScreenPlayerStore();
    const { setStore } = useFullScreenPlayerStoreActions();
    const { windowBarStyle } = useWindowSettings();

    const [isPageHovered, setIsPageHovered] = useState(false);

    const location = useLocation();
    const isOpenedRef = useRef<boolean | null>(null);

    useLayoutEffect(() => {
        if (isOpenedRef.current !== null) {
            setStore({ expanded: false });
        }

        isOpenedRef.current = true;
    }, [location, setStore]);

    return (
        <PlayerContainer
            dynamicBackground={dynamicBackground}
            dynamicIsImage={dynamicIsImage}
            onMouseEnter={() => setIsPageHovered(true)}
            onMouseLeave={() => setIsPageHovered(false)}
            windowBarStyle={windowBarStyle}
        >
            <Controls isPageHovered={isPageHovered} />
            <BackgroundImageOverlay
                dynamicBackground={dynamicBackground}
                dynamicImageBlur={dynamicImageBlur}
            />
            <div className={styles.responsiveContainer}>
                <FullScreenPlayerImage />
                <FullScreenPlayerQueue />
            </div>
        </PlayerContainer>
    );
};
