import type { User } from './user';

export type Folder = {
    type: 'folder';
    addedAt: Date;
    items: (Playlist | Folder)[];
    name: string;
    uri: string;
};

export type Playlist = {
    type: 'playlist';
    uri: string;
    name: string;
    owner: User;

    // NOTE: There are more properties that we don't care about for now
};

export type RootlistFolder = Folder & {
    name: '<root>';
    totalItemCount: number;
};

export type RootlistAPI = {
    getContents: () => Promise<RootlistFolder>;
};
