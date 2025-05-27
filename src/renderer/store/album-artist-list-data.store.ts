import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createWithEqualityFn } from 'zustand/traditional';

export interface AlbumArtistListDataSlice extends AlbumArtistListDataState {
    actions: {
        setItemData: (data: any[]) => void;
    };
}

export interface AlbumArtistListDataState {
    itemData: any[];
}

export const useAlbumArtistListDataStore = createWithEqualityFn<AlbumArtistListDataSlice>()(
    devtools(
        immer((set) => ({
            actions: {
                setItemData: (data) => {
                    set((state) => {
                        state.itemData = data;
                    });
                },
            },
            itemData: [],
        })),
        { name: 'store_album_list_data' },
    ),
);

export const useAlbumArtistListStoreActions = () =>
    useAlbumArtistListDataStore((state) => state.actions);

export const useAlbumArtistListItemData = () =>
    useAlbumArtistListDataStore((state) => {
        return { itemData: state.itemData, setItemData: state.actions.setItemData };
    });
