export type LocalStorageAPI = {
    clearItem: (key: string) => void;
    getItem: (key: string) => any;
    setItem: (key: string, item: any) => void;
};
