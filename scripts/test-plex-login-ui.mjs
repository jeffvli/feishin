/* eslint-disable @typescript-eslint/explicit-function-return-type */
// Run after build:electron, or build:web with --web. Requires Electron; uses mocked Plex responses.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer as createHttpServer } from 'node:http';
import { createServer } from 'node:net';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import WebSocket from 'ws';

const root = fileURLToPath(new URL('..', import.meta.url));
const profile = mkdtempSync('/tmp/opencode/feishin-plex-ui-');
const web = process.argv.includes('--web');
const timeoutTest = process.argv.includes('--timeout');
const proxyTest = process.argv.includes('--proxy');
const proxyRequests = [];
let webServer;
let appPath = root;
if (web) {
    webServer = createHttpServer((request, response) => {
        if (request.url === '/settings.js') {
            response.setHeader('Content-Type', 'application/javascript');
            response.end(
                `window.SERVER_TYPE="plex";window.SERVER_NAME="Plex";window.SERVER_LOCK="true";window.SERVER_URL=${proxyTest ? 'location.origin + "/plex"' : '""'};`,
            );
            return;
        }
        if (proxyTest && request.url.startsWith('/plex/')) {
            proxyRequests.push(request.url);
            response.setHeader('Access-Control-Allow-Origin', 'https://app.plex.tv');
            if (request.url === '/plex/identity') {
                response.setHeader('Content-Type', 'application/xml');
                response.end('<MediaContainer machineIdentifier="machine-1"/>');
            } else {
                assert.equal(request.headers['x-plex-token'], 'fake-server-token-1');
                response.setHeader('Content-Type', 'application/json');
                response.end(
                    JSON.stringify({
                        MediaContainer: {
                            Directory: [{ key: '7', title: 'Music', type: 'artist' }],
                            machineIdentifier: 'machine-1',
                            Metadata: [],
                            size: 0,
                            totalSize: 0,
                        },
                    }),
                );
            }
            return;
        }
        const file =
            request.url === '/' ? 'index.html' : new URL(request.url, 'http://localhost').pathname;
        try {
            const content = readFileSync(path.join(root, 'out/web', file));
            const mime = {
                '.css': 'text/css',
                '.html': 'text/html',
                '.js': 'application/javascript',
                '.svg': 'image/svg+xml',
            };
            response.setHeader(
                'Content-Type',
                mime[path.extname(file)] || 'application/octet-stream',
            );
            response.end(content);
        } catch {
            response.writeHead(404).end();
        }
    });
    await new Promise((resolve) => webServer.listen(0, '127.0.0.1', resolve));
    appPath = path.join(profile, 'browser.cjs');
    writeFileSync(
        appPath,
        `
        const { app, BrowserWindow } = require('electron');
        app.whenReady().then(() => {
            const win = new BrowserWindow({ show: false, webPreferences: { sandbox: true, nodeIntegration: false } });
            win.webContents.setUserAgent(win.webContents.getUserAgent().replace(/Electron\\/\\S+ /, ''));
            win.loadURL('http://feishin.test:${webServer.address().port}');
        });
    `,
    );
}
const listener = createServer();
await new Promise((resolve) => listener.listen(0, '127.0.0.1', resolve));
const port = listener.address().port;
await new Promise((resolve) => listener.close(resolve));
const child = spawn(
    process.env.ELECTRON_BINARY || path.join(root, 'node_modules/electron/dist/electron'),
    [
        appPath,
        '--host-resolver-rules=MAP feishin.test 127.0.0.1',
        '--ozone-platform=headless',
        '--disable-gpu',
        `--remote-debugging-port=${port}`,
        `--user-data-dir=${profile}/data`,
    ],
    {
        cwd: root,
        env: {
            ...process.env,
            XDG_CACHE_HOME: `${profile}/cache`,
            XDG_CONFIG_HOME: `${profile}/config`,
        },
        stdio: ['ignore', 'pipe', 'pipe'],
    },
);
let logs = '';
child.stdout.on('data', (data) => {
    logs += data;
});
child.stderr.on('data', (data) => {
    logs += data;
});
let socket;

