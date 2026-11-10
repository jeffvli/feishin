import merge from 'lodash/merge';
import { nanoid } from 'nanoid/non-secure';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createWithEqualityFn } from 'zustand/traditional';

import { InternetRadioStation } from '/@/shared/types/domain-types';

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
