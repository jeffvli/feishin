import { memo, useMemo, useSyncExternalStore } from 'react';
import z from 'zod';

import { api } from '/@/renderer/api';
import {
    GeneralSettingsSchema,
    getServerById,
    useAnimatedCoversSettings,
    useAuthStore,
    useCurrentServerId,
    useGeneralSettings,
    useImagePlaceholderPriority,
    useImageRes,
    useSettingsStore,
} from '/@/renderer/store';
import { BaseImage, ImageProps } from '/@/shared/components/image/image';
import { useImageHashUrl } from '/@/shared/hooks/use-image-hash-url';
import { ExplicitStatus, ImageRequest, LibraryItem } from '/@/shared/types/domain-types';

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

const subscribeWindowFocus = (onChange: () => void) => {
    window.addEventListener('focus', onChange);
    window.addEventListener('blur', onChange);
    return () => {
        window.removeEventListener('focus', onChange);
        window.removeEventListener('blur', onChange);
    };
};

// Battery Status API (UPower on Linux). Desktops without a battery report `charging: true`.
type BatteryManager = EventTarget & { charging: boolean };
let isOnBattery = false;
const batteryListeners = new Set<() => void>();
(navigator as Navigator & { getBattery?: () => Promise<BatteryManager> })
    .getBattery?.()
    .then((battery) => {
        const update = () => {
            isOnBattery = !battery.charging;
            batteryListeners.forEach((listener) => listener());
        };
        battery.addEventListener('chargingchange', update);
        update();
    })
    .catch(() => {});
const subscribeBattery = (onChange: () => void) => {
    batteryListeners.add(onChange);
    return () => {
        batteryListeners.delete(onChange);
    };
};

// Animated covers are decoded every frame on the CPU, even when the window is only covered.
export const useAnimateCovers = (isCurrentSong = false) => {
    const { animatedCovers, animatedCoversOnBattery, pauseWhenUnfocused } =
        useAnimatedCoversSettings();
    const isFocused = useSyncExternalStore(subscribeWindowFocus, () => document.hasFocus());
    const onBattery = useSyncExternalStore(subscribeBattery, () => isOnBattery);

    if (animatedCovers === 'none') return false;
    if (onBattery && !animatedCoversOnBattery) return false;
    if (animatedCovers === 'currentSong' && !isCurrentSong) return false;
    return isFocused || !pauseWhenUnfocused;
};

const BaseItemImage = (
    props: Omit<ImageProps, 'id' | 'src'> & {
        blurHash?: null | string;
        dominantColor?: null | string;
        explicitStatus?: ExplicitStatus | null;
        id?: null | string;
        isCurrentSong?: boolean;
        itemType: LibraryItem;
        serverId?: null | string;
        size?: number;
        src?: null | string;
        thumbHash?: null | string;
        type?: keyof z.infer<typeof GeneralSettingsSchema>['imageRes'];
    },
) => {
    const {
        blurHash,
        dominantColor,
        explicitStatus,
        isCurrentSong,
        serverId,
        size,
        src,
        thumbHash,
        ...rest
    } = props;
    const playAnimation = useAnimateCovers(isCurrentSong);
    const { blurExplicitImages } = useGeneralSettings();
    const imagePlaceholderPriority = useImagePlaceholderPriority();
    const hashUrl = useImageHashUrl(thumbHash, blurHash, dominantColor, imagePlaceholderPriority);

    const imageUrl = useItemImageUrl({
        id: props.id,
        imageUrl: src,
        itemType: props.itemType,
        serverId: serverId || undefined,
        size,
        type: props.type,
    });

    const imageRequest = useItemImageRequest({
        id: props.id,
        imageUrl: src,
        itemType: props.itemType,
        serverId: serverId || undefined,
        size,
        type: props.type,
    });

    const isExplicit = blurExplicitImages && explicitStatus === ExplicitStatus.EXPLICIT;

    return (
        <BaseImage
            hashUrl={hashUrl}
            imageRequest={imageRequest}
            isExplicit={isExplicit}
            playAnimation={playAnimation}
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

export const useItemImageRequest = (args: UseItemImageUrlProps) => {
    const { id, imageUrl, itemType, size, type, useRemoteUrl } = args;
    const serverId = useCurrentServerId();

    const imageRes = useImageRes();
    const sizeByType: number | undefined = type ? imageRes[type] : undefined;

    return useMemo(() => {
        if (imageUrl) {
            return {
                cacheKey: imageUrl,
                url: imageUrl,
            } satisfies ImageRequest;
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
            api.controller.getImageRequest({
                apiClientProps: { serverId: targetServerId },
                baseUrl,
                query: { id, itemType, size: size ?? sizeByType },
            }) || undefined
        );
    }, [args.serverId, id, imageUrl, itemType, serverId, size, sizeByType, useRemoteUrl]);
};

export function getItemImageRequest(args: UseItemImageUrlProps) {
    const { id, imageUrl, itemType, size, type, useRemoteUrl } = args;
    const authStore = useAuthStore.getState();
    const currentServerId = authStore.currentServer?.id;
    const serverId = (args.serverId || currentServerId) as string;

    const imageRes = useSettingsStore.getState().general.imageRes;
    const sizeByType: number | undefined = type ? imageRes[type] : undefined;

    if (imageUrl) {
        return {
            cacheKey: imageUrl,
            url: imageUrl,
        } satisfies ImageRequest;
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
        api.controller.getImageRequest({
            apiClientProps: { serverId },
            baseUrl,
            query: { id, itemType, size: size ?? sizeByType },
        }) || undefined
    );
}

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
