import { memo, useMemo } from 'react';
import z from 'zod';

import { api } from '/@/renderer/api';
import {
    GeneralSettingsSchema,
    getServerById,
    useAuthStore,
    useCurrentServerId,
    useImageRes,
    useSettingsStore,
} from '/@/renderer/store';
import { BaseImage, ImageProps } from '/@/shared/components/image/image';
import { LibraryItem } from '/@/shared/types/domain-types';

const getUnloaderIcon = (itemType: LibraryItem) => {
    switch (itemType) {
        case LibraryItem.ALBUM:
            return 'emptyAlbumImage';
        case LibraryItem.ALBUM_ARTIST:
            return 'emptyArtistImage';
        case LibraryItem.ARTIST:
            return 'emptyArtistImage';
        case LibraryItem.GENRE:
            return 'emptyGenreImage';
        case LibraryItem.PLAYLIST:
            return 'emptyPlaylistImage';
        case LibraryItem.SONG:
            return 'emptySongImage';
        default:
            return 'emptyImage';
    }
};

const BaseItemImage = (
    props: Omit<ImageProps, 'id' | 'src'> & {
        id?: null | string;
        itemType: LibraryItem;
        serverId?: null | string;
        src?: null | string;
        type?: keyof z.infer<typeof GeneralSettingsSchema>['imageRes'];
    },
) => {
    const { serverId, src, ...rest } = props;

    const imageUrl = useItemImageUrl({
        id: props.id,
        imageUrl: src,
        itemType: props.itemType,
        serverId: serverId || undefined,
        type: props.type,
    });

    return (
        <BaseImage
            src={imageUrl}
            unloaderIcon={getUnloaderIcon(props.itemType)}
            {...rest}
            id={props.id || undefined}
        />
    );
};

export const ItemImage = memo(BaseItemImage);

interface UseItemImageUrlProps {
    id?: null | string;
    imageUrl?: null | string;
    itemType: LibraryItem;
    serverId?: string;
    size?: number;
    type?: keyof z.infer<typeof GeneralSettingsSchema>['imageRes'];
    useRemoteUrl?: boolean;
}

export const useItemImageUrl = (args: UseItemImageUrlProps) => {
    const { id, imageUrl, itemType, size, type, useRemoteUrl } = args;
    const serverId = useCurrentServerId();

    const imageRes = useImageRes();
    const sizeByType: number | undefined = type ? imageRes[type] : undefined;

    return useMemo(() => {
        if (imageUrl) {
            return imageUrl;
        }

        if (!id) {
            return undefined;
        }

        const targetServerId = args.serverId || serverId;
        let baseUrl: string | undefined;

        if (useRemoteUrl) {
            const server = getServerById(targetServerId);
            baseUrl = server?.remoteUrl || server?.url;
        }

        return (
            api.controller.getImageUrl({
                apiClientProps: { serverId: targetServerId },
                baseUrl,
                query: { id, itemType, size: size ?? sizeByType },
            }) || undefined
        );
    }, [args.serverId, id, imageUrl, itemType, serverId, size, sizeByType, useRemoteUrl]);
};

export function getItemImageUrl(args: UseItemImageUrlProps) {
    const { id, imageUrl, itemType, size, type, useRemoteUrl } = args;
    const authStore = useAuthStore.getState();
    const currentServerId = authStore.currentServer?.id;
    const serverId = (args.serverId || currentServerId) as string;

    const imageRes = useSettingsStore.getState().general.imageRes;
    const sizeByType: number | undefined = type ? imageRes[type] : undefined;

    if (imageUrl) {
        return imageUrl;
    }

    if (!id) {
        return undefined;
    }

    let baseUrl: string | undefined;

    if (useRemoteUrl) {
        const server = getServerById(serverId);
        baseUrl = server?.remoteUrl || server?.url;
    }

    return (
        api.controller.getImageUrl({
            apiClientProps: { serverId },
            baseUrl,
            query: { id, itemType, size: size ?? sizeByType },
        }) || undefined
    );
}
