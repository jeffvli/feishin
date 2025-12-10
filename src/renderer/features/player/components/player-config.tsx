import isElectron from 'is-electron';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ListConfigTable } from '/@/renderer/features/shared/components/list-config-menu';
import {
    usePlayerActions,
    usePlayerData,
    usePlayerProperties,
    usePlayerQueueType,
    usePlayerSpeed,
    usePlayerStatus,
} from '/@/renderer/store';
import {
    usePlaybackSettings,
    useSettingsStore,
    useSettingsStoreActions,
} from '/@/renderer/store/settings.store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Popover } from '/@/shared/components/popover/popover';
import { SegmentedControl } from '/@/shared/components/segmented-control/segmented-control';
import { Select } from '/@/shared/components/select/select';
import { Slider } from '/@/shared/components/slider/slider';
import { Switch } from '/@/shared/components/switch/switch';
import { toast } from '/@/shared/components/toast/toast';
import {
    CrossfadeStyle,
    PlayerQueueType,
    PlayerStatus,
    PlayerStyle,
    PlayerType,
} from '/@/shared/types/types';

const ipc = isElectron() ? window.api.ipc : null;

const getAudioDevice = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return (devices || []).filter((dev: MediaDeviceInfo) => dev.kind === 'audiooutput');
};

export const PlayerConfig = () => {
    const { t } = useTranslation();
    const { currentSong } = usePlayerData();
    const speed = usePlayerSpeed();
    const queueType = usePlayerQueueType();
    const status = usePlayerStatus();
    const { crossfadeDuration, crossfadeStyle, transitionType } = usePlayerProperties();
    const { setCrossfadeDuration, setCrossfadeStyle, setQueueType, setSpeed, setTransitionType } =
        usePlayerActions();
    const preservePitch = useSettingsStore((state) => state.playback.preservePitch);

    const playbackSettings = usePlaybackSettings();
    const { setSettings } = useSettingsStoreActions();

    const setPreservePitch = useCallback(
        (value: boolean) => {
            setSettings({
                playback: { ...playbackSettings, preservePitch: value },
            });
        },
        [playbackSettings, setSettings],
    );

    const [audioDevices, setAudioDevices] = useState<{ label: string; value: string }[]>([]);

    useEffect(() => {
        const fetchAudioDevices = () => {
            getAudioDevice()
                .then((dev) =>
                    setAudioDevices(dev.map((d) => ({ label: d.label, value: d.deviceId }))),
                )
                .catch(() =>
                    toast.error({
                        message: t('error.audioDeviceFetchError', { postProcess: 'sentenceCase' }),
                    }),
                );
        };

        if (playbackSettings.type === PlayerType.WEB) {
            fetchAudioDevices();
        }
    }, [playbackSettings.type, t]);

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
                label: t('player.queueType', { postProcess: 'titleCase' }),
            },
            {
                component: null,
                id: 'divider-0',
                isDivider: true,
                label: '',
            },
            {
                component: (
                    <Select
                        comboboxProps={{ withinPortal: false }}
                        data={[
                            {
                                disabled: !isElectron(),
                                label: 'MPV',
                                value: PlayerType.LOCAL,
                            },
                            { label: 'Web', value: PlayerType.WEB },
                        ]}
                        defaultValue={playbackSettings.type}
                        disabled={status === PlayerStatus.PLAYING}
                        onChange={(e) => {
                            setSettings({
                                playback: { ...playbackSettings, type: e as PlayerType },
                            });
                            ipc?.send('settings-set', {
                                property: 'playbackType',
                                value: e,
                            });
                        }}
                        width="100%"
                    />
                ),
                id: 'audioPlayerType',
                label: t('setting.audioPlayer', { postProcess: 'titleCase' }),
            },
            {
                component: (
                    <Select
                        clearable
                        comboboxProps={{ withinPortal: false }}
                        data={audioDevices}
                        defaultValue={playbackSettings.audioDeviceId}
                        disabled={playbackSettings.type !== PlayerType.WEB}
                        onChange={(e) =>
                            setSettings({
                                playback: {
                                    ...playbackSettings,
                                    audioDeviceId: e,
                                },
                            })
                        }
                        width="100%"
                    />
                ),
                id: 'audioDevice',
                label: t('setting.audioDevice', { postProcess: 'titleCase' }),
            },
            {
                component: null,
                id: 'divider-1',
                isDivider: true,
                label: '',
            },
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
                        disabled={
                            playbackSettings.type !== PlayerType.WEB ||
                            status === PlayerStatus.PLAYING
                        }
                        onChange={(value) => setTransitionType(value as PlayerStyle)}
                        size="sm"
                        value={transitionType}
                        w="100%"
                    />
                ),
                id: 'transitionType',
                label: t('setting.playbackStyle', {
                    postProcess: 'titleCase',
                }),
            },
            {
                component: (
                    <Select
                        comboboxProps={{ withinPortal: false }}
                        data={[
                            { label: 'Linear', value: CrossfadeStyle.LINEAR },
                            { label: 'Equal Power', value: CrossfadeStyle.EQUAL_POWER },
                            { label: 'S-Curve', value: CrossfadeStyle.S_CURVE },
                            { label: 'Exponential', value: CrossfadeStyle.EXPONENTIAL },
                        ]}
                        defaultValue={crossfadeStyle}
                        disabled={
                            playbackSettings.type !== PlayerType.WEB ||
                            transitionType !== PlayerStyle.CROSSFADE ||
                            status === PlayerStatus.PLAYING
                        }
                        onChange={(e) => {
                            if (e) {
                                setCrossfadeStyle(e as CrossfadeStyle);
                            }
                        }}
                        width="100%"
                    />
                ),
                id: 'crossfadeStyle',
                label: t('setting.crossfadeStyle', {
                    postProcess: 'titleCase',
                }),
            },
            {
                component: (
                    <Slider
                        defaultValue={crossfadeDuration}
                        disabled={
                            playbackSettings.type !== PlayerType.WEB ||
                            transitionType !== PlayerStyle.CROSSFADE ||
                            status === PlayerStatus.PLAYING
                        }
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
                    postProcess: 'titleCase',
                }),
            },
            {
                component: null,
                id: 'divider-2',
                isDivider: true,
                label: '',
            },
            {
                component: (
                    <Slider
                        defaultValue={speed}
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
                        onChangeEnd={setSpeed}
                        onDoubleClick={() => setSpeed(1)}
                        step={0.01}
                        styles={{
                            markLabel: {},
                            root: {},
                        }}
                        w="100%"
                    />
                ),
                id: 'playbackSpeed',
                label: t('player.playbackSpeed', { postProcess: 'titleCase' }),
            },
            {
                component: (
                    <Switch
                        defaultChecked={preservePitch}
                        onChange={(e) => setPreservePitch(e.currentTarget.checked)}
                    />
                ),
                id: 'preservePitch',
                label: t('setting.preservePitch', { postProcess: 'titleCase' }),
            },
        ];

        return allOptions;
    }, [
        t,
        queueType,
        playbackSettings,
        status,
        audioDevices,
        transitionType,
        crossfadeStyle,
        crossfadeDuration,
        setCrossfadeDuration,
        speed,
        setSpeed,
        preservePitch,
        currentSong?.bpm,
        setQueueType,
        setSettings,
        setTransitionType,
        setCrossfadeStyle,
        setPreservePitch,
    ]);

    return (
        <Popover position="top" width={500}>
            <Popover.Target>
                <ActionIcon
                    icon="mediaSettings"
                    iconProps={{
                        size: 'lg',
                    }}
                    size="sm"
                    tooltip={{
                        label: t('common.setting_other', { postProcess: 'titleCase' }),
                        openDelay: 0,
                    }}
                    variant="subtle"
                />
            </Popover.Target>
            <Popover.Dropdown>
                <ListConfigTable options={options} />
            </Popover.Dropdown>
        </Popover>
    );
};
