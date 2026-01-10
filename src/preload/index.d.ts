import { ElectronAPI } from '@electron-toolkit/preload';

import { PreloadApi } from './index';

declare global {
    interface Window {
        api: PreloadApi;
        electron: ElectronAPI;
        LEGACY_AUTHENTICATION?: boolean;
        queryLocalFonts?: () => Promise<Font[]>;
        SERVER_LOCK?: boolean;
        SERVER_NAME?: string;
        SERVER_TYPE?: ServerType;
        SERVER_URL?: string;
    }
}
