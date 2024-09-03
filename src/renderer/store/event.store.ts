import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export type FavoriteEvent = {
    event: 'favorite';
    favorite: boolean;
};

export type PlayEvent = {
    event: 'play';
    timestamp: string;
};

export type RatingEvent = {
    event: 'rating';
    rating: number | null;
};

export type UserEvent = FavoriteEvent | PlayEvent | RatingEvent;

export interface EventState {
    event: UserEvent | null;
    ids: string[];
}

export interface EventSlice extends EventState {
    actions: {
        favorite: (ids: string[], favorite: boolean) => void;
        play: (ids: string[]) => void;
        rate: (ids: string[], rating: number | null) => void;
    };
}

export const useEventStore = create<EventSlice>()(
    subscribeWithSelector(
        devtools(
            immer((set) => ({
                actions: {
                    favorite(ids, favorite) {
                        set((state) => {
                            state.event = { event: 'favorite', favorite };
                            state.ids = ids;
                        });
                    },
                    play(ids) {
                        set((state) => {
                            state.event = { event: 'play', timestamp: new Date().toISOString() };
                            state.ids = ids;
                        });
                    },
                    rate(ids, rating) {
                        set((state) => {
                            state.event = { event: 'rating', rating };
                            state.ids = ids;
                        });
                    },
                },
                event: null,
                ids: [],
            })),
            { name: 'event_store' },
        ),
    ),
);

export const useFavoriteEvent = () => useEventStore((state) => state.actions.favorite);

export const usePlayEvent = () => useEventStore((state) => state.actions.play);

export const useRatingEvent = () => useEventStore((state) => state.actions.rate);
