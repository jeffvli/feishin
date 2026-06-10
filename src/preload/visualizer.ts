import { ipcRenderer } from 'electron';

const setLocalSurfaceVisible = (visible: boolean) => {
    ipcRenderer.send('visualizer-set-local-surface-visible', visible);
};

export const visualizer = {
    setLocalSurfaceVisible,
};

export type VisualizerApi = typeof visualizer;
