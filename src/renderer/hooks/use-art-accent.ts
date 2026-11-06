import { useEffect, useRef } from 'react';

import { useItemImageUrl } from '/@/renderer/components/item-image/item-image';
import {
    useIsRadioActive,
    useRadioPlayer,
} from '/@/renderer/features/radio/hooks/use-radio-player';
import { getArtColorCandidates } from '/@/renderer/hooks/use-fast-average-color';
import { useCurrentServerId, useGeneralSettings, usePlayerSong } from '/@/renderer/store';
import { useArtAccentStore } from '/@/renderer/store/art-accent.store';
import { logger } from '/@/renderer/utils/logger';
import { LibraryItem } from '/@/shared/types/domain-types';

export const ArtAccentEffect = () => {
    const { accentFromArt } = useGeneralSettings();
    const serverId = useCurrentServerId();

    const currentSong = usePlayerSong();
    const isRadioActive = useIsRadioActive();
    const { currentStationArt } = useRadioPlayer();

    const imageId = isRadioActive ? currentStationArt?.imageId : currentSong?.imageId;
    const currentImageUrl = isRadioActive ? currentStationArt?.imageUrl : currentSong?.imageUrl;

    const imageUrl = useItemImageUrl({
        id: imageId || undefined,
        imageUrl: currentImageUrl,
        itemType: LibraryItem.SONG,
        type: 'itemCard',
    });

    const processingKeyRef = useRef<null | string>(null);

    useEffect(() => {
        const { candidates, clearCandidates, imageKey } = useArtAccentStore.getState();

        if (!accentFromArt) {
            if (imageKey !== null || candidates !== null) {
                clearCandidates();
            }
            processingKeyRef.current = null;
            return;
        }

        const artId = imageId || currentImageUrl;
        const currentImageKey = artId ? `${serverId}:${artId}` : null;

        if (!currentImageKey || !imageUrl) {
            if (imageKey !== null || candidates !== null) {
                clearCandidates();
            }
            processingKeyRef.current = null;
            return;
        }

        // Already sampled this exact cover: no re-decode, no re-log.
        if (imageKey === currentImageKey && candidates !== null) {
            return;
        }

        if (processingKeyRef.current === currentImageKey) {
            return;
        }

        let isMounted = true;
        processingKeyRef.current = currentImageKey;

        getArtColorCandidates(imageUrl)
            .then((nextCandidates) => {
                if (!isMounted || processingKeyRef.current !== currentImageKey) {
                    return;
                }

                processingKeyRef.current = null;
                logger.debug('Album art accent candidates', {
                    candidates: nextCandidates,
                    imageKey: currentImageKey,
                });
                // Previous candidates stay until this fetch resolves, so the
                // theme never flashes between covers.
                useArtAccentStore.getState().setCandidates(currentImageKey, nextCandidates);
            })
            .catch((error) => {
                if (isMounted && processingKeyRef.current === currentImageKey) {
                    processingKeyRef.current = null;
                    logger.warn('Album art accent sampling failed', {
                        error: String(error),
                        imageKey: currentImageKey,
                    });
                    // Record the failed cover with empty candidates so the dead url
                    // is not re-decoded on every render and the theme falls back to
                    // the saved accent instead of keeping the previous cover's color.
                    useArtAccentStore.getState().setCandidates(currentImageKey, []);
                }
            });

        return () => {
            isMounted = false;
            if (processingKeyRef.current === currentImageKey) {
                processingKeyRef.current = null;
            }
        };
    }, [accentFromArt, currentImageUrl, imageId, imageUrl, serverId]);

    return null;
};
