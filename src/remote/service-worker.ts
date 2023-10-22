/// <reference lib="WebWorker" />

export type {};
// eslint-disable-next-line no-undef
declare const self: ServiceWorkerGlobalScope;

// eslint-disable-next-line no-restricted-globals
const url = new URL(location.toString());
const version = url.searchParams.get('version');
const prod = url.searchParams.get('prod') === 'true';
const cacheName = `Feishin-remote-${version}`;

const resourcesToCache = ['./', './remote.js', './favicon.ico'];

if (prod) {
    resourcesToCache.push('./remote.css');
}

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(cacheName).then((cache) => {
            return cache.addAll(resourcesToCache);
        }),
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request);
        }),
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
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
    );
});
