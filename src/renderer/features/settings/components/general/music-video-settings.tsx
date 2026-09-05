import isElectron from 'is-electron';
import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { clearMusicVideoCache } from '/@/renderer/features/music-video/music-video-store';
import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { useGeneralSettings, useSettingsStoreActions } from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { Select } from '/@/shared/components/select/select';
import { Stack } from '/@/shared/components/stack/stack';
import { Switch } from '/@/shared/components/switch/switch';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';

const localSettings = isElectron() ? window.api.localSettings : null;
const musicVideoApi = isElectron() ? window.api.musicVideo : null;

type BinaryAsset = 'ffmpeg' | 'ytdlp';

// Every control in this section shares one column of this width, so the detected-path line
// underneath a control wraps inside the column instead of widening it. Without that the two
// binary rows sized themselves to their own status text and their inputs sat at different
// x-positions.
const CONTROL_COLUMN_WIDTH = 340;

const BYTES_PER_MB = 1024 * 1024;

// Kept in step with `ALLOWED_MAX_HEIGHTS` in the main process, which validates whatever arrives
// rather than trusting it - the value ends up in a yt-dlp format selector on a command line.
const MAX_HEIGHT_OPTIONS = [
    { label: '360p', value: '360' },
    { label: '480p', value: '480' },
    { label: '720p', value: '720' },
    { label: '1080p', value: '1080' },
];

const formatBytes = (bytes: number): string => {
    if (bytes >= 1024 * BYTES_PER_MB) {
        return `${(bytes / (1024 * BYTES_PER_MB)).toFixed(1)} GB`;
    }

    return `${Math.round(bytes / BYTES_PER_MB)} MB`;
};

