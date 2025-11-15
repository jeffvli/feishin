import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, useNavigate } from 'react-router';

import { AppRoute } from '/@/renderer/router/routes';
import { ContextMenu } from '/@/shared/components/context-menu/context-menu';
import {
    Album,
    AlbumArtist,
    Artist,
    LibraryItem,
    QueueSong,
    Song,
} from '/@/shared/types/domain-types';

interface GoToActionProps {
    items: Album[] | AlbumArtist[] | Artist[] | QueueSong[] | Song[];
}

export const GoToAction = ({ items }: GoToActionProps) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const { albumArtists, albumId } = useMemo(() => {
        const firstItem = items[0];

        if (firstItem._itemType === LibraryItem.ALBUM) {
            return {
                albumArtists: firstItem.albumArtists || [],
                albumId: firstItem.id,
            };
        } else if (firstItem._itemType === LibraryItem.SONG) {
            return {
                albumArtists: firstItem.albumArtists || [],
                albumId: firstItem.albumId,
            };
        } else if (
            firstItem._itemType === LibraryItem.ARTIST ||
            firstItem._itemType === LibraryItem.ALBUM_ARTIST
        ) {
            return {
                albumArtists: [{ id: firstItem.id, name: firstItem.name }],
                albumId: null,
            };
        }

        return {
            albumArtists: [],
            albumId: null,
        };
    }, [items]);

    const handleGoToAlbum = useCallback(() => {
        if (!albumId) return;
        navigate(generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, { albumId }));
    }, [albumId, navigate]);

    const handleGoToAlbumArtist = useCallback(
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
                    {t('page.contextMenu.goTo', { postProcess: 'sentenceCase' })}
                </ContextMenu.Item>
            </ContextMenu.SubmenuTarget>
            <ContextMenu.SubmenuContent>
                {hasAlbum && (
                    <ContextMenu.Item leftIcon="album" onSelect={handleGoToAlbum}>
                        {t('page.contextMenu.goToAlbum', { postProcess: 'sentenceCase' })}
                    </ContextMenu.Item>
                )}
                {albumArtists.map((albumArtist) => (
                    <ContextMenu.Item
                        key={albumArtist.id}
                        leftIcon="artist"
                        onSelect={() => handleGoToAlbumArtist(albumArtist.id)}
                    >
                        {`${t('page.contextMenu.goTo', { postProcess: 'sentenceCase' })} ${albumArtist.name}`}
                    </ContextMenu.Item>
                ))}
            </ContextMenu.SubmenuContent>
        </ContextMenu.Submenu>
    );
};
