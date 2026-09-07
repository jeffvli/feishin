import { useTranslation } from 'react-i18next';

import { SONG_TABLE_COLUMNS } from '/@/renderer/components/item-list/item-table-list/default-columns';
import { FullscreenPlayerSettings } from '/@/renderer/features/settings/components/general/fullscreen-player-settings';
import {
    ListConfigMenu,
    SONG_DISPLAY_TYPES,
} from '/@/renderer/features/shared/components/list-config-menu';
import { useHotkeys } from '/@/renderer/hooks/use-hotkeys';
import {
    PlayerItem,
    useFullScreenPlayerStore,
    useFullScreenPlayerStoreActions,
    useGeneralSettings,
    useLyricsDisplaySettings,
    useLyricsSettings,
    useSettingsStore,
    useSettingsStoreActions,
} from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { Option } from '/@/shared/components/option/option';
import { Popover } from '/@/shared/components/popover/popover';
import { SegmentedControl } from '/@/shared/components/segmented-control/segmented-control';
import { Select } from '/@/shared/components/select/select';
import { Slider } from '/@/shared/components/slider/slider';
import { Switch } from '/@/shared/components/switch/switch';
import { ItemListKey, ListDisplayType } from '/@/shared/types/types';

export const SharedFullscreenPlayerSettings = () => {
    const { t } = useTranslation();
    const {
        coverArtSize,
        dynamicBackground,
        dynamicImageBlur,
        dynamicIsImage,
        expanded,
        opacity,
        playerItemAlignment,
        titleDisplayType,
        titleLineCount,
        useImageAspectRatio,
    } = useFullScreenPlayerStore();
    const { setStore } = useFullScreenPlayerStoreActions();
    const { setSettings } = useSettingsStoreActions();
    const { playerItems } = useGeneralSettings();
    const lyricsSettings = useLyricsSettings();
    const displaySettings = useLyricsDisplaySettings('default');
    const lyricConfig = { ...lyricsSettings, ...displaySettings };

    const isTitleEnabled = !playerItems.find((item) => item.id === PlayerItem.TITLE)?.disabled;

    const handleToggleFullScreenPlayer = () => {
        setStore({
            expanded: !expanded,
            visualizerExpanded: false,
            visualizerReturnToPlayer: false,
        });
    };

    const handleLyricsSettings = (property: string, value: any) => {
        const displayProperties = [
            'fontSize',
            'fontSizeUnsync',
            'gap',
            'gapUnsync',
            'paddingLeft',
            'paddingRight',
        ];
        if (displayProperties.includes(property)) {
            const currentDisplay = useSettingsStore.getState().lyricsDisplay;
            setSettings({
                lyricsDisplay: {
                    ...currentDisplay,
                    default: {
                        ...currentDisplay.default,
                        [property]: value,
                    },
                },
            });
        } else {
            setSettings({
                lyrics: {
                    ...useSettingsStore.getState().lyrics,
                    [property]: value,
                },
            });
        }
    };

    useHotkeys([['Escape', handleToggleFullScreenPlayer]]);

    return (
        <>
            <ActionIcon
                icon="arrowDownS"
                iconProps={{ size: 'lg' }}
                onClick={handleToggleFullScreenPlayer}
                tooltip={{ label: t('common.minimize') }}
                variant="subtle"
            />
            <Popover position="bottom-start">
                <Popover.Target>
                    <ActionIcon
                        icon="settings2"
                        iconProps={{ size: 'lg' }}
                        tooltip={{ label: t('common.configure') }}
                        variant="subtle"
                    />
                </Popover.Target>
                <Popover.Dropdown>
                    <Option>
                        <Option.Label>
                            {t('page.fullscreenPlayer.config.dynamicBackground')}
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
                                {t('page.fullscreenPlayer.config.dynamicIsImage')}
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
                                {t('page.fullscreenPlayer.config.dynamicImageBlur')}
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
                            <Option.Label>{t('page.fullscreenPlayer.config.opacity')}</Option.Label>
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
                            {t('page.fullscreenPlayer.config.useImageAspectRatio')}
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
                            {t('page.fullscreenPlayer.config.coverArtSize')}
                        </Option.Label>
                        <Option.Control>
                            <Slider
                                defaultValue={coverArtSize}
                                label={null}
                                max={100}
                                min={55}
                                onChangeEnd={(e) => setStore({ coverArtSize: Number(e) })}
                                w="100%"
                            />
                        </Option.Control>
                    </Option>
                    <Option>
                        <Option.Label>
                            {t('page.fullscreenPlayer.config.playerItemAlignment')}
                        </Option.Label>
                        <Option.Control>
                            <SegmentedControl
                                data={[
                                    {
                                        label: t('common.left'),
                                        value: 'left',
                                    },
                                    {
                                        label: t('common.center'),
                                        value: 'center',
                                    },
                                    {
                                        label: t('common.right'),
                                        value: 'right',
                                    },
                                ]}
                                onChange={(value) =>
                                    setStore({
                                        playerItemAlignment: value as 'center' | 'left' | 'right',
                                    })
                                }
                                value={playerItemAlignment}
                            />
                        </Option.Control>
                    </Option>
                    <Option>
                        <Option.Control>
                            <div style={{ width: '100%' }}>
                                <FullscreenPlayerSettings showDescription={false} />
                            </div>
                        </Option.Control>
                    </Option>
                    {isTitleEnabled && (
                        <Option>
                            <Option.Label>
                                {t('page.fullscreenPlayer.config.titleDisplayType')}
                            </Option.Label>
                            <Option.Control>
                                <Select
                                    comboboxProps={{ withinPortal: false }}
                                    data={[
                                        {
                                            label: t(
                                                'page.fullscreenPlayer.config.titleDisplayType',
                                                {
                                                    context: 'optionMultiLine',
                                                },
                                            ),
                                            value: 'multiLine',
                                        },
                                        {
                                            label: t(
                                                'page.fullscreenPlayer.config.titleDisplayType',
                                                {
                                                    context: 'optionScroll',
                                                },
                                            ),
                                            value: 'scroll',
                                        },
                                    ]}
                                    onChange={(value) =>
                                        setStore({
                                            titleDisplayType: value as 'multiLine' | 'scroll',
                                        })
                                    }
                                    value={titleDisplayType}
                                />
                            </Option.Control>
                        </Option>
                    )}
                    {isTitleEnabled && titleDisplayType === 'multiLine' && (
                        <Option>
                            <Option.Label>
                                {t('page.fullscreenPlayer.config.titleLineCount')}
                            </Option.Label>
                            <Option.Control>
                                <NumberInput
                                    defaultValue={titleLineCount}
                                    hideControls={false}
                                    max={10}
                                    min={1}
                                    onBlur={(e) =>
                                        setStore({
                                            titleLineCount: Number(e.currentTarget.value),
                                        })
                                    }
                                    step={1}
                                />
                            </Option.Control>
                        </Option>
                    )}
                    <Divider my="sm" />
                    <Option>
                        <Option.Label>
                            {t('page.fullscreenPlayer.config.followCurrentLyric')}
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
                            {t('page.fullscreenPlayer.config.showLyricProvider')}
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
                            {t('page.fullscreenPlayer.config.showLyricMatch')}
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
                        <Option.Label>{t('page.fullscreenPlayer.config.lyricSize')}</Option.Label>
                        <Option.Control>
                            <Group w="100%" wrap="nowrap">
                                <Slider
                                    defaultValue={lyricConfig.fontSize}
                                    label={(e) =>
                                        `${t('page.fullscreenPlayer.config.synchronized')}: ${e}px`
                                    }
                                    max={72}
                                    min={8}
                                    onChangeEnd={(e) => handleLyricsSettings('fontSize', Number(e))}
                                    w="100%"
                                />
                                <Slider
                                    defaultValue={lyricConfig.fontSize}
                                    label={(e) =>
                                        `${t('page.fullscreenPlayer.config.unsynchronized')}: ${e}px`
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
                        <Option.Label>{t('page.fullscreenPlayer.config.lyricGap')}</Option.Label>
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
                            {t('page.fullscreenPlayer.config.lyricPaddingLeft')}
                        </Option.Label>
                        <Option.Control>
                            <Slider
                                defaultValue={lyricConfig.paddingLeft ?? 0}
                                label={(value) => `${value}%`}
                                max={20}
                                min={0}
                                onChangeEnd={(value) => handleLyricsSettings('paddingLeft', value)}
                                step={1}
                                w="100%"
                            />
                        </Option.Control>
                    </Option>
                    <Option>
                        <Option.Label>
                            {t('page.fullscreenPlayer.config.lyricPaddingRight')}
                        </Option.Label>
                        <Option.Control>
                            <Slider
                                defaultValue={lyricConfig.paddingRight ?? 0}
                                label={(value) => `${value}%`}
                                max={20}
                                min={0}
                                onChangeEnd={(value) => handleLyricsSettings('paddingRight', value)}
                                step={1}
                                w="100%"
                            />
                        </Option.Control>
                    </Option>
                    <Option>
                        <Option.Label>
                            {t('page.fullscreenPlayer.config.lyricAlignment')}
                        </Option.Label>
                        <Option.Control>
                            <SegmentedControl
                                data={[
                                    {
                                        label: t('common.left'),
                                        value: 'left',
                                    },
                                    {
                                        label: t('common.center'),
                                        value: 'center',
                                    },
                                    {
                                        label: t('common.right'),
                                        value: 'right',
                                    },
                                ]}
                                onChange={(e) => handleLyricsSettings('alignment', e)}
                                value={lyricConfig.alignment}
                            />
                        </Option.Control>
                    </Option>
                    <Option>
                        <Option.Label>{t('page.fullscreenPlayer.config.lyricOffset')}</Option.Label>
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
                </Popover.Dropdown>
            </Popover>
            <ListConfigMenu
                buttonProps={{
                    variant: 'subtle',
                }}
                displayTypes={[
                    { hidden: true, value: ListDisplayType.GRID },
                    ...SONG_DISPLAY_TYPES,
                ]}
                listKey={ItemListKey.FULL_SCREEN}
                optionsConfig={{
                    table: {
                        itemsPerPage: { hidden: true },
                        pagination: { hidden: true },
                    },
                }}
                tableColumnsData={SONG_TABLE_COLUMNS}
            />
        </>
    );
};
