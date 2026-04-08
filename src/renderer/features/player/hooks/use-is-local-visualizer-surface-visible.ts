import {
    useFullScreenPlayerStore,
    usePlaybackSettings,
    useShowVisualizerInSidebar,
} from '/@/renderer/store';

export function useIsLocalVisualizerSurfaceVisible(): boolean {
    const { webAudio: webAudioEnabled } = usePlaybackSettings();
    const showVisualizerInSidebar = useShowVisualizerInSidebar();
    const { activeTab, expanded, visualizerExpanded } = useFullScreenPlayerStore();

    const sidebarVisualizer = showVisualizerInSidebar && webAudioEnabled;
    const fullScreenPlayerVisualizerTab = expanded && activeTab === 'visualizer' && webAudioEnabled;
    const fullScreenVisualizerOverlay = visualizerExpanded && webAudioEnabled;

    return sidebarVisualizer || fullScreenPlayerVisualizerTab || fullScreenVisualizerOverlay;
}
