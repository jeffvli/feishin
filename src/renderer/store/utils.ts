import { del, get, set } from 'idb-keyval';
import mergeWith from 'lodash/mergeWith';
import { StateStorage } from 'zustand/middleware';
/**
 * A custom deep merger that will replace all 'columns' items with the persistent
 * state, instead of the default merge behavior. This is important to preserve the user's
 * order, and not lead to an inconsistent state (e.g. multiple 'Favorite' keys)
 * @param persistedState the persistent state
 * @param currentState the current state
 * @returns the a custom deep merge
 */
export const mergeOverridingColumns = <T>(persistedState: unknown, currentState: T) => {
    return mergeWith(currentState, persistedState, (_original, persistent, key) => {
        if (key === 'columns') {
            return persistent;
        }

        return undefined;
    });
};

export const idbStateStorage: StateStorage = {
    getItem: async (name: string): Promise<null | string> => {
        return (await get(name)) || null;
    },
    removeItem: async (name: string): Promise<void> => {
        await del(name);
    },
    setItem: async (name: string, value: string): Promise<void> => {
        await set(name, value);
    },
};
