import { compare } from 'compare-versions';
import type { History, HistoryEntry } from '../platform/history';
import { waitForPlatformApi } from './spicetify-utils';

async function getRemoteVersion(appName: string): Promise<string> {
    const branch = 'main';
    const response = await fetch(
        `https://raw.githubusercontent.com/Pithaya/spicetify-apps/${branch}/custom-apps/${appName}/package.json`,
    );

    const packageJson = await response.json();

    return packageJson.version;
}

async function isUpToDate(
    localVersion: string,
    appName: string,
): Promise<boolean> {
    const remoteVersion = await getRemoteVersion(appName);
    return compare(localVersion, remoteVersion, '>=');
}

/**
 * Add a listener to the history object to check for updates when the user navigates to the custom app.
 * This will show a message on first navigation to the custom app only.
 * @param localVersion The current local version of the custom app.
 * @param appName The name of the custom app.
 * @param updateMessage The message to show when an update is available.
 */
export async function addUpdateChecker(
    localVersion: string,
    appName: string,
): Promise<void> {
    const history = await waitForPlatformApi<History>('History');

    const checkVersion: () => Promise<void> = async () => {
        if (!(await isUpToDate(localVersion, appName))) {
            Spicetify.showNotification(
                '📢 A new version of the custom app is available.',
                false,
                5000,
            );
        }
    };

    if (history.location.pathname === `/${appName}`) {
        await checkVersion();
    } else {
        let unsubscribe: (() => void) | null = null;

        unsubscribe = history.listen(async (e: HistoryEntry) => {
            if (e.pathname === `/${appName}`) {
                await checkVersion();

                unsubscribe?.();
            }
        });
    }
}
