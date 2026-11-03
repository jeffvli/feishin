import merge from 'lodash/merge';
import { nanoid } from 'nanoid/non-secure';
import { z } from 'zod';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createWithEqualityFn } from 'zustand/traditional';

import { useAuthStore } from '/@/renderer/store/auth.store';
import { InternetRadioStation, ServerType } from '/@/shared/types/domain-types';

export interface RadioStoreSlice extends RadioStoreState {
    actions: {
        createStation: (
            serverId: string,
            station: Omit<InternetRadioStation, 'id'>,
        ) => InternetRadioStation;
        deleteStation: (serverId: string, stationId: string) => void;
        getStation: (serverId: string, stationId: string) => InternetRadioStation | null;
        getStations: (serverId: string) => InternetRadioStation[];
        updateStation: (
            serverId: string,
            stationId: string,
            updates: Partial<InternetRadioStation>,
        ) => void;
    };
}

export interface RadioStoreState {
    stations: Record<string, Record<string, InternetRadioStation>>;
}

const initialState: RadioStoreState = {
    stations: {},
};

export const useRadioStore = createWithEqualityFn<RadioStoreSlice>()(
    persist(
        devtools(
            immer((set, get) => ({
                ...initialState,
                actions: {
                    createStation: (serverId, station) => {
                        const id = nanoid();
                        const newStation: InternetRadioStation = {
                            ...station,
                            id,
                        };

                        set((state) => {
                            if (!state.stations[serverId]) {
                                state.stations[serverId] = {};
                            }
                            state.stations[serverId][id] = newStation;
                        });

                        return newStation;
                    },
                    deleteStation: (serverId, stationId) => {
                        set((state) => {
                            if (state.stations[serverId]) {
                                delete state.stations[serverId][stationId];
                                // Clean up empty server entries
                                if (Object.keys(state.stations[serverId]).length === 0) {
                                    delete state.stations[serverId];
                                }
                            }
                        });
                    },
                    getStation: (serverId, stationId) => {
                        const state = get();
                        return state.stations[serverId]?.[stationId] || null;
                    },
                    getStations: (serverId) => {
                        const state = get();
                        const serverStations = state.stations[serverId];
                        if (!serverStations) {
                            return [];
                        }
                        return Object.values(serverStations);
                    },
                    updateStation: (serverId, stationId, updates) => {
                        set((state) => {
                            if (state.stations[serverId]?.[stationId]) {
                                state.stations[serverId][stationId] = {
                                    ...state.stations[serverId][stationId],
                                    ...updates,
                                };
                            }
                        });
                    },
                },
            })),
            { name: 'store_radio' },
        ),
        {
            merge: (persistedState, currentState) => merge(currentState, persistedState),
            name: 'store_radio',
            version: 1,
        },
    ),
);

export const useRadioStoreActions = () => useRadioStore((state) => state.actions);

export const useRadioStations = (serverId: string) => {
    return useRadioStore((state) => {
        const serverStations = state.stations[serverId];
        if (!serverStations) {
            return [];
        }
        return Object.values(serverStations);
    });
};

export const useRadioStation = (serverId: string, stationId: string) => {
    return useRadioStore((state) => state.stations[serverId]?.[stationId] || null);
};

// Server ids are generated per install, so exported stations are matched back to servers by
// type and url (preferring the same username) when importing
export const ExportedRadioStationsSchema = z.array(
    z.object({
        server: z.object({
            type: z.nativeEnum(ServerType),
            url: z.string(),
            username: z.string(),
        }),
        stations: z.array(
            z.object({
                homepageUrl: z.string().nullable(),
                imageId: z.string().nullish(),
                imageUrl: z.string().nullish(),
                name: z.string(),
                streamUrl: z.string(),
                thumbHash: z.string().nullish(),
                uploadedImage: z.string().nullish(),
            }),
        ),
    }),
);

export type ExportedRadioStations = z.infer<typeof ExportedRadioStationsSchema>;

const normalizeUrl = (url: string) => url.replace(/\/+$/, '');

export const getRadioStationsForExport = (): ExportedRadioStations => {
    const { serverList } = useAuthStore.getState();

    return Object.entries(useRadioStore.getState().stations).flatMap(([serverId, stations]) => {
        const server = serverList[serverId];
        if (!server || Object.keys(stations).length === 0) {
            return [];
        }

        return {
            server: { type: server.type, url: server.url, username: server.username },
            // eslint-disable-next-line @typescript-eslint/no-unused-vars -- ids are regenerated on import
            stations: Object.values(stations).map(({ id, ...station }) => station),
        };
    });
};

export const importRadioStations = (exported: ExportedRadioStations) => {
    const servers = Object.values(useAuthStore.getState().serverList);
    const { createStation, getStations } = useRadioStore.getState().actions;

    for (const { server, stations } of exported) {
        const candidates = servers.filter(
            (s) => s.type === server.type && normalizeUrl(s.url) === normalizeUrl(server.url),
        );
        const target = candidates.find((s) => s.username === server.username) ?? candidates[0];
        if (!target) {
            continue;
        }

        const existingUrls = new Set(getStations(target.id).map((s) => s.streamUrl));
        for (const station of stations) {
            if (!existingUrls.has(station.streamUrl)) {
                createStation(target.id, station);
                existingUrls.add(station.streamUrl);
            }
        }
    }
};
