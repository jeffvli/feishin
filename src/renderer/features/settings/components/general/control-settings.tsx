import { memo } from 'react';
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

export const ControlSettings = memo(() => {
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
            }),
            isHidden: false,
            title: t('setting.buttonSize'),
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
            }),
            isHidden: false,
            title: t('setting.showSkipButtons'),
        },
        {
            control: (
                <Group>
                    <Tooltip label={t('common.backward')}>
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
                    <Tooltip label={t('common.forward')}>
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
            }),
            isHidden: false,
            title: t('setting.skipDuration'),
        },
        {
            control: (
                <Select
                    data={[
                        {
                            label: t('setting.playButtonBehavior', {
                                context: 'optionPlay',
                            }),
                            value: Play.NOW,
                        },
                        {
                            label: t('setting.playButtonBehavior', {
                                context: 'optionAddNext',
                            }),
                            value: Play.NEXT,
                        },
                        {
                            label: t('setting.playButtonBehavior', {
                                context: 'optionAddLast',
                            }),
                            value: Play.LAST,
                        },
                        {
                            label: t('setting.playButtonBehavior', {
                                context: 'optionPlayShuffled',
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
            }),
            isHidden: false,
            title: t('setting.playButtonBehavior'),
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
            }),
            isHidden: false,
            title: t('setting.followCurrentSong'),
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
            }),
            isHidden: false,
            title: t('setting.artistRadioCount'),
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
            }),
            isHidden: false,
            title: t('setting.volumeWheelStep'),
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
            }),
            isHidden: false,
            title: t('setting.volumeWidth'),
        },
        {
            control: (
                <SegmentedControl
                    data={[
                        {
                            label: t('setting.playerbarSliderType', {
                                context: 'optionSlider',
                            }),
                            value: PlayerbarSliderType.SLIDER,
                        },
                        {
                            label: t('setting.playerbarSliderType', {
                                context: 'optionWaveform',
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
            }),
            isHidden: false,
            title: t('setting.playerbarSlider'),
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
                                      }),
                                      value: BarAlign.TOP,
                                  },
                                  {
                                      label: t('setting.playerbarWaveformAlign', {
                                          context: 'optionCenter',
                                      }),
                                      value: BarAlign.CENTER,
                                  },
                                  {
                                      label: t('setting.playerbarWaveformAlign', {
                                          context: 'optionBottom',
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
                      }),
                      isHidden: false,
                      title: t('setting.playerbarWaveformAlign'),
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
                      }),
                      isHidden: false,
                      title: t('setting.playerbarWaveformBarWidth'),
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
                      }),
                      isHidden: false,
                      title: t('setting.playerbarWaveformGap'),
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
                      }),
                      isHidden: false,
                      title: t('setting.playerbarWaveformRadius'),
                  },
                  {
                      control: (
                          <Switch
                              defaultChecked={playerbarSlider?.stretched ?? false}
                              onChange={(e) =>
                                  setSettings({
                                      general: {
                                          ...settings,
                                          playerbarSlider: {
                                              ...playerbarSlider,
                                              stretched: e.currentTarget.checked,
                                          },
                                      },
                                  })
                              }
                          />
                      ),
                      description: t('setting.playerbarWaveformStretch', {
                          context: 'description',
                      }),
                      isHidden: false,
                      title: t('setting.playerbarWaveformStretch'),
                  },
                  {
                      control: (
                          <NumberInput
                              defaultValue={playerbarSlider?.loadingDelay ?? 2}
                              max={30}
                              min={0}
                              onBlur={(e) => {
                                  setSettings({
                                      general: {
                                          ...settings,
                                          playerbarSlider: {
                                              ...playerbarSlider,
                                              loadingDelay: e.currentTarget.value
                                                  ? Number(e.currentTarget.value)
                                                  : 2,
                                          },
                                      },
                                  });
                              }}
                              rightSection={<Text size="sm">s</Text>}
                              width={75}
                          />
                      ),
                      description: t('setting.waveformLoadingDelay', {
                          context: 'description',
                      }),
                      isHidden: false,
                      title: t('setting.waveformLoadingDelay'),
                  },
              ]
            : []),
        {
            control: (
                <Switch
                    defaultChecked={settings.microtonalPitchControls}
                    onChange={(e) =>
                        setSettings({
                            general: {
                                ...settings,
                                microtonalPitchControls: e.currentTarget.checked,
                            },
                        })
                    }
                />
            ),
            description: t('setting.microtonalPitchControls', {
                context: 'description',
            }),
            isHidden: false,
            title: t('setting.microtonalPitchControls'),
        },
    ];

    return <SettingsSection options={controlOptions} title={t('page.setting.controls')} />;
});
