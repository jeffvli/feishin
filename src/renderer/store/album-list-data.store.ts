import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createWithEqualityFn } from 'zustand/traditional';

export interface AlbumListDataSlice extends AlbumListDataState {
    actions: {
        setItemData: (data: any[]) => void;
        setItemDataById: (id: string, data: any) => void;
    };
}

export interface AlbumListDataState {
    itemData: any[];
}

export const useAlbumListDataStore = createWithEqualityFn<AlbumListDataSlice>()(
    devtools(
        immer((set) => ({
            actions: {
                setItemData: (data) => {
                    set((state) => {
                        state.itemData = data;
                    });
                },
                setItemDataById: (id, data) => {
                    set((state) => {
                        const index = state.itemData.findIndex((item) => item?.id === id);
                        if (index === -1) return;
                        state.itemData[index] = { ...state.itemData[index], ...data };
                    });
                },
            },
            itemData: [],
        })),
        { name: 'store_album_list_data' },
    ),
);

export const useAlbumListStoreActions = () => useAlbumListDataStore((state) => state.actions);

export const useAlbumListItemData = () =>
    useAlbumListDataStore((state) => {
        return { itemData: state.itemData, setItemData: state.actions.setItemData };
    });

export const useSetAlbumListItemDataById = () =>
    useAlbumListDataStore((state) => state.actions.setItemDataById);