try {
    let target;
    for (let attempt = 0; attempt < 150; attempt++) {
        if (child.exitCode !== null) throw new Error(`Electron exited: ${logs}`);
        try {
            const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
            target = pages.find(
                (page) => page.type === 'page' && !page.url.startsWith('devtools:'),
            );
            if (target) break;
        } catch {
            /* The debugger has not started yet. */
        }
        await delay(200);
    }
    assert(target, 'Electron debugger did not start');
    socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
        socket.once('open', resolve);
        socket.once('error', reject);
    });
    let nextId = 0;
    const pending = new Map();
    socket.on('close', (code, reason) => {
        for (const request of pending.values())
            request.reject(new Error(`Debugger closed (${code}: ${reason}). ${logs}`));
        pending.clear();
    });
    const send = (method, params = {}) =>
        new Promise((resolve, reject) => {
            if (socket.readyState !== WebSocket.OPEN)
                return reject(new Error(`Debugger disconnected. ${logs}`));
            const id = ++nextId;
            pending.set(id, { reject, resolve });
            socket.send(JSON.stringify({ id, method, params }));
        });
    const requests = [];
    socket.on('message', async (message) => {
        const event = JSON.parse(message);
        if (event.id) {
            const request = pending.get(event.id);
            pending.delete(event.id);
            if (event.error) request?.reject(new Error(event.error.message));
            else request?.resolve(event.result);
        }
        if (event.method !== 'Fetch.requestPaused') return;
        const { request, requestId } = event.params;
        requests.push(request.url);
        const url = new URL(request.url);
        if (
            url.hostname === 'plex-ui-unreachable.example' ||
            (timeoutTest && url.hostname !== 'plex.tv')
        )
            return;
        let body;
        if (url.hostname === 'plex.tv') {
            if (url.pathname.startsWith('/api/v2/pins'))
                body = {
                    authToken: request.method === 'POST' ? null : 'fake-account-token',
                    code: 'ui-test-pin',
                    expiresIn: 600,
                    id: 123,
                };
            else if (url.pathname === '/api/v2/user') body = { id: 42, username: 'UI listener' };
            else
                body = ['Studio music', 'Shared music'].map((name, index) => ({
                    accessToken: `fake-server-token-${index}`,
                    clientIdentifier: `machine-${index}`,
                    connections: [
                        ...(web
                            ? [
                                  {
                                      local: false,
                                      relay: false,
                                      uri: 'https://plex-ui-unreachable.example',
                                  },
                              ]
                            : []),
                        { local: false, relay: false, uri: `https://plex-ui-${index}.example` },
                    ],
                    name,
                    owned: index === 0,
                    provides: 'server',
                }));
        } else if (web && url.pathname === '/identity')
            body =
                '<?xml version="1.0" encoding="UTF-8"?><MediaContainer size="0" claimed="1" machineIdentifier="machine-1" version="1.40.0"/>';
        else if (url.pathname === '/identity' || url.pathname === '/')
            body = { MediaContainer: { machineIdentifier: 'machine-1', version: '1.40.0' } };
        else if (url.pathname === '/library/sections')
            body = {
                MediaContainer: { Directory: [{ key: '7', title: 'Music', type: 'artist' }] },
            };
        else body = { MediaContainer: { Metadata: [], size: 0, totalSize: 0 } };
        await send('Fetch.fulfillRequest', {
            body: Buffer.from(typeof body === 'string' ? body : JSON.stringify(body)).toString(
                'base64',
            ),
            requestId,
            responseCode: request.method === 'OPTIONS' ? 204 : 200,
            responseHeaders: [
                {
                    name: 'Content-Type',
                    value: typeof body === 'string' ? 'application/xml' : 'application/json',
                },
                { name: 'Access-Control-Allow-Origin', value: '*' },
                { name: 'Access-Control-Allow-Headers', value: '*' },
                { name: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
            ],
        });
    });
    const evaluate = async (expression) => {
        const result = await send('Runtime.evaluate', {
            awaitPromise: true,
            expression,
            returnByValue: true,
        });
        if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
        return result.result.value;
    };
    const waitFor = async (expression) => {
        for (let attempt = 0; attempt < 150; attempt++) {
            if (await evaluate(expression)) return;
            await delay(100);
        }
        throw new Error(
            `UI condition not met: ${expression}\n${await evaluate('document.body.innerText')}`,
        );
    };
    await send('Fetch.enable', {
        patterns: [
            { urlPattern: 'https://plex.tv/*' },
            { urlPattern: 'https://plex-ui-*.example/*' },
        ],
    });
    if (!web) {
        await waitFor(
            'Array.from(document.querySelectorAll("label")).some(label => label.textContent.trim() === "Plex")',
        );
        await evaluate(
            'Array.from(document.querySelectorAll("label")).find(label => label.textContent.trim() === "Plex").click()',
        );
    }
    await waitFor(
        '!!Array.from(document.querySelectorAll("button")).find(button => /Sign in with Plex|Accedi con Plex/.test(button.textContent))',
    );
    if (web) {
        assert.equal(await evaluate('window.isSecureContext'), false);
        assert.equal(await evaluate('typeof window.api'), 'undefined');
        assert.equal(await evaluate('navigator.userAgent.includes("Electron")'), false);
    }
    assert.equal(
        await evaluate(
            'document.querySelectorAll("form input:not([type=radio]):not([type=hidden])").length',
        ),
        0,
        'Default Plex login must not require an endpoint, username or token',
    );
    assert.equal(
        await evaluate(
            'Array.from(document.querySelectorAll("button")).find(button => /Sign in with Plex|Accedi con Plex/.test(button.textContent)).disabled',
        ),
        false,
    );
    if (timeoutTest) {
        await evaluate(
            'const originalTimeout = window.setTimeout; window.setTimeout = (fn, ms, ...args) => originalTimeout(fn, ms === 30000 ? 100 : ms, ...args);',
        );
    }
    await evaluate(
        'window.open = url => { window.__plexOpened = url; return null; }; Array.from(document.querySelectorAll("button")).find(button => /Sign in with Plex|Accedi con Plex/.test(button.textContent)).click()',
    );
    await waitFor('!!window.__plexOpened');
    assert.equal(new URL(await evaluate('window.__plexOpened')).origin, 'https://app.plex.tv');
    if (!proxyTest) {
        await waitFor(
            'Array.from(document.querySelectorAll("button")).some(button => button.textContent.includes("Shared music"))',
        );
        assert.ok(
            requests.every((url) => new URL(url).hostname === 'plex.tv'),
            'Server discovery must work before contacting any media endpoint',
        );
        await evaluate(
            'Array.from(document.querySelectorAll("button")).find(button => button.textContent.includes("Shared music")).click()',
        );
    }
    if (timeoutTest) {
        await waitFor('document.body.innerText.includes("Plex connection timed out")');
        assert.equal(
            await evaluate(
                '!!JSON.parse(localStorage.getItem("store_authentication") || "{}").state?.currentServer',
            ),
            false,
        );
        await waitFor(
            'Array.from(document.querySelectorAll("button")).some(button => /Sign in with Plex/.test(button.textContent) && !button.disabled)',
        );
        console.log(
            'Plex web timeout passed: stalled connection cancelled, no credentials saved and sign-in available again.',
        );
    } else {
        await waitFor(
            'JSON.parse(localStorage.getItem("store_authentication") || "{}").state?.currentServer?.plexServerId === "machine-1"',
        );
        const server = await evaluate(
            'JSON.parse(localStorage.getItem("store_authentication")).state.currentServer',
        );
        assert.equal(
            server.url,
            proxyTest
                ? `http://feishin.test:${webServer.address().port}/plex`
                : 'https://plex-ui-1.example',
        );
        assert.equal(server.name, web ? 'Plex' : 'Shared music');
        assert.equal(server.username, 'UI listener');
        assert.equal(server.credential, 'fake-server-token-1');
        if (web) await waitFor('!location.hash.includes("action-required")');
        if (proxyTest) {
            assert.ok(proxyRequests.includes('/plex/identity'));
            assert.ok(proxyRequests.includes('/plex/library/sections'));
            assert.ok(
                requests.every((url) => new URL(url).hostname === 'plex.tv'),
                'Proxy mode must not contact discovered media origins directly',
            );
        }
        console.log(
            'Plex UI passed: no endpoint fields, enabled one-click browser login, account server selection and discovered connection saved.',
        );
    }
} finally {
    socket?.close();
    child.kill('SIGTERM');
    webServer?.close();
}
