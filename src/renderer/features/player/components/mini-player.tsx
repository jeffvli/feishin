import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

import styles from './mini-player.module.css';

import { ItemImage, useItemImageUrl } from '/@/renderer/components/item-image/item-image';
import {
    CenterPlayButton,
    NextButton,
    PreviousButton,
    RadioCenterPlayButton,
    RepeatButton,
    ShuffleButton,
} from '/@/renderer/features/player/components/center-controls';
import { BackgroundOverlay } from '/@/renderer/features/player/components/full-screen-player';
import { PlayerbarSeekSlider } from '/@/renderer/features/player/components/playerbar-seek-slider';
import { setMiniPlayer } from '/@/renderer/features/player/store/mini-player.store';
import { useIsRadioActive, useRadioStore } from '/@/renderer/features/radio/hooks/use-radio-player';
import { useSetRating } from '/@/renderer/features/shared/hooks/use-set-rating';
import { useCreateFavorite } from '/@/renderer/features/shared/mutations/create-favorite-mutation';
import { useDeleteFavorite } from '/@/renderer/features/shared/mutations/delete-favorite-mutation';
import { useFastAverageColor } from '/@/renderer/hooks';
import {
    useCurrentServer,
    useFullScreenPlayerStore,
    usePlayerSong,
    useShowFavorites,
    useShowRatings,
} from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Center } from '/@/shared/components/center/center';
import { Icon } from '/@/shared/components/icon/icon';
import { Rating } from '/@/shared/components/rating/rating';
import { Text } from '/@/shared/components/text/text';
import { LibraryItem, ServerType } from '/@/shared/types/domain-types';

export const MiniPlayer = () => {
    const { t } = useTranslation();
    const currentSong = usePlayerSong();
    const isRadioActive = useIsRadioActive();
    const stationName = useRadioStore((state) => state.stationName);
    const radioTitle = useRadioStore((state) => state.metadata?.title);

    const title = isRadioActive ? radioTitle || stationName : currentSong?.name;
    const subtitle = isRadioActive ? stationName : currentSong?.artistName;
    const duration = currentSong?.duration ? currentSong.duration / 1000 : 0;

    const dynamicBackground = useFullScreenPlayerStore((state) => state.dynamicBackground);
    const opacity = useFullScreenPlayerStore((state) => state.opacity);
    const effectiveDynamicBackground = dynamicBackground && !isRadioActive;

    const imageUrl = useItemImageUrl({
        id: currentSong?.imageId || undefined,
        imageUrl: currentSong?.imageUrl,
        itemType: LibraryItem.SONG,
        type: 'itemCard',
    });
    const { background } = useFastAverageColor({
        algorithm: 'dominant',
        src: imageUrl,
        srcLoaded: true,
    });

    return (
        <div
            className={styles.container}
            style={
                effectiveDynamicBackground && background
                    ? { backgroundColor: background }
                    : undefined
            }
        >
            {effectiveDynamicBackground && (
                <BackgroundOverlay
                    dynamicBackground={effectiveDynamicBackground}
                    opacity={opacity}
                />
            )}
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
                        type="itemCard"
                    />
                )}
                <div className={styles.imageOverlay}>
                    <ActionIcon
                        className={styles.noDrag}
                        icon="expand"
                        onClick={() => setMiniPlayer(false)}
                        size="lg"
                        tooltip={{ label: t('player.miniPlayer', { context: 'exit' }) }}
                        variant="subtle"
                    />
                </div>
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
                    <div className={clsx(styles.headerExtras, styles.noDrag)}>
                        <MiniPlayerFavoriteButton />
                        <MiniPlayerRating />
                    </div>
                </div>
                <div className={styles.controls}>
                    <span className={styles.hideFirst}>
                        <ShuffleButton disabled={isRadioActive} />
                    </span>
                    <PreviousButton disabled={isRadioActive} />
                    {isRadioActive ? <RadioCenterPlayButton /> : <CenterPlayButton />}
                    <NextButton disabled={isRadioActive} />
                    <span className={styles.hideFirst}>
                        <RepeatButton disabled={isRadioActive} />
                    </span>
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

const MiniPlayerFavoriteButton = () => {
    const { t } = useTranslation();
    const showFavorites = useShowFavorites();
    const currentSong = usePlayerSong();
    const addToFavoritesMutation = useCreateFavorite({});
    const removeFromFavoritesMutation = useDeleteFavorite({});

    if (!showFavorites) return null;

    const handleToggleFavorite = () => {
        if (!currentSong?.id) return;

        const mutation = currentSong.userFavorite
            ? removeFromFavoritesMutation
            : addToFavoritesMutation;

        mutation.mutate({
            apiClientProps: { serverId: currentSong._serverId || '' },
            query: { id: [currentSong.id], type: LibraryItem.SONG },
        });
    };

    return (
        <ActionIcon
            disabled={!currentSong?.id}
            icon="favorite"
            iconProps={{ fill: currentSong?.userFavorite ? 'primary' : undefined, size: 'lg' }}
            onClick={(e) => {
                e.stopPropagation();
                handleToggleFavorite();
            }}
            size="sm"
            tooltip={{
                label: currentSong?.userFavorite ? t('player.unfavorite') : t('player.favorite'),
                openDelay: 0,
            }}
            variant="subtle"
        />
    );
};

const MiniPlayerRating = () => {
    const showRatings = useShowRatings();
    const server = useCurrentServer();
    const currentSong = usePlayerSong();
    const setRating = useSetRating();

    const showRating =
        showRatings &&
        Boolean(currentSong?.id) &&
        (server?.type === ServerType.NAVIDROME || server?.type === ServerType.SUBSONIC);

    if (!showRating) return null;

    return (
        <Rating
            onChange={(rating) => {
                if (!currentSong?.id) return;
                setRating(currentSong._serverId, [currentSong.id], LibraryItem.SONG, rating);
            }}
            size="xs"
            value={currentSong?.userRating || 0}
        />
    );
};
