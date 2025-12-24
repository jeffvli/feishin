import { memo, useMemo } from 'react';
import z from 'zod';

import { api } from '/@/renderer/api';
import { GeneralSettingsSchema, useCurrentServerId, useSettingsStore } from '/@/renderer/store';
import { BaseImage, ImageProps } from '/@/shared/components/image/image';
import { LibraryItem } from '/@/shared/types/domain-types';

const BaseItemImage = (
    props: Omit<ImageProps, 'src'> & {
        id?: null | string;
        itemType: LibraryItem;
        src?: null | string;
    },
) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { src, ...rest } = props;

    const imageUrl = useItemImageUrl({ id: props.id, itemType: props.itemType, size: 300 });

    return <BaseImage src={imageUrl} {...rest} />;
};

export const ItemImage = memo(BaseItemImage);

interface UseItemImageUrlProps {
    id?: string;
    imageUrl?: null | string;
    itemType: LibraryItem;
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
                apiClientProps: { serverId },
                query: { id, itemType, size: size ?? sizeByType },
            }) || undefined
        );
    }, [id, imageUrl, itemType, serverId, size, sizeByType]);
};
