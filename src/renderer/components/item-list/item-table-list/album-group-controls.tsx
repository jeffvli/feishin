import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import styles from './album-group-controls.module.css';

import { albumQueries } from '/@/renderer/features/albums/api/album-api';
import { useSetFavorite } from '/@/renderer/features/shared/hooks/use-set-favorite';
import { useSetRating } from '/@/renderer/features/shared/hooks/use-set-rating';
import { useIsMutatingCreateFavorite } from '/@/renderer/features/shared/mutations/create-favorite-mutation';
import { useIsMutatingDeleteFavorite } from '/@/renderer/features/shared/mutations/delete-favorite-mutation';
import { useIsMutatingRating } from '/@/renderer/features/shared/mutations/set-rating-mutation';
import { useShowRatings } from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Rating } from '/@/shared/components/rating/rating';
import { LibraryItem, ServerType } from '/@/shared/types/domain-types';

const isRatingSupported = (serverType: ServerType | undefined) =>
    serverType === ServerType.NAVIDROME || serverType === ServerType.SUBSONIC;

const useAlbumGroupAlbum = (albumId: string | undefined, serverId: string | undefined) => {
    const enabled = !!albumId && !!serverId && !albumId.startsWith('dummy/');

    return useQuery({
        ...albumQueries.detail({ query: { id: albumId! }, serverId: serverId! }),
        enabled,
        staleTime: 5 * 60 * 1000,
    });
};

interface AlbumGroupControlsProps {
    albumId: string | undefined;
    serverId: string | undefined;
    serverType: ServerType | undefined;
}

export const AlbumGroupControls = ({ albumId, serverId, serverType }: AlbumGroupControlsProps) => {
    const showRatingsSetting = useShowRatings();
    const detailQuery = useAlbumGroupAlbum(albumId, serverId);
    const setFavorite = useSetFavorite();
    const setRating = useSetRating();

    const isMutatingCreateFavorite = useIsMutatingCreateFavorite();
    const isMutatingDeleteFavorite = useIsMutatingDeleteFavorite();
    const isMutatingFavorite = isMutatingCreateFavorite || isMutatingDeleteFavorite;
    const isMutatingRating = useIsMutatingRating();

    const album = detailQuery.data;
    const showRating = showRatingsSetting && isRatingSupported(serverType ?? album?._serverType);

    const handleFavorite = useCallback(
        (event: React.MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation();
            event.preventDefault();
            if (!album) return;

            setFavorite(album._serverId, [album.id], LibraryItem.ALBUM, !album.userFavorite);
        },
        [album, setFavorite],
    );

    const handleRating = useCallback(
        (rating: number) => {
            if (!album) return;

            if (album.userRating === rating) {
                return setRating(album._serverId, [album.id], LibraryItem.ALBUM, 0);
            }

            return setRating(album._serverId, [album.id], LibraryItem.ALBUM, rating);
        },
        [album, setRating],
    );

    if (!album) {
        return null;
    }

    return (
        <div className={styles.controls}>
            <ActionIcon
                className={styles.favorite}
                disabled={isMutatingFavorite}
                icon="favorite"
                iconProps={{
                    color: album.userFavorite ? 'primary' : 'muted',
                    fill: album.userFavorite ? 'primary' : undefined,
                    size: 'xs',
                }}
                onClick={handleFavorite}
                onDoubleClick={(event) => {
                    event.stopPropagation();
                    event.preventDefault();
                }}
                size="xs"
                variant="transparent"
            />
            {showRating && (
                <Rating
                    className={styles.rating}
                    onChange={handleRating}
                    readOnly={isMutatingRating}
                    size="xs"
                    value={album.userRating || 0}
                />
            )}
        </div>
    );
};
