import { memo, useMemo } from 'react';
import z from 'zod';

import { api } from '/@/renderer/api';
import {
    GeneralSettingsSchema,
    useAuthStore,
    useCurrentServerId,
    useSettingsStore,
} from '/@/renderer/store';
import { BaseImage, ImageProps } from '/@/shared/components/image/image';
import { LibraryItem } from '/@/shared/types/domain-types';

const BaseItemImage = (
    props: Omit<ImageProps, 'src'> & {
        id?: null | string;
        itemType: LibraryItem;
        src?: null | string;
    },
) => {
    const { src, ...rest } = props;

    const imageUrl = useItemImageUrl({
        id: props.id,
        imageUrl: src,
        itemType: props.itemType,
        size: 300,
    });

    return <BaseImage src={imageUrl} {...rest} />;
};

export const ItemImage = memo(BaseItemImage);

interface UseItemImageUrlProps {
    id?: string;
    imageUrl?: null | string;
    itemType: LibraryItem;
    serverId?: string;
    size?: number;
    type?: keyof z.infer<typeof GeneralSettingsSchema>['imageRes'];
}

export const useItemImageUrl = (args: UseItemImageUrlProps) => {
    const { id, imageUrl, itemType, size, type } = args;
    const serverId = useCurrentServerId();

    const imageRes = useSettingsStore((store) => store.general.imageRes);
    const sizeByType: number | undefined = type ? imageRes[type] : undefined;

    return useMemo(() => {
        if (imageUrl) {
            return imageUrl;
        }

        if (!id) {
            return undefined;
        }

        return (
            api.controller.getImageUrl({
                apiClientProps: { serverId: args.serverId || serverId },
                query: { id, itemType, size: size ?? sizeByType },
            }) || undefined
        );
    }, [args.serverId, id, imageUrl, itemType, serverId, size, sizeByType]);
};

export function getItemImageUrl(args: UseItemImageUrlProps) {
    const { id, imageUrl, itemType, size, type } = args;
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

    return (
        api.controller.getImageUrl({
            apiClientProps: { serverId },
            query: { id, itemType, size: size ?? sizeByType },
        }) || undefined
    );
}
