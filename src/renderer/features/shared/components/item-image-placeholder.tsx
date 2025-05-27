import clsx from 'clsx';
import { memo } from 'react';
import { RiAlbumFill, RiPlayListFill, RiUserVoiceFill } from 'react-icons/ri';

import styles from './item-image-placeholder.module.css';

import { Center } from '/@/shared/components/center/center';
import { LibraryItem } from '/@/shared/types/domain-types';

interface ItemImagePlaceholderProps {
    itemType?: LibraryItem;
}

const Image = memo(function Image(props: ItemImagePlaceholderProps) {
    switch (props.itemType) {
        case LibraryItem.ALBUM:
            return <RiAlbumFill />;
        case LibraryItem.ALBUM_ARTIST:
            return <RiUserVoiceFill />;
        case LibraryItem.ARTIST:
            return <RiUserVoiceFill />;
        case LibraryItem.PLAYLIST:
            return <RiPlayListFill />;
        default:
            return <RiAlbumFill />;
    }
});

export const ItemImagePlaceholder = ({ itemType }: ItemImagePlaceholderProps) => {
    return (
        <Center className={clsx(styles.imagePlaceholder, 'item-image-placeholder')}>
            <Image itemType={itemType} />
        </Center>
    );
};
