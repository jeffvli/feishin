import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, useNavigate } from 'react-router';

import { AppRoute } from '/@/renderer/router/routes';
import { ContextMenu } from '/@/shared/components/context-menu/context-menu';
import { Album, LibraryItem, QueueSong, Song } from '/@/shared/types/domain-types';

interface GoToActionProps {
    items: Album[] | QueueSong[] | Song[];
}

export const GoToAction = ({ items }: GoToActionProps) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const { albumId, artists } = useMemo(() => {
        const firstItem = items[0];

        switch (firstItem._itemType) {
            case LibraryItem.ALBUM:
                return {
                    albumId: firstItem.id,
                    artists: firstItem.albumArtists || [],
                };
            case LibraryItem.SONG:
                return {
                    albumId: firstItem.albumId,
                    artists:
                        (firstItem.artists?.length ? firstItem.artists : firstItem.albumArtists) ||
                        [],
                };
            default:
                return {
                    albumId: null,
                    artists: [],
                };
        }
    }, [items]);

    const handleGoToAlbum = useCallback(() => {
        if (!albumId) return;
        navigate(generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, { albumId }));
    }, [albumId, navigate]);

    const handleGoToArtist = useCallback(
        (albumArtistId: string) => {
            navigate(generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL, { albumArtistId }));
        },
        [navigate],
    );

    const hasAlbum = !!albumId;

    return (
        <ContextMenu.Submenu disabled={items.length !== 1}>
            <ContextMenu.SubmenuTarget>
                <ContextMenu.Item
                    leftIcon="externalLink"
                    onSelect={(e) => e.preventDefault()}
                    rightIcon="arrowRightS"
                >
                    {t('page.contextMenu.goTo')}
                </ContextMenu.Item>
            </ContextMenu.SubmenuTarget>
            <ContextMenu.SubmenuContent>
                {hasAlbum && (
                    <ContextMenu.Item leftIcon="album" onSelect={handleGoToAlbum}>
                        {t('page.contextMenu.goToAlbum')}
                    </ContextMenu.Item>
                )}
                {artists.map((artist) => (
                    <ContextMenu.Item
                        key={artist.id}
                        leftIcon="artist"
                        onSelect={() => handleGoToArtist(artist.id)}
                    >
                        {`${t('page.contextMenu.goTo')} ${artist.name}`}
                    </ContextMenu.Item>
                ))}
            </ContextMenu.SubmenuContent>
        </ContextMenu.Submenu>
    );
};
