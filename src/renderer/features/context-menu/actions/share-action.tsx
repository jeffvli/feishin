import { openContextModal } from '@mantine/modals';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { type ExternalService } from '/@/renderer/features/context-menu/utils/external-links';
import {
    resolveShareLinks,
    SHARE_LOOKUP_ELIGIBLE,
    type ShareableItem,
} from '/@/renderer/features/context-menu/utils/resolve-share-links';
import { ContextMenu } from '/@/shared/components/context-menu/context-menu';
import { AppIcon } from '/@/shared/components/icon/icon';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { toast } from '/@/shared/components/toast/toast';
import { LibraryItem } from '/@/shared/types/domain-types';

interface ShareActionProps {
    items: ShareableItem[];
    itemType: LibraryItem;
}

const SERVICE_ICON: Record<ExternalService, keyof typeof AppIcon> = {
    deezer: 'brandDeezer',
    qobuz: 'brandQobuz',
    spotify: 'brandSpotify',
    tidal: 'brandTidal',
    youtube: 'brandYouTube',
};

const SERVICE_LABEL: Record<ExternalService, string> = {
    deezer: 'Deezer',
    qobuz: 'Qobuz',
    spotify: 'Spotify',
    tidal: 'Tidal',
    youtube: 'YouTube',
};

const resourceTypeFor = (itemType: LibraryItem) => {
    switch (itemType) {
        case LibraryItem.ALBUM:
            return 'album';
        case LibraryItem.ALBUM_ARTIST:
        case LibraryItem.ARTIST:
            return 'albumArtist';
        case LibraryItem.FOLDER:
            return 'folder';
        case LibraryItem.PLAYLIST:
            return 'playlist';
        default:
            return 'song';
    }
};

export const ShareAction = ({ items, itemType }: ShareActionProps) => {
    const { t } = useTranslation();

    const ids = useMemo(() => items.map((item) => item.id), [items]);
    const resourceType = useMemo(() => resourceTypeFor(itemType), [itemType]);

    const onSelect = useCallback(() => {
        openContextModal({
            innerProps: {
                itemIds: ids,
                resourceType,
            },
            modal: 'shareItem',
            title: t('page.contextMenu.shareItem'),
        });
    }, [ids, resourceType, t]);

    // A single external link can't stand in for a multi-item selection, and folders/playlists
    // have no MusicBrainz shape at all - both keep the original flat row, unchanged.
    const canLookUp = items.length === 1 && SHARE_LOOKUP_ELIGIBLE.has(itemType);

    if (!canLookUp) {
        return (
            <ContextMenu.Item leftIcon="share" onSelect={onSelect}>
                {t('page.contextMenu.shareItem')}
            </ContextMenu.Item>
        );
    }

    return (
        <ContextMenu.Submenu>
            <ContextMenu.SubmenuTarget>
                <ContextMenu.Item
                    leftIcon="share"
                    onSelect={(e) => e.preventDefault()}
                    rightIcon="arrowRightS"
                >
                    {t('page.contextMenu.shareItem')}
                </ContextMenu.Item>
            </ContextMenu.SubmenuTarget>
            <ContextMenu.SubmenuContent>
                <ContextMenu.Item leftIcon="clipboardCopy" onSelect={onSelect}>
                    {t('page.contextMenu.createShareLink')}
                </ContextMenu.Item>
                <ExternalLinkRows item={items[0]} itemType={itemType} />
            </ContextMenu.SubmenuContent>
        </ContextMenu.Submenu>
    );
};

interface ExternalLinkRowsProps {
    item: ShareableItem;
    itemType: LibraryItem;
}

/**
 * Mounted only once the submenu is actually open - `ContextMenu.SubmenuContent` gates its
 * children on hover-open, so pushing the query into its own component (instead of calling the
 * hook directly in `ShareAction`, which renders as soon as the whole context menu opens) is what
 * makes the MusicBrainz lookup fire on Share-row hover rather than on every right-click.
 */
function ExternalLinkRows({ item, itemType }: ExternalLinkRowsProps) {
    const { t } = useTranslation();

    const query = useQuery({
        // A week: the id-based path changes about as often as the release itself does, and even
        // the search fallback's result is stable enough not to worth re-checking every session.
        gcTime: 1000 * 60 * 60 * 24 * 14,
        queryFn: ({ signal }) => resolveShareLinks(itemType, item, signal),
        queryKey: ['context-menu', 'share-links', itemType, item.id] as const,
        staleTime: 1000 * 60 * 60 * 24 * 7,
    });

    // One spinner for the whole lookup, not one per service: the cascade resolves to one final
    // set of matches, so five independent spinners would misrepresent how this works. The
    // divider travels with the spinner/rows rather than sitting statically in the parent, so a
    // lookup that settles on zero matches leaves nothing dangling below "Create share link".
    if (query.isLoading) {
        return (
            <>
                <ContextMenu.Divider />
                <ContextMenu.Item disabled>
                    <Spinner container />
                </ContextMenu.Item>
            </>
        );
    }

    const entries = Object.entries(query.data ?? {}) as Array<[ExternalService, string]>;

    // Zero matches renders nothing further, not an empty-state row: a service only ever appears
    // here when MusicBrainz actually named it.
    if (entries.length === 0) {
        return null;
    }

    return (
        <>
            <ContextMenu.Divider />
            {entries.map(([service, url]) => (
                <ContextMenu.Item
                    key={service}
                    leftIcon={SERVICE_ICON[service]}
                    onSelect={() => {
                        void navigator.clipboard.writeText(url);
                        toast.success({ message: t('page.contextMenu.linkCopied') });
                    }}
                    rightIcon="clipboardCopy"
                >
                    {SERVICE_LABEL[service]}
                </ContextMenu.Item>
            ))}
        </>
    );
}
