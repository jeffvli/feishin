import { ipcRenderer } from 'electron';

export interface PreviewLookupQuery {
    artistName: string;
    title: string;
    urlRels?: Array<{ url: string }>;
}

/** Resolve a Deezer preview URL in the main process, where CORS does not apply. */
const resolveDeezer = (query: PreviewLookupQuery): Promise<null | string> => {
    return ipcRenderer.invoke('preview-resolve-deezer', query);
};

export const preview = {
    resolveDeezer,
};

export type Preview = typeof preview;
