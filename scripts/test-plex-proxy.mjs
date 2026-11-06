/* eslint-disable @typescript-eslint/explicit-function-return-type */
// Run: NGINX_BINARY=/path/to/nginx node scripts/test-plex-proxy.mjs
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const profile = mkdtempSync('/tmp/opencode/feishin-plex-proxy-');
const template = readFileSync(new URL('../ng.conf.template', import.meta.url), 'utf8');
const requests = [];
const upstream = createServer(async (request, response) => {
    let body = '';
    for await (const chunk of request) body += chunk;
    requests.push({ body, headers: request.headers, method: request.method, url: request.url });
    const url = new URL(request.url, 'http://localhost');
    response.setHeader('Access-Control-Allow-Origin', 'https://app.plex.tv');
    if (url.pathname === '/identity') {
        response.setHeader('Content-Type', 'application/xml');
        response.end('<MediaContainer machineIdentifier="machine-1"/>');
        return;
    }
    if (
        (request.headers['x-plex-token'] || url.searchParams.get('X-Plex-Token')) !== 'test-token'
    ) {
        response.writeHead(401).end();
        return;
    }
    if (url.pathname === '/library/parts/1/audio.flac') {
        assert.equal(request.headers.range, 'bytes=2-5');
        response.writeHead(206, { 'Content-Range': 'bytes 2-5/8', 'Content-Type': 'audio/flac' });
        response.end('cdef');
        return;
    }
    if (url.pathname === '/redirect' || url.pathname === '/relative-redirect') {
        const origin =
            url.pathname === '/redirect' ? `http://127.0.0.1:${upstream.address().port}` : '';
        response
            .writeHead(302, {
                Location: `${origin}/library/parts/1/audio.flac?X-Plex-Token=test-token`,
            })
            .end();
        return;
    }
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify({ MediaContainer: { size: 0 } }));
});
await new Promise((resolve) => upstream.listen(0, '127.0.0.1', resolve));
const upstreamUrl = `http://127.0.0.1:${upstream.address().port}`;
const headers = { 'X-Plex-Token': 'test-token' };

const withProxy = async (settings, check) => {
    const listener = createServer();
    await new Promise((resolve) => listener.listen(0, '127.0.0.1', resolve));
    const port = listener.address().port;
    await new Promise((resolve) => listener.close(resolve));
    const config = template.replace(
        /\$\{(SERVER_TYPE|PLEX_PROXY_URL|PUBLIC_PATH)\}/g,
        (_, key) => settings[key],
    );
    const configFile = path.join(profile, `nginx-${port}.conf`);
    writeFileSync(
        configFile,
        `
        pid ${profile}/nginx-${port}.pid;
        error_log ${profile}/error.log;
        events {}
        http {
            access_log off;
            client_body_temp_path ${profile}/body;
            proxy_temp_path ${profile}/proxy;
            fastcgi_temp_path ${profile}/fastcgi;
            uwsgi_temp_path ${profile}/uwsgi;
            scgi_temp_path ${profile}/scgi;
            ${config.replaceAll('listen 9180;', `listen 127.0.0.1:${port};`).replace('listen [::]:9180;', '')}
        }
    `,
    );
    const child = spawn(
        process.env.NGINX_BINARY || 'nginx',
        ['-p', profile, '-e', `${profile}/error.log`, '-c', configFile, '-g', 'daemon off;'],
        { stdio: ['ignore', 'pipe', 'pipe'] },
    );
    const exited = new Promise((resolve, reject) => {
        child.once('exit', resolve);
        child.once('error', reject);
    });
    let logs = '';
    child.stderr.on('data', (chunk) => {
        logs += chunk;
    });
    const origin = `http://127.0.0.1:${port}`;
    try {
        for (let attempt = 0; attempt < 100; attempt++) {
            if (child.exitCode !== null) throw new Error(`nginx exited: ${logs}`);
            try {
                await fetch(`${origin}/plex/identity`);
                break;
            } catch {
                await delay(20);
            }
        }
        await check(origin);
    } finally {
        child.kill('SIGTERM');
        await exited;
    }
};

