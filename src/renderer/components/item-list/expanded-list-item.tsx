import { Suspense } from 'react';

import styles from './expanded-list-item.module.css';

import { ItemListStateItem } from '/@/renderer/components/item-list/helpers/item-list-state';
import { ExpandedAlbumListItem } from '/@/renderer/features/albums/components/expanded-album-list-item';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { LibraryItem } from '/@/shared/types/domain-types';

interface ExpandedListItemProps {
    item?: ItemListStateItem;
    itemType: LibraryItem;
}

export const ExpandedListItem = ({ item, itemType }: ExpandedListItemProps) => {
    if (!item) {
        return null;
    }

    return (
        <div className={styles.container}>
            <div className={styles.inner}>
                <Suspense fallback={<Spinner container />}>
                    <SelectedItem item={item} itemType={itemType} />
                </Suspense>
            </div>
        </div>
    );
};

interface SelectedItemProps {
    item: ItemListStateItem;
    itemType: LibraryItem;
}

const SelectedItem = ({ item, itemType }: SelectedItemProps) => {
    switch (itemType) {
        case LibraryItem.ALBUM:
            return <ExpandedAlbumListItem item={item} />;
        default:
            return null;
    }
};
