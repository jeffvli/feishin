import { useHotkeys } from '@mantine/hooks';
import { motion, Variants } from 'motion/react';
import { CSSProperties, useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';

import styles from './full-screen-player.module.css';

import { TableConfigDropdown } from '/@/renderer/components/virtual-table';
import { FullScreenPlayerImage } from '/@/renderer/features/player/components/full-screen-player-image';
import { FullScreenPlayerQueue } from '/@/renderer/features/player/components/full-screen-player-queue';
import { useFastAverageColor } from '/@/renderer/hooks';
import {
    useCurrentSong,
    useFullScreenPlayerStore,
    useFullScreenPlayerStoreActions,
    useLyricsSettings,
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
import { Platform } from '/@/shared/types/types';

const mainBackground = 'var(--theme-colors-background)';

const Controls = () => {
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
                variant="subtle"
            />
            <Popover position="bottom-start">
                <Popover.Target>
                    <ActionIcon
                        icon="settings"
                        iconProps={{ size: 'lg' }}
                        tooltip={{ label: t('common.configure', { postProcess: 'titleCase' }) }}
                        variant="subtle"
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
                            <Group
                                w="100%"
                                wrap="nowrap"
                            >
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
                            <Group
                                w="100%"
                                wrap="nowrap"
                            >
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
                    <TableConfigDropdown type="fullScreen" />
                </Popover.Dropdown>
            </Popover>
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
            y: -100,
        };
    },
    open: (custom) => {
        const { background, backgroundImage, dynamicBackground, windowBarStyle } = custom;
        return {
            background: dynamicBackground ? backgroundImage : mainBackground,
            backgroundColor: dynamicBackground ? background : mainBackground,
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            height:
                windowBarStyle === Platform.WINDOWS || windowBarStyle === Platform.MACOS
                    ? 'calc(100vh - 120px)'
                    : 'calc(100vh - 90px)',
            left: 0,
            position: 'absolute',
            top: 0,
            transition: {
                background: {
                    duration: 0.5,
                    ease: 'easeInOut',
                },
                delay: 0.1,
                duration: 0.5,
                ease: 'easeInOut',
            },
            width: '100vw',
            y: 0,
        };
    },
};

export const FullScreenPlayer = () => {
    const { dynamicBackground, dynamicImageBlur, dynamicIsImage } = useFullScreenPlayerStore();
    const { setStore } = useFullScreenPlayerStoreActions();
    const { windowBarStyle } = useWindowSettings();

    const location = useLocation();
    const isOpenedRef = useRef<boolean | null>(null);

    useLayoutEffect(() => {
        if (isOpenedRef.current !== null) {
            setStore({ expanded: false });
        }

        isOpenedRef.current = true;
    }, [location, setStore]);

    const currentSong = useCurrentSong();
    const { background } = useFastAverageColor({
        algorithm: 'dominant',
        src: currentSong?.imageUrl,
        srcLoaded: true,
    });

    const imageUrl = currentSong?.imageUrl && currentSong.imageUrl.replace(/size=\d+/g, 'size=500');
    const backgroundImage =
        imageUrl && dynamicIsImage
            ? `url("${imageUrl.replace(currentSong.id, currentSong.albumId)}"), url("${imageUrl}")`
            : mainBackground;

    return (
        <motion.div
            animate="open"
            className={styles.container}
            custom={{ background, backgroundImage, dynamicBackground, windowBarStyle }}
            exit="closed"
            initial="closed"
            transition={{ duration: 2 }}
            variants={containerVariants}
        >
            <Controls />
            {dynamicBackground && (
                <div
                    className={styles.backgroundImageOverlay}
                    style={
                        {
                            '--image-blur': `${dynamicImageBlur}`,
                        } as CSSProperties
                    }
                />
            )}
            <div className={styles.responsiveContainer}>
                <FullScreenPlayerImage />
                <FullScreenPlayerQueue />
            </div>
        </motion.div>
    );
};
