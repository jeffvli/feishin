import { type RefObject, useRef } from 'react';
import { useNavigate } from 'react-router';

import { getTitlePath } from '/@/renderer/components/item-list/helpers/get-title-path';
import {
    ItemListStateActions,
    ItemListStateItemWithRequiredProperties,
} from '/@/renderer/components/item-list/helpers/item-list-state';
import { ItemControls } from '/@/renderer/components/item-list/types';
import { useHotkeys } from '/@/renderer/hooks/use-hotkeys';
import { useHotkeySettings, usePlayButtonBehavior } from '/@/renderer/store';
import { LibraryItem } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

export const useListHotkeys = ({
    controls,
    focusContainerRef,
    focused,
    internalState,
    itemType,
    onShowPlayingSong,
}: {
    controls: ItemControls;
    focusContainerRef?: RefObject<HTMLElement | null>;
    focused: boolean;
    internalState: ItemListStateActions;
    itemType: LibraryItem;
    onShowPlayingSong?: () => void;
}) => {
    const { bindings } = useHotkeySettings();
    const playButtonBehavior = usePlayButtonBehavior();
    const navigate = useNavigate();
    const focusedRef = useRef(focused);
    focusedRef.current = focused;
    const internalStateRef = useRef(internalState);
    internalStateRef.current = internalState;

    const isListFocused = () => {
        const container = focusContainerRef?.current;
        if (container) {
            return container.contains(document.activeElement);
        }

        return focusedRef.current;
    };

    // Helper to check if item has required properties
    const hasRequiredStateItemProperties = (
        item: unknown,
    ): item is ItemListStateItemWithRequiredProperties => {
        return (
            typeof item === 'object' &&
            item !== null &&
            'id' in item &&
            typeof (item as any).id === 'string' &&
            '_serverId' in item &&
            typeof (item as any)._serverId === 'string' &&
            '_itemType' in item &&
            typeof (item as any)._itemType === 'string'
        );
    };

    useHotkeys([
        [
            'mod+a',
            () => {
                if (!isListFocused()) return;

                const state = internalStateRef.current;
                if (state.isAllSelected()) {
                    state.deselectAll();
                } else {
                    state.selectAll();
                }
            },
        ],
        [
            bindings.listPlayDefault.hotkey,
            () => {
                if (!isListFocused()) return;
                const selected = internalState.getSelected();
                const validSelected = selected.filter(hasRequiredStateItemProperties);
                if (validSelected.length === 0) return;

                const item = validSelected[0];
                const playType = playButtonBehavior;
                controls.onPlay?.({ item, itemType, playType } as any);
            },
        ],
        [
            bindings.listPlayNow.hotkey,
            () => {
                if (!isListFocused()) return;
                const selected = internalState.getSelected();
                const validSelected = selected.filter(hasRequiredStateItemProperties);
                if (validSelected.length === 0) return;

                const item = validSelected[0];
                controls.onPlay?.({ item, itemType, playType: Play.NOW } as any);
            },
        ],
        [
            bindings.listPlayNext.hotkey,
            () => {
                if (!isListFocused()) return;
                const selected = internalState.getSelected();
                const validSelected = selected.filter(hasRequiredStateItemProperties);
                if (validSelected.length === 0) return;

                const item = validSelected[0];
                controls.onPlay?.({ item, itemType, playType: Play.NEXT } as any);
            },
        ],
        [
            bindings.listPlayLast.hotkey,
            () => {
                if (!isListFocused()) return;
                const selected = internalState.getSelected();
                const validSelected = selected.filter(hasRequiredStateItemProperties);
                if (validSelected.length === 0) return;

                const item = validSelected[0];
                controls.onPlay?.({ item, itemType, playType: Play.LAST } as any);
            },
        ],
        [
            bindings.listNavigateToPage.hotkey,
            () => {
                if (!isListFocused()) return;
                const selected = internalState.getSelected();
                const validSelected = selected.filter(hasRequiredStateItemProperties);
                if (validSelected.length === 0) return;

                const item = validSelected[0];
                const path = getTitlePath(itemType, item.id);
                if (path) {
                    navigate(path, { state: { item } });
                }
            },
        ],
        [
            bindings.listShowPlayingSong.hotkey,
            () => {
                onShowPlayingSong?.();
            },
        ],
    ]);
};
