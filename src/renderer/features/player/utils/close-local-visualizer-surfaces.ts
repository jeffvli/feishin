import { useFullScreenPlayerStore, useSettingsStore } from '/@/renderer/store';

export function closeLocalVisualizerSurfaces(): void {
    const fullScreen = useFullScreenPlayerStore.getState();
    fullScreen.actions.setStore({
        ...(fullScreen.expanded && fullScreen.activeTab === 'visualizer'
            ? { activeTab: 'queue' as const }
            : {}),
        visualizerExpanded: false,
    });

    useSettingsStore.getState().actions.setSettings({
        general: { showVisualizerInSidebar: false },
    });
}
