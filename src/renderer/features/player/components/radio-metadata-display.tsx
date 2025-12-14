import clsx from 'clsx';
import React from 'react';

import styles from './left-controls.module.css';

import { useIsRadioActive, useRadioStore } from '/@/renderer/features/radio/hooks/use-radio-player';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Text } from '/@/shared/components/text/text';
import { PlaybackSelectors } from '/@/shared/constants/playback-selectors';

interface RadioMetadataDisplayProps {
    onStopPropagation: (e?: React.MouseEvent) => void;
    onToggleContextMenu: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export const RadioMetadataDisplay = ({
    onStopPropagation,
    onToggleContextMenu,
}: RadioMetadataDisplayProps) => {
    const isRadioPlaying = useRadioStore((state) => state.isPlaying);
    const radioMetadata = useRadioStore((state) => state.metadata);
    const stationName = useRadioStore((state) => state.stationName);

    const isRadioMode = isRadioPlaying;
    const isRadioActive = useIsRadioActive();

    const title = isRadioMode ? radioMetadata || '—' : '—';

    if (!isRadioActive) {
        return null;
    }

    return (
        <>
            <div className={styles.lineItem} onClick={onStopPropagation}>
                <Text
                    className={PlaybackSelectors.songTitle}
                    fw={500}
                    isNoSelect
                    onContextMenu={onToggleContextMenu}
                    overflow="hidden"
                >
                    {title || '—'}
                </Text>
            </div>
            <div
                className={clsx(styles.lineItem, styles.secondary, PlaybackSelectors.songArtist)}
                onClick={onStopPropagation}
            >
                <Group align="center" gap="xs" wrap="nowrap">
                    <Icon color="muted" icon="radio" size="sm" />
                    <Text isMuted isNoSelect overflow="hidden" size="sm">
                        {stationName || '—'}
                    </Text>
                </Group>
            </div>
        </>
    );
};
