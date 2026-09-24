import { useTranslation } from 'react-i18next';

import styles from './mini-player.module.css';

import { ItemImage } from '/@/renderer/components/item-image/item-image';
import {
    CenterPlayButton,
    NextButton,
    PreviousButton,
    RadioCenterPlayButton,
} from '/@/renderer/features/player/components/center-controls';
import { PlayerbarSeekSlider } from '/@/renderer/features/player/components/playerbar-seek-slider';
import { setMiniPlayer } from '/@/renderer/features/player/store/mini-player.store';
import { useIsRadioActive, useRadioStore } from '/@/renderer/features/radio/hooks/use-radio-player';
import { usePlayerSong } from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Center } from '/@/shared/components/center/center';
import { Icon } from '/@/shared/components/icon/icon';
import { Text } from '/@/shared/components/text/text';
import { LibraryItem } from '/@/shared/types/domain-types';

export const MiniPlayer = () => {
    const { t } = useTranslation();
    const currentSong = usePlayerSong();
    const isRadioActive = useIsRadioActive();
    const stationName = useRadioStore((state) => state.stationName);
    const radioTitle = useRadioStore((state) => state.metadata?.title);

    const title = isRadioActive ? radioTitle || stationName : currentSong?.name;
    const subtitle = isRadioActive ? stationName : currentSong?.artistName;
    const duration = currentSong?.duration ? currentSong.duration / 1000 : 0;

    return (
        <div className={styles.container}>
            <div className={styles.image}>
                {isRadioActive ? (
                    <Center className={styles.radioImage}>
                        <Icon color="muted" icon="radio" size="40%" />
                    </Center>
                ) : (
                    <ItemImage
                        blurHash={currentSong?.blurHash}
                        enableDebounce={false}
                        enableViewport={false}
                        id={currentSong?.imageId}
                        itemType={LibraryItem.SONG}
                        serverId={currentSong?._serverId}
                        thumbHash={currentSong?.thumbHash}
                        type="table"
                    />
                )}
            </div>
            <div className={styles.body}>
                <div className={styles.header}>
                    <div className={styles.metadata}>
                        <Text fw={500} overflow="hidden">
                            {title || '-'}
                        </Text>
                        <Text isMuted overflow="hidden" size="sm">
                            {subtitle || '-'}
                        </Text>
                    </div>
                    <ActionIcon
                        className={styles.noDrag}
                        icon="expand"
                        onClick={() => setMiniPlayer(false)}
                        size="sm"
                        tooltip={{ label: t('player.miniPlayer', { context: 'exit' }) }}
                        variant="subtle"
                    />
                </div>
                <div className={styles.controls}>
                    <PreviousButton disabled={isRadioActive} />
                    {isRadioActive ? <RadioCenterPlayButton /> : <CenterPlayButton />}
                    <NextButton disabled={isRadioActive} />
                </div>
                {!isRadioActive && (
                    <div className={styles.noDrag}>
                        <PlayerbarSeekSlider max={duration} min={0} />
                    </div>
                )}
            </div>
        </div>
    );
};
