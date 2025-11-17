import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { ListConfigTable } from '/@/renderer/features/shared/components/list-config-menu';
import {
    usePlayerActions,
    usePlayerData,
    usePlayerProperties,
    usePlayerQueueType,
    usePlayerSpeed,
} from '/@/renderer/store';
import {
    usePlaybackSettings,
    useSettingsStore,
    useSettingsStoreActions,
} from '/@/renderer/store/settings.store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Popover } from '/@/shared/components/popover/popover';
import { SegmentedControl } from '/@/shared/components/segmented-control/segmented-control';
import { Slider } from '/@/shared/components/slider/slider';
import { Switch } from '/@/shared/components/switch/switch';
import { PlayerQueueType, PlayerStyle, PlayerType } from '/@/shared/types/types';

export const PlayerConfig = () => {
    const { t } = useTranslation();
    const { currentSong } = usePlayerData();
    const speed = usePlayerSpeed();
    const queueType = usePlayerQueueType();
    const { crossfadeDuration, transitionType } = usePlayerProperties();
    const { setCrossfadeDuration, setQueueType, setSpeed, setTransitionType } = usePlayerActions();
    const playbackSettings = usePlaybackSettings();
    const { setSettings } = useSettingsStoreActions();
    const speedPreservePitch = useSettingsStore((state) => state.playback.preservePitch);

    const options = useMemo(() => {
        const formatPlaybackSpeedSliderLabel = (value: number) => {
            const bpm = Number(currentSong?.bpm);
            if (bpm > 0) {
                return `${value} x / ${(bpm * value).toFixed(1)} BPM`;
            }
            return `${value} x`;
        };

        const allOptions = [
            {
                component: (
                    <SegmentedControl
                        data={[
                            {
                                label: t('player.queueType_default', { postProcess: 'titleCase' }),
                                value: PlayerQueueType.DEFAULT,
                            },
                            {
                                label: t('player.queueType_priority', { postProcess: 'titleCase' }),
                                value: PlayerQueueType.PRIORITY,
                            },
                        ]}
                        onChange={(value) => setQueueType(value as PlayerQueueType)}
                        size="sm"
                        value={queueType}
                        w="100%"
                    />
                ),
                id: 'queueType',
                label: t('player.queueType', { postProcess: 'sentenceCase' }),
            },

            ...(playbackSettings.type === PlayerType.WEB
                ? [
                      {
                          component: (
                              <SegmentedControl
                                  data={[
                                      {
                                          label: t('setting.playbackStyle', {
                                              context: 'optionNormal',
                                              postProcess: 'titleCase',
                                          }),
                                          value: PlayerStyle.GAPLESS,
                                      },
                                      {
                                          label: t('setting.playbackStyle', {
                                              context: 'optionCrossFade',
                                              postProcess: 'titleCase',
                                          }),
                                          value: PlayerStyle.CROSSFADE,
                                      },
                                  ]}
                                  onChange={(value) => setTransitionType(value as PlayerStyle)}
                                  size="sm"
                                  value={transitionType}
                                  w="100%"
                              />
                          ),
                          id: 'transitionType',
                          label: t('setting.playbackStyle', {
                              postProcess: 'sentenceCase',
                          }),
                      },
                  ]
                : []),

            ...(playbackSettings.type === PlayerType.WEB && transitionType === PlayerStyle.CROSSFADE
                ? [
                      {
                          component: (
                              <Slider
                                  defaultValue={crossfadeDuration}
                                  marks={[
                                      { label: '3', value: 3 },
                                      { label: '6', value: 6 },
                                      { label: '9', value: 9 },
                                      { label: '12', value: 12 },
                                      { label: '15', value: 15 },
                                  ]}
                                  max={15}
                                  min={3}
                                  onChangeEnd={setCrossfadeDuration}
                                  styles={{
                                      root: {},
                                  }}
                                  w="100%"
                              />
                          ),
                          id: 'crossfadeDuration',
                          label: t('setting.crossfadeDuration', {
                              postProcess: 'sentenceCase',
                          }),
                      },
                  ]
                : []),

            ...(playbackSettings.type === PlayerType.WEB
                ? [
                      {
                          component: (
                              <Switch
                                  defaultChecked={speedPreservePitch}
                                  onChange={(e) => {
                                      setSettings({
                                          playback: {
                                              ...playbackSettings,
                                              preservePitch: e.currentTarget.checked,
                                          },
                                      });
                                  }}
                              />
                          ),
                          id: 'preservePitch',
                          label: t('setting.preservePitch', {
                              postProcess: 'sentenceCase',
                          }),
                      },
                  ]
                : []),

            {
                component: (
                    <Slider
                        label={formatPlaybackSpeedSliderLabel}
                        marks={[
                            { label: '0.5', value: 0.5 },
                            { label: '0.75', value: 0.75 },
                            { label: '1', value: 1 },
                            { label: '1.25', value: 1.25 },
                            { label: '1.5', value: 1.5 },
                            { label: '1.75', value: 1.75 },
                            { label: '2', value: 2 },
                        ]}
                        max={2}
                        min={0.5}
                        onChange={setSpeed}
                        onDoubleClick={() => setSpeed(1)}
                        step={0.01}
                        styles={{
                            markLabel: {},
                            root: {},
                        }}
                        value={speed}
                        w="100%"
                    />
                ),
                id: 'playbackSpeed',
                label: t('player.playbackSpeed', { postProcess: 'sentenceCase' }),
            },
        ];

        return allOptions;
    }, [
        playbackSettings,
        speedPreservePitch,
        setSettings,
        currentSong,
        speed,
        setSpeed,
        queueType,
        setQueueType,
        transitionType,
        setTransitionType,
        crossfadeDuration,
        setCrossfadeDuration,
        t,
    ]);

    return (
        <Popover position="top-end" width={500} withArrow>
            <Popover.Target>
                <ActionIcon
                    icon="mediaSpeed"
                    iconProps={{
                        size: 'lg',
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                    size="sm"
                    tooltip={{
                        label: t('common.setting_other', { postProcess: 'titleCase' }),
                        openDelay: 0,
                    }}
                    variant="subtle"
                />
            </Popover.Target>
            <Popover.Dropdown p="md">
                <ListConfigTable options={options} />
            </Popover.Dropdown>
        </Popover>
    );
};
