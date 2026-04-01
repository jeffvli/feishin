import type { QueueData, QueueSong } from '/@/shared/types/domain-types';
import type { PersistStorage, StateStorage } from 'zustand/middleware';

import { del, get, set } from 'idb-keyval';
import mergeWith from 'lodash/mergeWith';

type PlayerStorePersistedSlice = {
    player?: unknown;
    queue?: QueueData;
};

export function cleanQueueForPersistence(queue: QueueData): QueueData {
    const allQueueIds = new Set(queue.default || []);
    const songs = queue.songs || {};
    const cleanedSongs: Record<string, QueueSong> = {};

    for (const [id, song] of Object.entries(songs)) {
        if (allQueueIds.has(id)) {
            cleanedSongs[id] = song;
        }
    }

    return {
        ...queue,
        songs: cleanedSongs,
    };
}

// Migrate from v3 to v4 to handle queue migration
export async function migratePlayerStorePersist(storeName: string): Promise<void> {
    const mainRaw = await get(storeName);
    if (!mainRaw) {
        return;
    }

    let parsed: { state?: { player?: unknown; queue?: QueueData }; version?: number };
    try {
        parsed = JSON.parse(mainRaw as string);
    } catch {
        return;
    }

    const embeddedQueue = parsed.state?.queue;
    if (embeddedQueue === undefined) {
        return;
    }

    const queueKey = `${storeName}-queue`;
    const queueSeparateRaw = await get(queueKey);

    if (!queueSeparateRaw) {
        const cleaned = cleanQueueForPersistence(embeddedQueue);
        await set(queueKey, JSON.stringify(cleaned));
    }

    await set(
        storeName,
        JSON.stringify({
            state: { player: parsed.state?.player },
            version: parsed.version,
        }),
    );
}

function playerStoreQueueKey(storeName: string): string {
    return `${storeName}-queue`;
}

let lastPersistedPlayerQueueRef: QueueData | undefined;

export const playerStoreStorage: PersistStorage<unknown> = {
    getItem: async (name) => {
        const mainRaw = await get(name);
        if (!mainRaw) {
            return null;
        }

        let parsed: { state?: { player?: unknown; queue?: QueueData }; version?: number };
        try {
            parsed = JSON.parse(mainRaw as string);
        } catch {
            return null;
        }

        const version = parsed.version;
        let queue: QueueData | undefined;
        const queueRaw = await get(playerStoreQueueKey(name));

        if (queueRaw) {
            try {
                queue = JSON.parse(queueRaw as string) as QueueData;
            } catch {
                queue = undefined;
            }
        } else if (parsed.state?.queue) {
            // Fallback to legacy format if queue is not found
            queue = parsed.state.queue;
        }

        return {
            state: {
                player: parsed.state?.player,
                queue,
            } satisfies PlayerStorePersistedSlice,
            version,
        };
    },

    removeItem: async (name) => {
        lastPersistedPlayerQueueRef = undefined;
        await del(name);
        await del(playerStoreQueueKey(name));
    },

    setItem: async (name, value) => {
        const { state: rawState, version } = value;
        const state = rawState as PlayerStorePersistedSlice;
        const player = state.player;

        await set(
            name,
            JSON.stringify({
                state: { player },
                version,
            }),
        );

        if (state.queue === undefined) {
            lastPersistedPlayerQueueRef = undefined;
            await del(playerStoreQueueKey(name));
            return;
        }

        if (state.queue === lastPersistedPlayerQueueRef) {
            return;
        }

        const cleaned = cleanQueueForPersistence(state.queue);
        await set(playerStoreQueueKey(name), JSON.stringify(cleaned));
        lastPersistedPlayerQueueRef = state.queue;
    },
};

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
