/// <reference lib="WebWorker" />

export type {};

declare const self: ServiceWorkerGlobalScope;

const url = new URL(location.toString());
const version = url.searchParams.get('version');
const prod = url.searchParams.get('prod') === 'true';
const cacheName = `Feishin-remote-${version}`;

const resourcesToCache = ['./', './remote.js', './favicon.ico'];

if (prod) {
    resourcesToCache.push('./remote.css');
}

self.addEventListener('install', (e) => {
    // Take over immediately instead of waiting for every open remote tab to
    // be closed first — the default service worker lifecycle otherwise means
    // a freshly deployed change doesn't actually apply until the phone's
    // browser tab is fully closed and reopened, not just reloaded.
    self.skipWaiting();
    e.waitUntil(
        caches.open(cacheName).then((cache) => {
            return cache.addAll(resourcesToCache);
        }),
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        Promise.all([
            self.clients.claim(),
            caches.keys().then((keyList) => {
                return Promise.all(
                    keyList.map((key) => {
                        if (key !== cacheName) {
                            return caches.delete(key);
                        }
                        return Promise.resolve();
                    }),
                );
            }),
        ]),
    );
});

// Network-first, falling back to the cache only when the request actually
// fails (offline, or the desktop app's HTTP server briefly unreachable).
// The previous cache-first strategy served whatever was cached the very
// first time the page loaded, forever — the cache name is keyed to the app
// version, which doesn't change between dev builds (or even most patch
// releases), so a genuine fix to remote.js could sit on a phone indefinitely
// with no way to pick it up short of manually clearing site data. This way
// every load gets the latest deployed code as long as the phone has any
// path to the desktop app's server at all, which it needs anyway for the
// WebSocket connection — offline resilience is unchanged, since a failed
// fetch still falls back to whatever was last cached.
async function networkFirst(request: Request): Promise<Response> {
    try {
        const response = await fetch(request);
        const cache = await caches.open(cacheName);
        cache.put(request, response.clone());
        return response;
    } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        throw new Error(`No network and no cache entry for ${request.url}`);
    }
}

self.addEventListener('fetch', (e) => {
    // `cache.put` throws for non-GET requests; this worker only ever needs
    // to serve the static app shell, so anything else can just pass through.
    if (e.request.method !== 'GET') return;
    e.respondWith(networkFirst(e.request));
});
