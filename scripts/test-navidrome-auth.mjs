/* eslint @typescript-eslint/explicit-function-return-type: "off" -- Standalone JavaScript check. */
// Run with: node --test scripts/test-navidrome-auth.mjs
import axios, { AxiosError, CanceledError, isAxiosError } from 'axios';
import debounce from 'lodash/debounce.js';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { setImmediate } from 'node:timers/promises';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

// Load the production interceptor without booting the Electron renderer.
const source = readFileSync(
    new URL('../src/renderer/api/navidrome/navidrome-api.ts', import.meta.url),
    'utf8',
);
const start = source.indexOf('let authSuccess =');
const end = source.indexOf('export const ndApiClient');
assert.ok(start >= 0 && end > start, 'Could not locate the production interceptor');
const interceptor = ts.transpileModule(source.slice(start, end), {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;

async function check(
    t,
    {
        expectedLogins = 1,
        loginFailure,
        password = 'saved-password',
        requests = 1,
        resourceFailure,
        savePassword = true,
        shouldLogout = false,
    },
) {
    const timers = [];
    const debounced = [];
    const sent = [];
    let logins = 0;
    let logoutCount = 0;
    let currentServer = {
        id: 'server',
        ndCredential: 'expired',
        savePassword,
        url: 'http://localhost',
        username: 'test',
    };
    let savedPassword = password;
    const errors = [];
    const adapter = async (config) => {
        const response = { config, data: {}, headers: {}, status: 200, statusText: 'OK' };
        const reject = (failure) => {
            let error;
            if (failure === 'ERR_CANCELED') {
                error = new CanceledError('Request canceled', config);
            } else if (typeof failure === 'string') {
                error = new AxiosError('Transport failure', failure, config);
            } else {
                error = new AxiosError(
                    'HTTP failure',
                    'ERR_BAD_RESPONSE',
                    config,
                    {},
                    {
                        ...response,
                        status: failure,
                    },
                );
            }
            errors.push(error);
            throw error;
        };
        if (config.url.endsWith('/auth/login')) {
            logins++;
            assert.ok(logins <= requests + 1, 'Unbounded login loop');
            if (loginFailure) return reject(loginFailure);
            return {
                ...response,
                data: { subsonicSalt: 'salt', subsonicToken: 'token', token: 'fresh' },
            };
        }
        const token = config.headers.get('x-nd-authorization');
        sent.push({ token, url: config.url });
        if (token !== 'Bearer fresh') return reject(401);
        if (resourceFailure) return reject(resourceFailure);
        return response;
    };
    const client = axios.create({ adapter });
    const loginClient = axios.create({ adapter });
    runInNewContext(interceptor, {
        authenticationFailure: () => {
            logoutCount++;
            currentServer = null;
            savedPassword = null;
        },
        axios: loginClient,
        axiosClient: client,
        console: {
            error() {
                /* Expected errors are asserted below. */
            },
        },
        debounce: (fn, delay) => {
            const wrapped = debounce(fn, delay);
            debounced.push(wrapped);
            return wrapped;
        },
        i18n: { t: (key) => key },
        isAxiosError,
        localSettings: { passwordGet: async () => savedPassword },
        logger: {
            warn() {
                /* Expected transport warnings. */
            },
        },
        // Advance the existing polling explicitly; no wall-clock sleeps or live server.
        setTimeout: (callback) => timers.push(callback),
        toast: {
            error() {
                /* Expected authentication notifications. */
            },
        },
        useAuthStore: {
            getState: () => ({
                actions: {
                    setCurrentServer: (server) => {
                        currentServer = server;
                    },
                    updateServer: (_id, values) => {
                        currentServer = { ...currentServer, ...values };
                    },
                },
                currentServer,
            }),
        },
    });
    t.after(() => debounced.forEach((fn) => fn.cancel()));
    let results;
    const pending = Promise.allSettled(
        Array.from({ length: requests }, (_, i) =>
            client.get(`/song/${i}`, { headers: { 'x-nd-authorization': 'Bearer expired' } }),
        ),
    ).then((value) => {
        results = value;
    });
    for (let tick = 0; !results && tick < 40; tick++) {
        await setImmediate();
        timers.shift()?.();
    }
    assert.ok(results, 'Requests must settle without an endless authentication loop');
    await pending;
    debounced.forEach((fn) => fn.flush());
    assert.equal(logins, expectedLogins);
    assert.equal(logoutCount, shouldLogout ? 1 : 0);
    assert.equal(currentServer === null, shouldLogout);
    assert.equal(savedPassword, shouldLogout ? null : password);
    for (const result of results) {
        if (loginFailure || resourceFailure || !savePassword || password === null) {
            assert.equal(result.status, 'rejected');
            assert.ok(errors.includes(result.reason), 'Must propagate the original Axios error');
            const expected =
                loginFailure || (!savePassword || password === null ? 401 : resourceFailure);
            assert.equal(
                typeof expected === 'string' ? result.reason.code : result.reason.response.status,
                expected,
            );
        } else {
            assert.equal(result.status, 'fulfilled');
            assert.equal(result.value.status, 200);
        }
    }
    if (!shouldLogout && !loginFailure) assert.equal(currentServer.ndCredential, 'fresh');
    return sent;
}

for (const resourceFailure of [
    undefined,
    403,
    404,
    429,
    500,
    'ERR_NETWORK',
    'ERR_CANCELED',
    'ECONNABORTED',
]) {
    test(`successful login followed by ${resourceFailure ?? 'successful request'} preserves session`, async (t) => {
        const sent = await check(t, { resourceFailure });
        assert.deepEqual(
            sent.map(({ token }) => token),
            ['Bearer expired', 'Bearer fresh'],
        );
    });
}
test('repeated 401 stops after one login and logs out', async (t) => {
    await check(t, { resourceFailure: 401, shouldLogout: true });
});
for (const loginFailure of [401, 404, 429, 500]) {
    test(`login failure ${loginFailure} keeps existing logout behavior`, async (t) => {
        await check(t, { loginFailure, shouldLogout: true });
    });
}
test('network failure during login preserves credentials', async (t) => {
    await check(t, { loginFailure: 'ERR_NETWORK' });
});
test('no saved password logs out without attempting login', async (t) => {
    await check(t, { expectedLogins: 0, savePassword: false, shouldLogout: true });
});
test('missing password logs out without attempting login', async (t) => {
    await check(t, { expectedLogins: 0, password: null, shouldLogout: true });
});
for (const resourceFailure of [undefined, 404]) {
    test(`concurrent requests retain session with ${resourceFailure ?? 'success'} despite existing stale-token retry`, async (t) => {
        const sent = await check(t, { expectedLogins: 2, requests: 2, resourceFailure });
        // Existing limitation: the waiting request reuses its stale header and logs in again.
        // Keep this visible rather than granting success to an unauthorized request in the adapter.
        assert.deepEqual(
            sent.filter(({ url }) => url === '/song/1').map(({ token }) => token),
            ['Bearer expired', 'Bearer expired', 'Bearer fresh'],
        );
    });
}
