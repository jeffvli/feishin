import { ipcRenderer } from 'electron';

export interface CustomTheme {
    app?: Record<string, unknown>;
    colors?: Record<string, unknown>;
    error?: string;
    extends?: string;
    filename: string;
    id: string;
    label: string;
    mantineOverride?: Record<string, unknown>;
    mode: 'dark' | 'light';
    stylesheetContents?: string[];
    warnings?: string[];
}

const get = async (): Promise<CustomTheme[]> => {
    return ipcRenderer.invoke('custom-themes-get');
};

const reload = async (): Promise<CustomTheme[]> => {
    return ipcRenderer.invoke('custom-themes-reload');
};

const openFolder = async (): Promise<boolean> => {
    return ipcRenderer.invoke('custom-themes-open-folder');
};

const onUpdate = (cb: (themes: CustomTheme[]) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, themes: CustomTheme[]) => cb(themes);
    ipcRenderer.on('custom-themes-updated', listener);
    return () => ipcRenderer.removeListener('custom-themes-updated', listener);
};

export const customThemes = {
    get,
    onUpdate,
    openFolder,
    reload,
};

export type CustomThemes = typeof customThemes;
