import isElectron from 'is-electron';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
    getDefaultAudioDevice,
    useAudioDevices,
} from '/@/renderer/features/settings/components/playback/audio-settings';
import { ListConfigTable } from '/@/renderer/features/shared/components/list-config-menu';
import {
    usePlaybackType,
    usePlayerActions,
    usePlayerProperties,
    usePlayerSongProperties,
    usePlayerSpeed,
    usePlayerStatus,
} from '/@/renderer/store';
import {
    useCombinedLyricsAndVisualizer,
    useMicrotonalPitchControls,
    usePlaybackSettings,
    useSettingsStore,
    useSettingsStoreActions,
    useShowLyricsInSidebar,
    useShowVisualizerInSidebar,
} from '/@/renderer/store/settings.store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { Popover } from '/@/shared/components/popover/popover';
import { SegmentedControl } from '/@/shared/components/segmented-control/segmented-control';
import { Select } from '/@/shared/components/select/select';
import { Slider } from '/@/shared/components/slider/slider';
import { Switch } from '/@/shared/components/switch/switch';
import { Text } from '/@/shared/components/text/text';
import { CrossfadeStyle, PlayerStatus, PlayerStyle, PlayerType } from '/@/shared/types/types';

const ipc = isElectron() ? window.api.ipc : null;

