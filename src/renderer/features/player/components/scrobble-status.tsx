import { useTranslation } from 'react-i18next';

import {
    invokeScrobbleForceSubmit,
    invokeScrobbleResetListenedState,
} from '/@/renderer/features/player/hooks/use-scrobble';
import { useAppStore, useScrobbleDebugStore, useSettingsStore } from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { HoverCard } from '/@/shared/components/hover-card/hover-card';
import { Icon } from '/@/shared/components/icon/icon';
import { Progress } from '/@/shared/components/progress/progress';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { PlaybackSelectors } from '/@/shared/constants/playback-selectors';

const scrobbleProgressProps = {
    'aria-hidden': true,
    color: 'var(--theme-colors-primary)',
    size: 'xs' as const,
};

const clampPct = (n: number) => Math.min(100, Math.max(0, n));

const ScrobbleConditionProgress = ({ value }: { value: number }) => (
    <Progress {...scrobbleProgressProps} value={value} w="100%" />
);

export const ScrobbleStatus = ({ formattedTime }: { formattedTime: string }) => {
    const { t } = useTranslation();
    const scrobbleEnabled = useSettingsStore((state) => state.playback.scrobble.enabled);
    const privateMode = useAppStore((state) => state.privateMode);
    const snapshot = useScrobbleDebugStore((state) => state.snapshot);

    const hookInactive = !scrobbleEnabled || privateMode;

    const listenedSec = (snapshot.listenedMs / 1000).toFixed(1);
    const listenPercentOfTrack =
        snapshot.trackDurationMs > 0 ? (snapshot.listenedMs / snapshot.trackDurationMs) * 100 : 0;

    const durationConditionPct =
        snapshot.targetDurationSec > 0
            ? clampPct((snapshot.listenedMs / 1000 / snapshot.targetDurationSec) * 100)
            : 0;
    const percentConditionPct =
        snapshot.targetPercentage > 0 && snapshot.trackDurationMs > 0
            ? clampPct((listenPercentOfTrack / snapshot.targetPercentage) * 100)
            : 0;

    return (
        <HoverCard position="top" width={280}>
            <HoverCard.Target>
                <Group
                    align="center"
                    aria-label={`${t('player.scrobble')}, ${formattedTime}`}
                    fz="xs"
                    gap="sm"
                    justify="center"
                    onClick={(e) => e.stopPropagation()}
                    style={{ userSelect: 'none' }}
                    wrap="nowrap"
                >
                    <Icon
                        aria-hidden
                        color={snapshot.submitted ? 'primary' : 'transparent'}
                        fill={snapshot.submitted ? 'primary' : 'transparent'}
                        icon="circle"
                        size="0.375rem"
                    />
                    <Text
                        className={PlaybackSelectors.elapsedTime}
                        fw={600}
                        fz="inherit"
                        isMuted
                        isNoSelect
                        style={{ userSelect: 'none' }}
                    >
                        {formattedTime}
                    </Text>
                </Group>
            </HoverCard.Target>
            <HoverCard.Dropdown onClick={(e) => e.stopPropagation()}>
                <Stack gap="md" p="sm">
                    {hookInactive ? (
                        <Text size="sm">{t('form.privateMode.enabled')}</Text>
                    ) : (
                        <>
                            <Stack gap="xs">
                                <Text size="xs">
                                    {`${listenedSec}s / ${snapshot.targetDurationSec}s`}
                                </Text>
                                <ScrobbleConditionProgress value={durationConditionPct} />
                            </Stack>
                            <Stack gap="xs">
                                <Text size="xs">
                                    {`${listenPercentOfTrack.toFixed(1)}% / ${snapshot.targetPercentage}%`}
                                </Text>
                                <ScrobbleConditionProgress value={percentConditionPct} />
                            </Stack>
                            <Group gap="xs" grow wrap="nowrap">
                                <Button
                                    disabled={!snapshot.songId}
                                    onClick={() => invokeScrobbleResetListenedState()}
                                    size="xs"
                                    variant="outline"
                                >
                                    {t('common.reset')}
                                </Button>
                                <Button
                                    disabled={!snapshot.songId || snapshot.submitted}
                                    onClick={() => invokeScrobbleForceSubmit()}
                                    size="xs"
                                    variant="filled"
                                >
                                    {t('player.scrobbleForceSubmit')}
                                </Button>
                            </Group>
                        </>
                    )}
                </Stack>
            </HoverCard.Dropdown>
        </HoverCard>
    );
};
