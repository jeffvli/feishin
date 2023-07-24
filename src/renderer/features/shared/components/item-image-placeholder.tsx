import { Center } from '@mantine/core';
import { memo } from 'react';
import { RiAlbumFill, RiPlayListFill, RiUserVoiceFill } from 'react-icons/ri';
import styles from './item-image-placeholder.module.scss';
import { LibraryItem } from '/@/renderer/api/types';

interface ItemImagePlaceholderProps {
    itemType?: LibraryItem;
}

const Image = memo(function Image(props: ItemImagePlaceholderProps) {
    switch (props.itemType) {
        case LibraryItem.ALBUM:
            return <RiAlbumFill />;
        case LibraryItem.ARTIST:
            return <RiUserVoiceFill />;
        case LibraryItem.ALBUM_ARTIST:
            return <RiUserVoiceFill />;
        case LibraryItem.PLAYLIST:
            return <RiPlayListFill />;
        default:
            return <RiAlbumFill />;
    }
});

export const ItemImagePlaceholder = ({ itemType }: ItemImagePlaceholderProps) => {
    return (
        <Center className={styles.imagePlaceholder}>
            <Image itemType={itemType} />
        </Center>
    );
};