try {
    await withProxy(
        { PLEX_PROXY_URL: `${upstreamUrl}/`, PUBLIC_PATH: '/', SERVER_TYPE: 'plex' },
        async (origin) => {
            const identity = await fetch(`${origin}/plex/identity`);
            assert.equal(identity.status, 200);
            assert.ok((await identity.text()).includes('machine-1'));
            assert.equal(identity.headers.get('Access-Control-Allow-Origin'), null);
            const unauthenticated = requests.length;
            assert.equal((await fetch(`${origin}/plex/library/sections`)).status, 401);
            assert.equal(requests.length, unauthenticated, 'Missing tokens must not reach Plex');
            const response = await fetch(
                `${origin}/plex/library/sections?target=http://other.invalid`,
                {
                    headers: {
                        ...headers,
                        Cookie: 'private=browser-cookie',
                        Origin: origin,
                        Referer: `${origin}/`,
                    },
                },
            );
            assert.equal(response.status, 200);
            assert.equal(requests.at(-1).url, '/library/sections?target=http://other.invalid');
            assert.equal(requests.at(-1).headers.host, new URL(upstreamUrl).host);
            assert.equal(requests.at(-1).headers.origin, undefined);
            assert.equal(requests.at(-1).headers.cookie, undefined);
            assert.equal(requests.at(-1).headers.referer, undefined);

            const audio = await fetch(
                `${origin}/plex/library/parts/1/audio.flac?X-Plex-Token=test-token`,
                { headers: { Range: 'bytes=2-5' } },
            );
            assert.equal(audio.status, 206);
            assert.equal(audio.headers.get('Content-Range'), 'bytes 2-5/8');
            assert.equal(await audio.text(), 'cdef');
            assert.equal(
                (
                    await fetch(`${origin}/plex/library/sections`, {
                        headers: { 'X-Plex-Token': 'invalid' },
                    })
                ).status,
                401,
            );
            for (const method of ['POST', 'PUT', 'DELETE']) {
                const mutation = await fetch(`${origin}/plex/playlists/1/items`, {
                    body: 'track-data',
                    headers,
                    method,
                });
                assert.equal(mutation.status, 200);
                assert.equal(requests.at(-1).method, method);
                assert.equal(requests.at(-1).body, 'track-data');
            }
            for (const route of ['redirect', 'relative-redirect']) {
                const redirect = await fetch(`${origin}/plex/${route}`, {
                    headers,
                    redirect: 'manual',
                });
                assert.equal(redirect.status, 302);
                assert.equal(
                    redirect.headers.get('Location'),
                    '/plex/library/parts/1/audio.flac?X-Plex-Token=test-token',
                );
            }
        },
    );
    for (const settings of [
        { PLEX_PROXY_URL: '', PUBLIC_PATH: '/', SERVER_TYPE: 'plex' },
        { PLEX_PROXY_URL: upstreamUrl, PUBLIC_PATH: '/', SERVER_TYPE: 'jellyfin' },
        { PLEX_PROXY_URL: `${upstreamUrl}/arbitrary-path`, PUBLIC_PATH: '/', SERVER_TYPE: 'plex' },
    ]) {
        const previous = requests.length;
        await withProxy(settings, async (origin) => {
            assert.equal((await fetch(`${origin}/plex/identity`)).status, 404);
            assert.equal(
                requests.length,
                previous,
                'Disabled, non-Plex or invalid proxy must not forward requests',
            );
        });
    }
    for (const prefix of ['/music', '/music/']) {
        await withProxy(
            { PLEX_PROXY_URL: upstreamUrl, PUBLIC_PATH: prefix, SERVER_TYPE: 'PLEX' },
            async (origin) => {
                assert.equal((await fetch(`${origin}/music/plex/identity`)).status, 200);
                const redirect = await fetch(`${origin}/music/plex/redirect`, {
                    headers,
                    redirect: 'manual',
                });
                assert.equal(
                    redirect.headers.get('Location'),
                    '/music/plex/library/parts/1/audio.flac?X-Plex-Token=test-token',
                );
            },
        );
    }
    console.log(
        'Plex proxy passed: fixed target, CORS isolation, token forwarding, streaming ranges, mutations, redirects, subpaths and non-Plex isolation.',
    );
} finally {
    upstream.close();
}
