import { useMemo } from 'react';

import { useHotkeySettings, usePlayerStore } from '/@/renderer/store';
import { HotkeyItem, useHotkeys } from '/@/shared/hooks/use-hotkeys';

export const usePlaybackHotkeys = () => {
    const { bindings } = useHotkeySettings();
    const player = usePlayerStore();

    const playbackHotkeysItems = useMemo(() => {
        const hotkeyItems: HotkeyItem[] = [];

        const bindingHandlers: Array<{
            binding: (typeof bindings)[keyof typeof bindings];
            handler: () => void;
        }> = [
            { binding: bindings.next, handler: () => player.mediaNext() },
            { binding: bindings.pause, handler: () => player.mediaPause() },
            { binding: bindings.play, handler: () => player.mediaPlay() },
            { binding: bindings.playPause, handler: () => player.mediaTogglePlayPause() },
            { binding: bindings.previous, handler: () => player.mediaPrevious() },
            { binding: bindings.skipBackward, handler: () => player.mediaSkipBackward() },
            { binding: bindings.skipForward, handler: () => player.mediaSkipForward() },
            { binding: bindings.stop, handler: () => player.mediaStop() },
            { binding: bindings.toggleRepeat, handler: () => player.toggleRepeat() },
            { binding: bindings.toggleShuffle, handler: () => player.toggleShuffle() },
        ];

        // Filter and map to hotkey items
        bindingHandlers.forEach(({ binding, handler }) => {
            if (!binding.isGlobal && binding.hotkey && binding.hotkey !== '') {
                hotkeyItems.push([binding.hotkey, handler]);
            }
        });

        return hotkeyItems;
    }, [bindings, player]);

    useHotkeys(playbackHotkeysItems);
};
