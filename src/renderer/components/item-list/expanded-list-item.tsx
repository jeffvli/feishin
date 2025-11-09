import { Suspense } from 'react';

import styles from './expanded-list-item.module.css';

import {
    ItemListStateItem,
    ItemListStateActions,
} from '/@/renderer/components/item-list/helpers/item-list-state';
import { ExpandedAlbumListItem } from '/@/renderer/features/albums/components/expanded-album-list-item';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { LibraryItem } from '/@/shared/types/domain-types';

interface ExpandedListItemProps {
    internalState: ItemListStateActions;
    itemType: LibraryItem;
}

export const ExpandedListItem = ({ internalState, itemType }: ExpandedListItemProps) => {
    const expandedItems = internalState.getExpanded();
    const currentItem = expandedItems[0];

    if (!currentItem) {
        return null;
    }

    return (
        <div className={styles.container}>
            <div className={styles.inner}>
                <Suspense fallback={<Spinner container />}>
                    <SelectedItem item={currentItem} itemType={itemType} />
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
