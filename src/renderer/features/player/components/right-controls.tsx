import { AutoDJButton } from './auto-dj-button';
import { FavoriteButton } from './favorite-button';
import { LyricsButton } from './lyrics-button';
import { QueueButton } from './queue-button';
import { RatingButton } from './rating-button';
import { VolumeButton } from './volume-button';

import { DlnaCastButton } from '/@/renderer/features/player/components/dlna-cast-button';
import { PlayerConfig } from '/@/renderer/features/player/components/player-config';
import { SleepTimerButton } from '/@/renderer/features/player/components/sleep-timer-button';
import { useGeneralSettings } from '/@/renderer/store/settings.store';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';

export const RightControls = () => {
    const { showRatings } = useGeneralSettings();
    return (
        <Flex align="flex-end" direction="column" h="100%" px="1rem" py="0.5rem">
            <Group h="calc(100% / 3)">
                {showRatings && <RatingButton />}
                <AutoDJButton />
            </Group>
            <Group align="center" gap="xs" wrap="nowrap">
                <DlnaCastButton />
                <SleepTimerButton />
                <PlayerConfig />
                <LyricsButton />
                <FavoriteButton />
                <QueueButton />
                <VolumeButton />
            </Group>
            <Group h="calc(100% / 3)" />
        </Flex>
    );
};
