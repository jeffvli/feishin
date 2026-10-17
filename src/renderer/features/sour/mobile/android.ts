// Sour Player for Android (the app in mobile/ wraps this web build). Talks to the app's SourMedia
// plugin through the Capacitor bridge the app injects, so the web build needs no extra packages.

interface CapacitorBridge {
    getPlatform?: () => string;
    nativeCallback?: (
        plugin: string,
        method: string,
        options: unknown,
        callback: Listener,
    ) => string;
    nativePromise?: (plugin: string, method: string, options?: unknown) => Promise<any>;
    Plugins?: Record<string, any>;
}

type Listener = (data: any) => void;

const cap = (): CapacitorBridge | undefined => (window as any).Capacitor;

export const isAndroidApp = () => cap()?.getPlatform?.() === 'android';
export const isIosApp = () => cap()?.getPlatform?.() === 'ios';
// the Android or iPhone app (most phone features work on both)
export const isNativeApp = () => isAndroidApp() || isIosApp();

export const sourMedia = (method: string, options: Record<string, unknown> = {}): Promise<any> => {
    const c = cap();
    const plugin = c?.Plugins?.SourMedia;
    if (plugin && typeof plugin[method] === 'function') return plugin[method](options);
    if (c?.nativePromise) return c.nativePromise('SourMedia', method, options);
    return Promise.reject(new Error('Not running in the Sour Player app'));
};

export const onSourMedia = (
    eventName: 'action' | 'device' | 'intent' | 'update',
    listener: Listener,
): (() => void) => {
    const c = cap();
    const plugin = c?.Plugins?.SourMedia;
    if (plugin?.addListener) {
        const handle = plugin.addListener(eventName, listener);
        return () => {
            Promise.resolve(handle).then((h: any) => h?.remove?.());
        };
    }
    if (c?.nativeCallback) {
        const id = c.nativeCallback('SourMedia', 'addListener', { eventName }, listener);
        return () => {
            c.nativePromise?.('SourMedia', 'removeListener', { callbackId: id, eventName });
        };
    }
    return () => undefined;
};
