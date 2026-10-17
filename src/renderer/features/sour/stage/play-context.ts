import { create } from 'zustand';

// Which playlist the queue was started from, for the Sour Stage backdrop (a themed playlist's picture).
// Set when a playlist is played from anywhere (its page, a card, the sidebar, a right-click), or worked
// out from the page that's open when a new queue starts.
export const usePlayContext = create<{ at: number; playlistId: null | string }>(() => ({
    at: 0,
    playlistId: null,
}));

// a playlist (or something else, with null) was just started
export const markPlayContext = (playlistId: null | string) =>
    usePlayContext.setState({ at: Date.now(), playlistId });
