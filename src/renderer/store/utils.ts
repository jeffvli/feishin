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

const settingsKeys = [
    'store_settings_autoDJ',
    'store_settings_general',
    'store_settings_lists',
    'store_settings_hotkeys',
    'store_settings_playback',
    'store_settings_lyrics',
    'store_settings_window',
    'store_settings_discord',
    'store_settings_font',
    'store_settings_css',
    'store_settings_remote',
    'store_settings_queryBuilder',
    'store_settings_tab',
];

export const splitSettingsStorage: StateStorage = {
    getItem: (name: string): null | string => {
        if (name !== 'store_settings') {
            return localStorage.getItem(name);
        }

        // Read from all split keys and merge them
        const keys = settingsKeys;

        // Check if old single key exists (for migration)
        const oldKeyRaw = localStorage.getItem('store_settings');
        if (oldKeyRaw && !localStorage.getItem('store_settings_general')) {
            // Only migrate if split keys don't exist yet
            try {
                const oldData = JSON.parse(oldKeyRaw);
                const splitData: Record<string, unknown> = {};
                const state = oldData.state || oldData;

                if (state && typeof state === 'object') {
                    splitData.general = state.general;
                    splitData.lists = state.lists;
                    splitData.hotkeys = state.hotkeys;
                    splitData.playback = state.playback;
                    splitData.lyrics = state.lyrics;
                    splitData.window = state.window;
                    splitData.discord = state.discord;
                    splitData.font = state.font;
                    splitData.css = state.css;
                    splitData.remote = state.remote;
                    splitData.queryBuilder = state.queryBuilder;
                    splitData.tab = state.tab;

                    // Save to new split keys
                    keys.forEach((key) => {
                        const keyName = key.replace('store_settings_', '');
                        if (splitData[keyName] !== undefined) {
                            localStorage.setItem(key, JSON.stringify(splitData[keyName]));
                        }
                    });

                    // Store version if it exists
                    if (oldData.version !== undefined) {
                        localStorage.setItem('store_settings_version', oldData.version.toString());
                    }
                }
            } catch (e) {
                // If parsing fails, continue with reading from split keys
                console.warn('Failed to migrate old settings format:', e);
            }
        }

        // Read from all split keys
        const mergedState: Record<string, unknown> = {};
        let hasData = false;

        keys.forEach((key) => {
            const value = localStorage.getItem(key);
            if (value) {
                try {
                    const keyName = key.replace('store_settings_', '');
                    mergedState[keyName] = JSON.parse(value);
                    hasData = true;
                } catch (e) {
                    console.warn(`Failed to parse ${key}:`, e);
                }
            }
        });

        if (!hasData) {
            return null;
        }

        const versionKey = localStorage.getItem('store_settings_version');
        const version = versionKey ? parseInt(versionKey, 10) : 14;

        return JSON.stringify({
            state: mergedState,
            version,
        });
    },

    removeItem: (name: string): void => {
        if (name !== 'store_settings') {
            localStorage.removeItem(name);
            return;
        }

        // Remove all split keys
        const keys = settingsKeys;

        keys.forEach((key) => {
            localStorage.removeItem(key);
        });

        // Also remove old key if it exists
        localStorage.removeItem('store_settings');
    },

    setItem: (name: string, value: string): void => {
        if (name !== 'store_settings') {
            localStorage.setItem(name, value);
            return;
        }

        try {
            const data = JSON.parse(value);
            const state = data.state || data;

            const keys = settingsKeys.map((key) => ({
                key,
                value: state[key as keyof typeof state],
            }));

            keys.forEach(({ key, value: keyValue }) => {
                if (keyValue !== undefined) {
                    localStorage.setItem(key, JSON.stringify(keyValue));
                }
            });

            // Store version separately
            if (data.version !== undefined) {
                localStorage.setItem('store_settings_version', data.version.toString());
            }
        } catch (e) {
            console.error('Failed to split settings storage:', e);
            localStorage.setItem(name, value);
        }
    },
};
