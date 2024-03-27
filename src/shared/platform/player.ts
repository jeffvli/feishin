export type PlayerAPI = {
    addToQueue: (tracks: { uri: string }[]) => Promise<void>;
    seekForward: (value: number) => Promise<void>;
    seekBackward: (value: number) => Promise<void>;
    seekBy: (value: number) => Promise<void>;
    seekTo: (value: number) => Promise<void>;
};