export const MusicVideoSettings = memo(() => {
    const { t } = useTranslation();
    const settings = useGeneralSettings();
    const { setSettings } = useSettingsStoreActions();

    const [ytdlpPath, setYtdlpPath] = useState('');
    const [ffmpegPath, setFfmpegPath] = useState('');
    const [ytdlpDetected, setYtdlpDetected] = useState<null | string>(null);
    const [ytdlpVersion, setYtdlpVersion] = useState<null | string>(null);
    const [ffmpegDetected, setFfmpegDetected] = useState<null | string>(null);
    const [downloading, setDownloading] = useState<BinaryAsset | null>(null);
    const [cacheStats, setCacheStats] = useState<null | { bytes: number; count: number }>(null);

    const refreshCacheStats = () => {
        musicVideoApi?.getCacheStats().then(setCacheStats);
    };

    const refreshAssetStatus = () => {
        musicVideoApi?.getAssetStatus().then((status) => {
            setYtdlpDetected(status.ytdlp.path);
            setYtdlpVersion(status.ytdlp.version);
            setFfmpegDetected(status.ffmpeg.path);
        });
    };

    useEffect(() => {
        if (!localSettings || !musicVideoApi) return;

        localSettings.get('ytdlp_path').then((value) => setYtdlpPath((value as string) || ''));
        localSettings.get('ffmpeg_path').then((value) => setFfmpegPath((value as string) || ''));
        refreshAssetStatus();
        refreshCacheStats();
    }, []);

    const handleSetPath = async (asset: BinaryAsset, clear?: boolean) => {
        const setPath = asset === 'ytdlp' ? setYtdlpPath : setFfmpegPath;
        const storeKey = asset === 'ytdlp' ? 'ytdlp_path' : 'ffmpeg_path';

        if (clear) {
            localSettings?.set(storeKey, undefined);
            setPath('');
            return;
        }

        const result = await localSettings?.openFileSelector();

        if (!result) {
            return;
        }

        localSettings?.set(storeKey, result);
        setPath(result);
    };

    const handleDownload = async (asset: BinaryAsset) => {
        setDownloading(asset);

        try {
            const status = await musicVideoApi?.downloadAsset(asset);

            if (status) {
                setYtdlpDetected(status.ytdlp.path);
                setYtdlpVersion(status.ytdlp.version);
                setFfmpegDetected(status.ffmpeg.path);
            }
        } catch {
            toast.error({ message: t('setting.musicVideoDownloadFailed', { asset }) });
        } finally {
            setDownloading(null);
        }
    };

    // This feature has no meaning on the web/Docker build: the search/extraction IPC has no
    // main process to run in. Same treatment the mpv path and ListenBrainz token settings get.
    if (!localSettings || !musicVideoApi) {
        return null;
    }

    const options: SettingOption[] = [
        {
            control: (
                <Switch
                    defaultChecked={settings.musicVideoEnabled}
                    onChange={(e) => {
                        setSettings({
                            general: { musicVideoEnabled: e.currentTarget.checked },
                        });
                    }}
                />
            ),
            description: t('setting.musicVideo', { context: 'description' }),
            title: t('setting.musicVideo'),
        },
        {
            control: (
                <Select
                    data={[
                        { label: t('setting.musicVideoFallbackCover'), value: 'cover' },
                        { label: t('setting.musicVideoFallbackVisualizer'), value: 'visualizer' },
                    ]}
                    defaultValue={settings.musicVideoFallback}
                    onChange={(value) => {
                        setSettings({
                            general: {
                                musicVideoFallback: value as 'cover' | 'visualizer',
                            },
                        });
                    }}
                />
            ),
            description: t('setting.musicVideoFallback', { context: 'description' }),
            isHidden: !settings.musicVideoEnabled,
            title: t('setting.musicVideoFallback'),
        },
        {
            control: (
                <Select
                    data={MAX_HEIGHT_OPTIONS}
                    defaultValue={String(settings.musicVideoMaxHeight)}
                    onChange={(value) => {
                        if (!value) return;

                        setSettings({ general: { musicVideoMaxHeight: Number(value) } });
                    }}
                />
            ),
            description: t('setting.musicVideoQuality', { context: 'description' }),
            isHidden: !settings.musicVideoEnabled,
            title: t('setting.musicVideoQuality'),
        },
        {
            control: (
                <Stack align="flex-end" gap={4} w={CONTROL_COLUMN_WIDTH}>
                    <Group gap="sm" justify="flex-end" wrap="nowrap">
                        <TextInput
                            onChange={(e) => {
                                const value = e.currentTarget.value.replace(/\\/g, '/');
                                setYtdlpPath(value);
                                localSettings?.set('ytdlp_path', value);
                            }}
                            onClick={() => handleSetPath('ytdlp')}
                            rightSection={
                                ytdlpPath && (
                                    <ActionIcon
                                        icon="x"
                                        onClick={() => handleSetPath('ytdlp', true)}
                                        variant="transparent"
                                    />
                                )
                            }
                            value={ytdlpPath}
                            width={200}
                        />
                        <Button
                            loading={downloading === 'ytdlp'}
                            onClick={() => handleDownload('ytdlp')}
                            size="compact-md"
                            variant="filled"
                        >
                            {ytdlpDetected
                                ? t('setting.musicVideoUpdate')
                                : t('setting.musicVideoDownload')}
                        </Button>
                    </Group>
                    <Text isMuted size="xs" style={{ wordBreak: 'break-all' }} ta="right">
                        {ytdlpDetected
                            ? t('setting.musicVideoBinaryPathDetected', {
                                  path: ytdlpVersion
                                      ? `${ytdlpDetected} (${ytdlpVersion})`
                                      : ytdlpDetected,
                              })
                            : t('setting.musicVideoBinaryPathMissing')}
                    </Text>
                </Stack>
            ),
            description: t('setting.musicVideoBinaryPath', { context: 'description' }),
            isHidden: !settings.musicVideoEnabled,
            title: t('setting.musicVideoBinaryPath'),
        },
        {
            control: (
                <Stack align="flex-end" gap={4} w={CONTROL_COLUMN_WIDTH}>
                    <Group gap="sm" justify="flex-end" wrap="nowrap">
                        <TextInput
                            onChange={(e) => {
                                const value = e.currentTarget.value.replace(/\\/g, '/');
                                setFfmpegPath(value);
                                localSettings?.set('ffmpeg_path', value);
                            }}
                            onClick={() => handleSetPath('ffmpeg')}
                            rightSection={
                                ffmpegPath && (
                                    <ActionIcon
                                        icon="x"
                                        onClick={() => handleSetPath('ffmpeg', true)}
                                        variant="transparent"
                                    />
                                )
                            }
                            value={ffmpegPath}
                            width={200}
                        />
                        <Button
                            loading={downloading === 'ffmpeg'}
                            onClick={() => handleDownload('ffmpeg')}
                            size="compact-md"
                            variant="filled"
                        >
                            {ffmpegDetected
                                ? t('setting.musicVideoUpdate')
                                : t('setting.musicVideoDownload')}
                        </Button>
                    </Group>
                    <Text isMuted size="xs" style={{ wordBreak: 'break-all' }} ta="right">
                        {ffmpegDetected
                            ? t('setting.musicVideoFfmpegPathDetected', { path: ffmpegDetected })
                            : t('setting.musicVideoFfmpegPathMissing')}
                    </Text>
                </Stack>
            ),
            description: t('setting.musicVideoFfmpegPath', { context: 'description' }),
            isHidden: !settings.musicVideoEnabled,
            title: t('setting.musicVideoFfmpegPath'),
        },
        {
            control: (
                <Stack align="flex-end" gap={4} w={CONTROL_COLUMN_WIDTH}>
                    <NumberInput
                        defaultValue={settings.musicVideoCacheLimitMb}
                        max={1024 * 1024}
                        min={0}
                        // Applied on blur rather than per keystroke: pruning is destructive, and
                        // typing "500" over "2048" passes through "5" on the way.
                        onBlur={(e) => {
                            const limitMb = Number(e.currentTarget.value.replace(/[^\d]/g, ''));
                            if (!Number.isFinite(limitMb)) return;

                            setSettings({ general: { musicVideoCacheLimitMb: limitMb } });
                            musicVideoApi
                                ?.pruneCache(limitMb * BYTES_PER_MB)
                                .then(refreshCacheStats);
                        }}
                        step={256}
                        width={140}
                    />
                    {cacheStats && (
                        <Text isMuted size="xs" ta="right">
                            {t('setting.musicVideoCacheUsage', {
                                count: cacheStats.count,
                                used: formatBytes(cacheStats.bytes),
                            })}
                        </Text>
                    )}
                </Stack>
            ),
            description: t('setting.musicVideoCacheLimit', { context: 'description' }),
            isHidden: !settings.musicVideoEnabled,
            title: t('setting.musicVideoCacheLimit'),
        },
        {
            control: (
                <Button
                    onClick={() => {
                        clearMusicVideoCache();
                        musicVideoApi?.clearVideoCache().then(refreshCacheStats);
                    }}
                    size="compact-md"
                    variant="filled"
                >
                    {t('setting.musicVideoClearCache')}
                </Button>
            ),
            description: '',
            isHidden: !settings.musicVideoEnabled,
            title: t('setting.musicVideoClearCache'),
        },
    ];

    return <SettingsSection options={options} title={t('setting.musicVideo')} />;
});