export const PlayerConfig = () => {
    const { t } = useTranslation();
    const preservePitch = useSettingsStore((state) => state.playback.preservePitch);
    const showLyricsInSidebar = useShowLyricsInSidebar();
    const showVisualizerInSidebar = useShowVisualizerInSidebar();
    const combinedLyricsAndVisualizer = useCombinedLyricsAndVisualizer();

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

    const options = useMemo(() => {
        const allOptions = [
            {
                component: <AudioPlayerTypeConfig />,
                id: 'audioPlayerType',
                label: t('setting.audioPlayer'),
            },
            {
                component: <AudioDeviceConfig />,
                id: 'audioDevice',
                label: t('setting.audioDevice'),
            },
            {
                component: null,
                id: 'divider-1',
                isDivider: true,
                label: '',
            },
            {
                component: <TransitionTypeConfig />,
                id: 'transitionType',
                label: t('setting.playbackStyle'),
            },
            {
                component: <CrossfadeStyleConfig />,
                id: 'crossfadeStyle',
                label: t('setting.crossfadeStyle'),
            },
            {
                component: <CrossfadeDurationConfig />,
                id: 'crossfadeDuration',
                label: t('setting.crossfadeDuration'),
            },
            {
                component: null,
                id: 'divider-2',
                isDivider: true,
                label: '',
            },
            {
                component: <PlaybackSpeedSlider />,
                id: 'playbackSpeed',
                label: t('player.playbackSpeed'),
            },
            {
                component: !preservePitch ? <PitchControls /> : <></>,
                id: 'pitchControls',
                label: '',
            },
            {
                component: (
                    <Switch
                        defaultChecked={preservePitch}
                        onChange={(e) => setPreservePitch(e.currentTarget.checked)}
                    />
                ),
                id: 'preservePitch',
                label: t('setting.preservePitch'),
            },
            {
                component: null,
                id: 'divider-3',
                isDivider: true,
                label: '',
            },
            {
                component: (
                    <Switch
                        defaultChecked={showLyricsInSidebar}
                        onChange={(e) => {
                            setSettings({
                                general: {
                                    showLyricsInSidebar: e.currentTarget.checked,
                                },
                            });
                        }}
                    />
                ),
                id: 'showLyricsInSidebar',
                label: t('setting.showLyricsInSidebar'),
            },
            {
                component: (
                    <Switch
                        defaultChecked={showVisualizerInSidebar}
                        onChange={(e) => {
                            setSettings({
                                general: {
                                    showVisualizerInSidebar: e.currentTarget.checked,
                                },
                            });
                        }}
                    />
                ),
                id: 'showVisualizerInSidebar',
                label: t('setting.showVisualizerInSidebar'),
            },
            {
                component: (
                    <Switch
                        defaultChecked={combinedLyricsAndVisualizer}
                        onChange={(e) => {
                            setSettings({
                                general: {
                                    combinedLyricsAndVisualizer: e.currentTarget.checked,
                                },
                            });
                        }}
                    />
                ),
                id: 'combinedLyricsAndVisualizer',
                label: t('setting.combinedLyricsAndVisualizer'),
            },
        ];

        return allOptions;
    }, [
        t,
        preservePitch,
        setSettings,
        setPreservePitch,
        showLyricsInSidebar,
        showVisualizerInSidebar,
        combinedLyricsAndVisualizer,
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
                    stopsPropagation
                    tooltip={{
                        label: t('common.setting', { count: 2 }),
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

const AudioPlayerTypeConfig = () => {
    const status = usePlayerStatus();
    const playbackSettings = usePlaybackSettings();
    const { setSettings } = useSettingsStoreActions();

    return (
        <Select
            comboboxProps={{ withinPortal: false }}
            data={[
                {
                    disabled: !isElectron(),
                    label: 'MPV',
                    value: PlayerType.LOCAL,
                },
                { label: 'Web', value: PlayerType.WEB },
                { label: 'Jukebox', value: PlayerType.JUKEBOX },
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
    );
};

const AudioDeviceConfig = () => {
    const status = usePlayerStatus();
    const playbackType = usePlaybackType();
    const playbackSettings = usePlaybackSettings();
    const { setSettings } = useSettingsStoreActions();

    const audioDevices = useAudioDevices(playbackType);
    const audioDeviceId =
        playbackType === PlayerType.LOCAL
            ? playbackSettings.mpvAudioDeviceId
            : playbackSettings.audioDeviceId;

    return (
        <Select
            clearable
            comboboxProps={{ withinPortal: false }}
            data={audioDevices}
            disabled={status === PlayerStatus.PLAYING}
            onChange={(e) => {
                setSettings({
                    playback: {
                        ...playbackSettings,
                        ...(playbackType === PlayerType.LOCAL
                            ? { mpvAudioDeviceId: e }
                            : { audioDeviceId: e }),
                    },
                });
            }}
            value={audioDeviceId ?? getDefaultAudioDevice(audioDevices, playbackType)}
            width="100%"
        />
    );
};

const TransitionTypeConfig = () => {
    const { t } = useTranslation();
    const status = usePlayerStatus();
    const playbackSettings = usePlaybackSettings();
    const { transitionType } = usePlayerProperties();
    const { setTransitionType } = usePlayerActions();

    return (
        <SegmentedControl
            data={[
                {
                    label: t('setting.playbackStyle', {
                        context: 'optionNormal',
                    }),
                    value: PlayerStyle.GAPLESS,
                },
                {
                    label: t('setting.playbackStyle', {
                        context: 'optionCrossFade',
                    }),
                    value: PlayerStyle.CROSSFADE,
                },
            ]}
            disabled={playbackSettings.type !== PlayerType.WEB || status === PlayerStatus.PLAYING}
            onChange={(value) => setTransitionType(value as PlayerStyle)}
            size="sm"
            value={transitionType}
            w="100%"
        />
    );
};

const CrossfadeStyleConfig = () => {
    const status = usePlayerStatus();
    const playbackSettings = usePlaybackSettings();
    const { crossfadeStyle, transitionType } = usePlayerProperties();
    const { setCrossfadeStyle } = usePlayerActions();

    return (
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
    );
};

const CrossfadeDurationConfig = () => {
    const status = usePlayerStatus();
    const playbackSettings = usePlaybackSettings();
    const { crossfadeDuration, transitionType } = usePlayerProperties();
    const { setCrossfadeDuration } = usePlayerActions();

    return (
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
    );
};

export const PlaybackSpeedSlider = () => {
    const speed = usePlayerSpeed();
    const { setSpeed } = usePlayerActions();
    const { bpm } = usePlayerSongProperties(['bpm']) ?? {};

    const formatPlaybackSpeedSliderLabel = useMemo(
        () => (value: number) => {
            const bpmValue = Number(bpm);
            if (bpmValue > 0) {
                return `${value.toFixed(2)} x / ${(bpmValue * value).toFixed(1)} BPM`;
            }
            return `${value.toFixed(2)} x`;
        },
        [bpm],
    );

    return (
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
    );
};

export const PitchControls = () => {
    const microtonal = useMicrotonalPitchControls();
    const speed = usePlayerSpeed();
    const { setSpeed } = usePlayerActions();

    const speedToPitch = (speed: number) => {
        return 12 * Math.log2(speed);
    };

    const pitchToSpeed = (pitch: number) => {
        return 2 ** (pitch / 12);
    };

    const adjustMusicalSpeed = (adjustment: number) => {
        const curPitch = speedToPitch(speed);
        const newSpeed = pitchToSpeed(curPitch + adjustment);
        setSpeed(newSpeed);
    };

    return (
        <Group gap={microtonal ? 'xs' : 'md'} my="sm" w="100%" wrap="nowrap">
            <Button
                aria-label="-1 semitone"
                fullWidth
                onClick={() => adjustMusicalSpeed(-1)}
                size="compact-xs"
            >
                -1st
            </Button>
            {microtonal && (
                <Button
                    aria-label="-10 cents"
                    fullWidth
                    onClick={() => adjustMusicalSpeed(-0.1)}
                    size="compact-xs"
                >
                    -10ct
                </Button>
            )}
            <Text size="xs" style={{ fontFamily: 'monospace' }} ta="center" w="60px">
                {speed.toFixed(2)}x {speedToPitch(speed) > 0 && '+'}
                {speedToPitch(speed) == 0 && '±'}
                {speedToPitch(speed).toFixed(2)}st
            </Text>
            {microtonal && (
                <Button
                    aria-label="+10 cents"
                    fullWidth
                    onClick={() => adjustMusicalSpeed(0.1)}
                    size="compact-xs"
                >
                    +10ct
                </Button>
            )}
            <Button
                aria-label="+1 semitone"
                fullWidth
                onClick={() => adjustMusicalSpeed(1)}
                size="compact-xs"
            >
                +1st
            </Button>
        </Group>
    );
};
