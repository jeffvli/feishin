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

const capForDisplay = (value: number, limit: number) =>
    limit > 0 ? Math.min(value, limit) : value;

const progressTowardLimit = (current: number, limit: number) =>
    limit > 0 ? clampPct((current / limit) * 100) : 0;

const ScrobbleConditionProgress = ({ value }: { value: number }) => (
    <Progress {...scrobbleProgressProps} value={value} w="100%" />
);

export const ScrobbleStatus = ({ formattedTime }: { formattedTime: string }) => {
    const { t } = useTranslation();
    const scrobbleEnabled = useSettingsStore((state) => state.playback.scrobble.enabled);
    const privateMode = useAppStore((state) => state.privateMode);
    const snapshot = useScrobbleDebugStore((state) => state.snapshot);

    const hookInactive = !scrobbleEnabled || privateMode;

    const listenedSecRaw = snapshot.listenedMs / 1000;
    const listenedSecDisplay = snapshot.submitted
        ? snapshot.targetDurationSec
        : capForDisplay(listenedSecRaw, snapshot.targetDurationSec);

    const listenPercentOfTrackRaw =
        snapshot.trackDurationMs > 0 ? (snapshot.listenedMs / snapshot.trackDurationMs) * 100 : 0;
    const listenPercentDisplay = snapshot.submitted
        ? snapshot.targetPercentage
        : capForDisplay(listenPercentOfTrackRaw, snapshot.targetPercentage);

    const durationConditionPct = progressTowardLimit(
        listenedSecDisplay,
        snapshot.targetDurationSec,
    );
    const percentConditionPct = progressTowardLimit(
        listenPercentDisplay,
        snapshot.targetPercentage,
    );

    return (
        <HoverCard openDelay={500} position="top" width={280}>
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
                                    {`${listenedSecDisplay.toFixed(1)}s / ${snapshot.targetDurationSec}s`}
                                </Text>
                                <ScrobbleConditionProgress value={durationConditionPct} />
                            </Stack>
                            <Stack gap="xs">
                                <Text size="xs">
                                    {`${listenPercentDisplay.toFixed(1)}% / ${snapshot.targetPercentage}%`}
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
