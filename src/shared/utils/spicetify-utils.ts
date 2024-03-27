import type { Platform } from '../platform/platform';

/**
 * Wait for Spicetify to load.
 */
export async function waitForSpicetify(): Promise<void> {
    while (!Spicetify?.Platform) {
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
}

/**
 * Wait for a callback to return a value.
 */
async function waitFor<T>(getValue: () => T | undefined): Promise<T> {
    let value = getValue();

    while (value === undefined) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        value = getValue();
    }

    return value;
}

/**
 * Get typed Spicetify.Platform.
 * @returns The Platform object.
 */
function getPlatform(): Platform | undefined {
    return Spicetify.Platform;
}

/**
 * Get a platform API.
 * @param apiName Name of the API.
 * @returns The API object, or undefined.
 */
export function getPlatformApi<T>(apiName: keyof Platform): T | undefined {
    return getPlatform()?.[apiName] as T | undefined;
}

/**
 * Wait for a platform API to be defined.
 * @param apiName Name of the API.
 * @returns The API object.
 */
export async function waitForPlatformApi<T>(
    apiName: keyof Platform,
): Promise<T> {
    return await waitFor<T>(() => getPlatformApi<T>(apiName));
}

/**
 * Get a platform API, throws an error if it's not available.
 * @param apiName Name of the API.
 * @returns The API object.
 */
export function getPlatformApiOrThrow<T>(apiName: keyof Platform): T {
    const api: T | undefined = getPlatformApi<T>(apiName);

    if (api === undefined) {
        throw new Error(`Platform API "${apiName}" is not available`);
    }

    return api;
}
