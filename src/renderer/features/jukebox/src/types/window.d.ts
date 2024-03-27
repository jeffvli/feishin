import type { Jukebox } from '../models/jukebox';

declare global {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface Window {
        jukebox: Jukebox;
    }
}
