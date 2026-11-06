/* eslint-disable @typescript-eslint/explicit-function-return-type */
// Run with Node >=22.15: node scripts/test-plex-playback.mjs. No browser or Plex server required.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { mock } from 'node:test';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const fixture = {
    cleanups: [],
    events: {},
    privateMode: false,
    reports: [],
    settings: {
        enabled: true,
        minimumMode: 'both',
        notify: false,
        scrobbleAtDuration: 60,
        scrobbleAtPercentage: 75,
    },
    song: undefined,
    status: 'PLAYING',
    timestamp: 0,
};
globalThis.plexPlaybackTest = fixture;
const modules = {
    '/@/renderer/components/item-image/item-image': 'export const useItemImageUrl = () => null;',
    '/@/renderer/features/player/audio-player/hooks/use-player-events': `
        export const usePlayerEvents = events => { globalThis.plexPlaybackTest.events = events; };
    `,
    '/@/renderer/features/player/mutations/scrobble-mutation': `
        const mutate = args => globalThis.plexPlaybackTest.reports.push(args);
        export const useSendScrobble = () => ({ mutate });
    `,
    '/@/renderer/store': `
        const f = globalThis.plexPlaybackTest;
        export const getServerById = () => ({ features: { reportPlayback: [1] } });
        export const publishScrobbleDebug = () => {};
        export const ScrobbleMinimumMode = { BOTH: 'both', PERCENTAGE: 'percentage', SECONDS: 'seconds' };
        export const useAppStore = selector => selector({ privateMode: f.privateMode });
        export const usePlaybackSettings = () => ({ scrobble: f.settings });
        export const usePlayerSong = () => f.song;
        export const usePlayerSpeed = () => 1;
        export const usePlayerStore = { getState: () => ({ getCurrentSong: () => f.song, player: { status: f.status } }) };
        export const useSettingsStore = selector => selector({ playback: { scrobble: f.settings } });
        export const useTimestampStoreBase = { getState: () => ({ timestamp: f.timestamp }) };
    `,
    '/@/renderer/utils/logger': 'export const logger = { debug() {}, info() {}, error() {} };',
    react: `
        const f = globalThis.plexPlaybackTest;
        export const useCallback = fn => fn;
        export const useRef = current => ({ current });
        export const useEffect = effect => { const cleanup = effect(); if (cleanup) f.cleanups.push(cleanup); };
        export default { createElement: () => null };
    `,
};

registerHooks({
    load(url, context, next) {
        if (!url.endsWith('.ts')) return next(url, context);
        return {
            format: 'module',
            shortCircuit: true,
            source: ts.transpileModule(readFileSync(fileURLToPath(url), 'utf8'), {
                compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
            }).outputText,
        };
    },
    resolve(specifier, context, next) {
        if (modules[specifier])
            return {
                shortCircuit: true,
                url: `data:text/javascript,${encodeURIComponent(modules[specifier])}`,
            };
        if (specifier.startsWith('/@/'))
            return {
                shortCircuit: true,
                url: new URL(`../src/${specifier.slice(3)}.ts`, import.meta.url).href,
            };
        if (specifier.startsWith('lodash/') || specifier.startsWith('semver/functions/'))
            return next(`${specifier}.js`, context);
        return next(specifier, context);
    },
});

const { ScrobbleHook, useScrobble } =
    await import('../src/renderer/features/player/hooks/use-scrobble.ts');
const { PlayerStatus } = await import('../src/shared/types/types.ts');
const song = {
    _itemType: 'song',
    _serverId: 'plex-server',
    _serverType: 'plex',
    _uniqueId: 'queue-3',
    albumId: '2',
    duration: 180000,
    id: '3',
};
const unmount = () => {
    fixture.cleanups
        .splice(0)
        .reverse()
        .forEach((cleanup) => cleanup());
};
const last = () => fixture.reports.at(-1).query;

mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'] });
try {
    fixture.song = song;
    fixture.status = PlayerStatus.PLAYING;
    useScrobble();
    fixture.events.onCurrentSongChange({ index: 0, song }, { index: -1, song: undefined });
    fixture.timestamp = 2;
    mock.timers.tick(2000);
    assert.equal(last().event, 'start');
    assert.equal(last().position, 2000, 'Delayed starts report the actual playback position');
    assert.equal(last().duration, song.duration);

    fixture.timestamp = 10;
    mock.timers.tick(8000);
    assert.equal(last().event, 'timeupdate');
    assert.equal(last().position, 10000);
    assert.ok(fixture.reports.every((report) => !report.query.submission));

    fixture.status = PlayerStatus.PAUSED;
    fixture.events.onPlayerStatus(
        { status: PlayerStatus.PAUSED },
        { status: PlayerStatus.PLAYING },
    );
    assert.equal(last().event, 'pause');
    mock.timers.tick(10000);
    assert.equal(last().event, 'pause', 'Paused sessions also receive heartbeat reports');
    assert.equal(last().position, 10000);

    fixture.timestamp = 30;
    fixture.events.onPlayerSeekToTimestamp({ timestamp: 30 });
    assert.equal(last().event, 'pause');
    assert.equal(last().position, 30000, 'Seeking while paused must not report playing');
    fixture.status = PlayerStatus.PLAYING;
    fixture.events.onPlayerStatus(
        { status: PlayerStatus.PLAYING },
        { status: PlayerStatus.PAUSED },
    );
    assert.equal(last().event, 'unpause');

    fixture.timestamp = 40;
    fixture.events.onPlayerRepeated();
    assert.equal(last().event, 'start');
    assert.equal(last().position, 0);

    fixture.status = PlayerStatus.STOPPED;
    fixture.events.onPlayerStatus(
        { status: PlayerStatus.STOPPED },
        { status: PlayerStatus.PLAYING },
    );
    assert.equal(last().event, 'stop');
    const stopped = fixture.reports.length;
    mock.timers.tick(10000);
    assert.equal(fixture.reports.length, stopped, 'Stopped sessions need no heartbeat');

    fixture.status = PlayerStatus.PLAYING;
    fixture.events.onPlayerStatus(
        { status: PlayerStatus.PLAYING },
        { status: PlayerStatus.STOPPED },
    );
    assert.equal(last().event, 'start', 'Resuming a stopped song must restart its session');

    const nextSong = { ...song, _uniqueId: 'queue-4', duration: 240000, id: '4' };
    fixture.song = nextSong;
    fixture.timestamp = 0;
    fixture.events.onCurrentSongChange({ index: 1, song: nextSong }, { index: 0, song });
    const changed = fixture.reports.length;
    mock.timers.tick(2000);
    assert.deepEqual(
        fixture.reports.slice(changed).map(({ query }) => [query.id, query.event, query.duration]),
        [
            ['3', 'stop', 180000],
            ['4', 'start', 240000],
        ],
    );

    fixture.events.onCurrentSongChange({ index: 1, song: nextSong }, { index: 1, song: nextSong });
    fixture.privateMode = true;
    unmount();
    assert.equal(last().event, 'stop', 'Enabling private mode closes the public Plex session');
    const privateReports = fixture.reports.length;
    mock.timers.tick(30000);
    assert.equal(
        fixture.reports.length,
        privateReports,
        'Cleanup cancels pending starts and heartbeats',
    );
    assert.equal(ScrobbleHook(), null);
    assert.equal(fixture.cleanups.length, 0, 'Private mode must not mount reporting hooks');
    fixture.privateMode = false;
    fixture.settings.enabled = false;
    assert.equal(ScrobbleHook(), null);
    assert.equal(fixture.cleanups.length, 0, 'Disabled scrobbling must not mount reporting hooks');

    fixture.settings.enabled = true;
    fixture.song = { ...song, _serverType: 'jellyfin', isResumable: true };
    useScrobble();
    const jellyfin = fixture.reports.length;
    mock.timers.tick(10000);
    assert.equal(fixture.reports.length, jellyfin, 'Plex heartbeat must not affect other servers');
    fixture.timestamp = 20;
    fixture.events.onPlayerProgress({ timestamp: 20 }, { timestamp: 19 });
    assert.equal(last().event, 'timeupdate');
    assert.equal(last().position, 20 * 1e7, 'Jellyfin must keep tick-based progress reporting');
    unmount();
    console.log(
        'Plex playback passed: lifecycle, heartbeats, seek, repeat, privacy and Jellyfin regression checks.',
    );
} finally {
    unmount();
    mock.timers.reset();
    delete globalThis.plexPlaybackTest;
}
