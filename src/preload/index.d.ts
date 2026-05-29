import { PreloadApi } from './index';

declare global {
    interface Window {
        api: PreloadApi;
        LEGACY_AUTHENTICATION?: boolean;
        queryLocalFonts?: () => Promise<Font[]>;
        REMOTE_URL?: string;
        SERVER_LOCK?: boolean;
        SERVER_NAME?: string;
        SERVER_TYPE?: ServerType;
        SERVER_URL?: string;
    }
}
