export type ClipboardAPI = {
    copy: (value: any) => Promise<void>;
    paste: () => Promise<string>;
};
