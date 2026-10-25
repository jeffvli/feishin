import { describe, expect, it, vi } from 'vitest';

import { getDraggedItems } from '/@/renderer/components/item-list/helpers/get-dragged-items';
import { ItemListStateActions } from '/@/renderer/components/item-list/helpers/item-list-state';
import { LibraryItem, Song } from '/@/shared/types/domain-types';

const song = (id: string) =>
    ({ _itemType: LibraryItem.SONG, _serverId: 'server', id }) as unknown as Song;

const listState = (selected: unknown[]) => {
    const setSelected = vi.fn();
    const state = {
        extractRowId: (item: unknown) => (item as { id?: string }).id,
        getSelected: () => selected,
        setSelected,
    } as unknown as ItemListStateActions;
    return { setSelected, state };
};

describe('getDraggedItems', () => {
    const a = song('a');
    const b = song('b');
    const c = song('c');

    it('drags nothing for missing or incomplete items', () => {
        expect(getDraggedItems(undefined)).toEqual([]);
        expect(getDraggedItems({ id: 'x' } as Song)).toEqual([]);
    });

    it('drags the single item without list state', () => {
        expect(getDraggedItems(a)).toEqual([a]);
    });

    it('drags the whole selection when the dragged item is selected', () => {
        const { setSelected, state } = listState([a, b]);
        expect(getDraggedItems(b, state)).toEqual([a, b]);
        expect(setSelected).not.toHaveBeenCalled();
    });

    it('selects and drags only an unselected item', () => {
        const { setSelected, state } = listState([a, b]);
        expect(getDraggedItems(c, state)).toEqual([c]);
        expect(setSelected).toHaveBeenCalledWith([c]);
    });

    it('leaves the selection alone when asked not to update it', () => {
        const { setSelected, state } = listState([a]);
        expect(getDraggedItems(c, state, false)).toEqual([c]);
        expect(setSelected).not.toHaveBeenCalled();
    });
});
