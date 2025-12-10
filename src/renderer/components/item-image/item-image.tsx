import { memo, useMemo } from 'react';

import { api } from '/@/renderer/api';
import { useCurrentServerId } from '/@/renderer/store';
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
    type?: 'lg' | 'md' | 'original' | 'sm' | 'xl' | 'xs';
}

export const useItemImageUrl = (args: UseItemImageUrlProps) => {
    const { id, imageUrl, itemType, size, type = 'md' } = args;
    const serverId = useCurrentServerId();

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
                query: { id, itemType, size: getSize(type, size) },
            }) || undefined
        );
    }, [id, imageUrl, itemType, serverId, size, type]);
};

const getSize = (type: UseItemImageUrlProps['type'], size?: number) => {
    if (size) {
        return size;
    }

    switch (type) {
        case 'lg':
            return 500;
        case 'md':
            return 300;
        case 'sm':
            return 60;
        case 'xl':
            return 1000;
        case 'xs':
            return 30;
        default:
            return undefined;
    }
};
