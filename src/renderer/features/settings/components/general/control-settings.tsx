import { useTranslation } from 'react-i18next';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import {
    BarAlign,
    PlayerbarSliderType,
    useGeneralSettings,
    usePlayerbarSlider,
    useSettingsStoreActions,
} from '/@/renderer/store/settings.store';
import { Group } from '/@/shared/components/group/group';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { SegmentedControl } from '/@/shared/components/segmented-control/segmented-control';
import { Select } from '/@/shared/components/select/select';
import { Slider } from '/@/shared/components/slider/slider';
import { Switch } from '/@/shared/components/switch/switch';
import { Text } from '/@/shared/components/text/text';
import { Tooltip } from '/@/shared/components/tooltip/tooltip';
import { Play } from '/@/shared/types/types';

export const ControlSettings = () => {
    const { t } = useTranslation();
    const settings = useGeneralSettings();
    const playerbarSlider = usePlayerbarSlider();
    const { setSettings } = useSettingsStoreActions();

    const controlOptions: SettingOption[] = [
        {
            control: (
                <NumberInput
                    defaultValue={settings.buttonSize}
                    hideControls={false}
                    max={30}
                    min={15}
                    onBlur={(e) => {
                        if (!e) return;
                        const newVal = e.currentTarget.value
                            ? Math.min(Math.max(Number(e.currentTarget.value), 15), 30)
                            : settings.buttonSize;
                        setSettings({
                            general: {
                                ...settings,
                                buttonSize: newVal,
                            },
                        });
                    }}
                    width={75}
                />
            ),
            description: t('setting.buttonSize', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: false,
            title: t('setting.buttonSize', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Switch
                    aria-label="Toggle skip buttons"
                    defaultChecked={settings.skipButtons?.enabled}
                    onChange={(e) =>
                        setSettings({
                            general: {
                                ...settings,
                                skipButtons: {
                                    ...settings.skipButtons,
                                    enabled: e.currentTarget.checked,
                                },
                            },
                        })
                    }
                />
            ),
            description: t('setting.showSkipButtons', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: false,
            title: t('setting.showSkipButtons', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Group>
                    <Tooltip label={t('common.backward', { postProcess: 'titleCase' })}>
                        <NumberInput
                            defaultValue={settings.skipButtons.skipBackwardSeconds}
                            min={0}
                            onBlur={(e) =>
                                setSettings({
                                    general: {
                                        ...settings,
                                        skipButtons: {
                                            ...settings.skipButtons,
                                            skipBackwardSeconds: e.currentTarget.value
                                                ? Number(e.currentTarget.value)
                                                : 0,
                                        },
                                    },
                                })
                            }
                            width={75}
                        />
                    </Tooltip>
                    <Tooltip label={t('common.forward', { postProcess: 'titleCase' })}>
                        <NumberInput
                            defaultValue={settings.skipButtons.skipForwardSeconds}
                            min={0}
                            onBlur={(e) =>
                                setSettings({
                                    general: {
                                        ...settings,
                                        skipButtons: {
                                            ...settings.skipButtons,
                                            skipForwardSeconds: e.currentTarget.value
                                                ? Number(e.currentTarget.value)
                                                : 0,
                                        },
                                    },
                                })
                            }
                            width={75}
                        />
                    </Tooltip>
                </Group>
            ),
            description: t('setting.skipDuration', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: false,
            title: t('setting.skipDuration', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Select
                    data={[
                        {
                            label: t('setting.playButtonBehavior', {
                                context: 'optionPlay',
                                postProcess: 'titleCase',
                            }),
                            value: Play.NOW,
                        },
                        {
                            label: t('setting.playButtonBehavior', {
                                context: 'optionAddNext',
                                postProcess: 'titleCase',
                            }),
                            value: Play.NEXT,
                        },
                        {
                            label: t('setting.playButtonBehavior', {
                                context: 'optionAddLast',
                                postProcess: 'titleCase',
                            }),
                            value: Play.LAST,
                        },
                        {
                            label: t('setting.playButtonBehavior', {
                                context: 'optionPlayShuffled',
                                postProcess: 'titleCase',
                            }),
                            value: Play.SHUFFLE,
                        },
                    ]}
                    defaultValue={settings.playButtonBehavior}
                    onChange={(e) =>
                        setSettings({
                            general: {
                                ...settings,
                                playButtonBehavior: e as Play,
                            },
                        })
                    }
                />
            ),
            description: t('setting.playButtonBehavior', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: false,
            title: t('setting.playButtonBehavior', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Switch
                    aria-label="Follow current song"
                    defaultChecked={settings.followCurrentSong}
                    onChange={(e) =>
                        setSettings({
                            general: {
                                ...settings,
                                followCurrentSong: e.currentTarget.checked,
                            },
                        })
                    }
                />
            ),
            description: t('setting.followCurrentSong', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: false,
            title: t('setting.followCurrentSong', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <NumberInput
                    defaultValue={settings.artistRadioCount}
                    max={200}
                    min={10}
                    onBlur={(e) => {
                        if (!e) return;
                        const newVal = e.currentTarget.value
                            ? Math.min(Math.max(Number(e.currentTarget.value), 10), 100)
                            : settings.artistRadioCount;
                        setSettings({
                            general: {
                                ...settings,
                                artistRadioCount: newVal,
                            },
                        });
                    }}
                    width={75}
                />
            ),
            description: t('setting.artistRadioCount', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: false,
            title: t('setting.artistRadioCount', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Slider
                    defaultValue={settings.volumeWheelStep}
                    max={20}
                    min={1}
                    onChangeEnd={(e) => {
                        setSettings({
                            general: {
                                ...settings,
                                volumeWheelStep: e,
                            },
                        });
                    }}
                    w={100}
                />
            ),
            description: t('setting.volumeWheelStep', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: false,
            title: t('setting.volumeWheelStep', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <NumberInput
                    defaultValue={settings.volumeWidth}
                    max={180}
                    min={30}
                    onBlur={(e) => {
                        setSettings({
                            general: { ...settings, volumeWidth: Number(e.currentTarget.value) },
                        });
                    }}
                    placeholder="0"
                    rightSection={<Text size="sm">px</Text>}
                    width={75}
                />
            ),
            description: t('setting.volumeWidth', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: false,
            title: t('setting.volumeWidth', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <SegmentedControl
                    data={[
                        {
                            label: t('setting.playerbarSliderType', {
                                context: 'optionSlider',
                                postProcess: 'titleCase',
                            }),
                            value: PlayerbarSliderType.SLIDER,
                        },
                        {
                            label: t('setting.playerbarSliderType', {
                                context: 'optionWaveform',
                                postProcess: 'titleCase',
                            }),
                            value: PlayerbarSliderType.WAVEFORM,
                        },
                    ]}
                    onChange={(value) => {
                        setSettings({
                            general: {
                                ...settings,
                                playerbarSlider: {
                                    ...playerbarSlider,
                                    type: value as PlayerbarSliderType,
                                },
                            },
                        });
                    }}
                    size="sm"
                    value={playerbarSlider?.type || PlayerbarSliderType.WAVEFORM}
                    w="100%"
                />
            ),
            description: t('setting.playerbarSlider', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: false,
            title: t('setting.playerbarSlider', { postProcess: 'sentenceCase' }),
        },
        ...(playerbarSlider?.type === PlayerbarSliderType.WAVEFORM
            ? [
                  {
                      control: (
                          <SegmentedControl
                              data={[
                                  {
                                      label: t('setting.playerbarWaveformAlign', {
                                          context: 'optionTop',
                                          postProcess: 'titleCase',
                                      }),
                                      value: BarAlign.TOP,
                                  },
                                  {
                                      label: t('setting.playerbarWaveformAlign', {
                                          context: 'optionCenter',
                                          postProcess: 'titleCase',
                                      }),
                                      value: BarAlign.CENTER,
                                  },
                                  {
                                      label: t('setting.playerbarWaveformAlign', {
                                          context: 'optionBottom',
                                          postProcess: 'titleCase',
                                      }),
                                      value: BarAlign.BOTTOM,
                                  },
                              ]}
                              onChange={(value) => {
                                  setSettings({
                                      general: {
                                          ...settings,
                                          playerbarSlider: {
                                              ...playerbarSlider,
                                              barAlign: (value as BarAlign) || BarAlign.CENTER,
                                          },
                                      },
                                  });
                              }}
                              size="sm"
                              value={playerbarSlider?.barAlign || BarAlign.CENTER}
                              w="100%"
                          />
                      ),
                      description: t('setting.playerbarWaveformAlign', {
                          context: 'description',
                          postProcess: 'sentenceCase',
                      }),
                      isHidden: false,
                      title: t('setting.playerbarWaveformAlign', {
                          postProcess: 'sentenceCase',
                      }),
                  },
                  {
                      control: (
                          <Slider
                              defaultValue={playerbarSlider?.barWidth ?? 2}
                              max={10}
                              min={0}
                              onChangeEnd={(value) => {
                                  setSettings({
                                      general: {
                                          ...settings,
                                          playerbarSlider: {
                                              ...playerbarSlider,
                                              barWidth: value,
                                          },
                                      },
                                  });
                              }}
                              step={1}
                              styles={{
                                  root: {},
                              }}
                              w="120px"
                          />
                      ),
                      description: t('setting.playerbarWaveformBarWidth', {
                          context: 'description',
                          postProcess: 'sentenceCase',
                      }),
                      isHidden: false,
                      title: t('setting.playerbarWaveformBarWidth', {
                          postProcess: 'sentenceCase',
                      }),
                  },
                  {
                      control: (
                          <Slider
                              defaultValue={playerbarSlider?.barGap || 0}
                              max={10}
                              min={0}
                              onChangeEnd={(value) => {
                                  setSettings({
                                      general: {
                                          ...settings,
                                          playerbarSlider: {
                                              ...playerbarSlider,
                                              barGap: value,
                                          },
                                      },
                                  });
                              }}
                              step={1}
                              styles={{
                                  root: {},
                              }}
                              w="120px"
                          />
                      ),
                      description: t('setting.playerbarWaveformGap', {
                          context: 'description',
                          postProcess: 'sentenceCase',
                      }),
                      isHidden: false,
                      title: t('setting.playerbarWaveformGap', {
                          postProcess: 'sentenceCase',
                      }),
                  },
                  {
                      control: (
                          <Slider
                              defaultValue={playerbarSlider?.barRadius ?? 4}
                              max={20}
                              min={0}
                              onChangeEnd={(value) => {
                                  setSettings({
                                      general: {
                                          ...settings,
                                          playerbarSlider: {
                                              ...playerbarSlider,
                                              barRadius: value,
                                          },
                                      },
                                  });
                              }}
                              step={1}
                              styles={{
                                  root: {},
                              }}
                              w="120px"
                          />
                      ),
                      description: t('setting.playerbarWaveformRadius', {
                          context: 'description',
                          postProcess: 'sentenceCase',
                      }),
                      isHidden: false,
                      title: t('setting.playerbarWaveformRadius', {
                          postProcess: 'sentenceCase',
                      }),
                  },
              ]
            : []),
    ];

    return (
        <SettingsSection
            options={controlOptions}
            title={t('page.setting.controls', { postProcess: 'sentenceCase' })}
        />
    );
};
