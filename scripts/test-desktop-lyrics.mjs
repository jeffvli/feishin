// JavaScript cannot declare TypeScript return annotations; all other lint rules still apply.
/* eslint @typescript-eslint/explicit-function-return-type: off */
// Run with Node 22.18+ (native TypeScript stripping) and project dependencies.
import assert from 'node:assert/strict';

import { updateLyricsOffset } from '../src/renderer/features/lyrics/utils/update-lyrics-offset.ts';
import {
    applyDesktopLyricsTime,
    defaultDesktopLyricsSettings,
    desktopLyricsSettingsSchema,
    getDefaultDesktopLyricsSettings,
    getDesktopLyricsControlsLayout,
    getDesktopLyricsFontSizes,
    getDesktopLyricsPair,
    getDesktopLyricsTiming,
    getDesktopLyricsTrackKey,
    getDesktopLyricsWindowSize,
    getEffectiveDesktopLyricsSettings,
    isDesktopLyricsCurrentOnBottom,
    isNativeWayland,
    setDesktopLyricsIndependent,
} from '../src/shared/utils/desktop-lyrics.ts';

const snapshot = {
    language: 'en',
    lines: [
        { startMs: 1000, text: 'First' },
        { startMs: 2000, text: 'Second' },
        { startMs: 3000, text: 'Last' },
    ],
    offsetMs: 0,
    playing: true,
    timestamp: 0,
    title: 'Song',
    trackKey: 'current',
};
const grouped = {
    ...snapshot,
    lines: [
        { startMs: 1000, text: 'First original' },
        { startMs: 1000, text: '第一句译文' },
        { startMs: 2000, text: 'Second original' },
        { startMs: 2000, text: '第二句译文' },
        { startMs: 2000, text: 'Second romanization' },
        { startMs: 3000, text: 'Last' },
    ],
};
const rollingSettings = { ...defaultDesktopLyricsSettings, rollingMode: true };
assert.equal(defaultDesktopLyricsSettings.rollingMode, true);
const legacyRollingSettings = { ...defaultDesktopLyricsSettings };
delete legacyRollingSettings.rollingMode;
assert.equal(desktopLyricsSettingsSchema.parse(legacyRollingSettings).rollingMode, false);
for (const [timestamp, bottom] of [
    [0, false],
    [1, false],
    [1.999, false],
    [2, true],
    [3, false],
    [30, false],
]) {
    assert.equal(
        isDesktopLyricsCurrentOnBottom({ ...grouped, timestamp }, rollingSettings),
        bottom,
    );
    assert.equal(
        isDesktopLyricsCurrentOnBottom(
            { ...grouped, timestamp },
            { ...defaultDesktopLyricsSettings, rollingMode: false },
        ),
        false,
    );
    assert.equal(
        isDesktopLyricsCurrentOnBottom(
            { ...grouped, timestamp },
            { ...rollingSettings, singleLine: true },
        ),
        false,
    );
}
assert.equal(
    isDesktopLyricsCurrentOnBottom({ ...grouped, offsetMs: 1000, timestamp: 1 }, rollingSettings),
    true,
);
assert.equal(
    isDesktopLyricsCurrentOnBottom({ ...grouped, offsetMs: -1000, timestamp: 2 }, rollingSettings),
    false,
);
assert.equal(isDesktopLyricsCurrentOnBottom({ ...snapshot, lines: [] }, rollingSettings), false);
assert.equal(isDesktopLyricsCurrentOnBottom(null, rollingSettings), false);
assert.equal(isDesktopLyricsCurrentOnBottom({ ...snapshot, timestamp: 2 }, rollingSettings), true);
// Seeking backwards and changing tracks depend only on the distinct timestamp group.
assert.equal(isDesktopLyricsCurrentOnBottom({ ...grouped, timestamp: 1 }, rollingSettings), false);
assert.equal(
    isDesktopLyricsCurrentOnBottom({ ...snapshot, timestamp: 1, trackKey: 'new' }, rollingSettings),
    false,
);
assert.deepEqual(getDesktopLyricsPair({ ...grouped, timestamp: 2 }, rollingSettings), [
    ['Second original', '第二句译文'],
    ['Last'],
]);
console.log(
    'Rolling mode: defaults/migration, distinct bilingual groups, offsets, seek, tracks, missing data and single-line override: PASS',
);
const first = ['First original', '第一句译文'];
const second = ['Second original', '第二句译文'];
// Same-timestamp translations belong to the current group, never to the next group.
assert.deepEqual(getDesktopLyricsPair({ ...grouped, timestamp: 1 }), [first, second]);
assert.deepEqual(getDesktopLyricsPair({ ...grouped, timestamp: 1.999 }), [first, second]);
assert.deepEqual(getDesktopLyricsPair({ ...grouped, timestamp: 2 }), [second, ['Last']]);
assert.deepEqual(getDesktopLyricsPair({ ...grouped, timestamp: 30 }), [['Last'], []]);
assert.deepEqual(getDesktopLyricsPair(grouped), [['Song'], first]);
assert.deepEqual(getDesktopLyricsPair({ ...grouped, offsetMs: 2000 }), [second, ['Last']]);
assert.deepEqual(getDesktopLyricsPair({ ...grouped, offsetMs: -1000, timestamp: 2 }), [
    first,
    second,
]);
assert.deepEqual(getDesktopLyricsPair({ ...grouped, offsetMs: -1000, timestamp: 1 }), [
    ['Song'],
    first,
]);
// Group matching timestamps in source order, then retain only translation and primary rows.
assert.deepEqual(
    getDesktopLyricsPair({
        ...grouped,
        lines: [
            grouped.lines[0],
            grouped.lines[2],
            grouped.lines[1],
            grouped.lines[3],
            grouped.lines[4],
            grouped.lines[5],
            { startMs: 1000, text: 'First romanization' },
            { startMs: 1000, text: '' },
            { startMs: 1000, text: 'First original' },
        ],
        timestamp: 1,
    }),
    [first, second],
);
assert.deepEqual(getDesktopLyricsPair(snapshot), [['Song'], ['First']]);
assert.deepEqual(getDesktopLyricsPair({ ...snapshot, timestamp: 1 }), [['First'], ['Second']]);
assert.deepEqual(getDesktopLyricsPair({ ...snapshot, timestamp: 2 }), [['Second'], ['Last']]);
assert.deepEqual(getDesktopLyricsPair({ ...snapshot, timestamp: 30 }), [['Last'], []]);
assert.deepEqual(getDesktopLyricsPair({ ...snapshot, offsetMs: 1000 }), [['First'], ['Second']]);
assert.deepEqual(getDesktopLyricsPair({ ...snapshot, offsetMs: -1000, timestamp: 1 }), [
    ['Song'],
    ['First'],
]);
assert.deepEqual(getDesktopLyricsPair({ ...snapshot, lines: [] }), [['Song'], []]);
assert.deepEqual(getDesktopLyricsPair({ ...snapshot, lines: [], title: '' }), [[''], []]);

// An old backend's late position must not seek the newly selected song.
assert.equal(applyDesktopLyricsTime(snapshot, { timestamp: 100, trackKey: 'old' }), snapshot);
assert.equal(applyDesktopLyricsTime(snapshot, { timestamp: NaN, trackKey: 'current' }), snapshot);
assert.equal(applyDesktopLyricsTime(snapshot, { timestamp: 2, trackKey: 'current' }).timestamp, 2);
const song = { _serverId: 'server', _uniqueId: 'queue-1', id: 'song' };
assert.notEqual(
    getDesktopLyricsTrackKey(song),
    getDesktopLyricsTrackKey({ ...song, _serverId: 'other' }),
);
assert.notEqual(
    getDesktopLyricsTrackKey(song),
    getDesktopLyricsTrackKey({ ...song, _uniqueId: 'queue-2' }),
);
assert.equal(getDesktopLyricsTrackKey(undefined), null);

assert.equal(isNativeWayland('wayland', 'x11'), true);
assert.equal(isNativeWayland('', 'wayland'), true);
assert.equal(isNativeWayland('x11', 'wayland'), false);
assert.equal(isNativeWayland('', 'x11'), false);
console.log('Desktop lyrics checks passed');

assert.deepEqual(
    desktopLyricsSettingsSchema.parse(defaultDesktopLyricsSettings),
    defaultDesktopLyricsSettings,
);
for (const patch of [
    { translationFont: 'url(https://example.com)' },
    { translationFontSize: 0 },
    { translationFontSize: 129 },
    { translationFontSize: Infinity },
    { translationFontSize: 26.5 },
    { translationFontSize: '26' },
    { font: 'url(https://example.com)' },
    { fontSize: 999 },
    { fontSize: Infinity },
    { fontSize: '26' },
    { fontSize: 0 },
    { fontSize: 129 },
    { fontSize: 26.5 },
    { fontSize: NaN },
    { outline: '2px red' },
    { shadow: 'true' },
    { showTranslation: 'false' },
    { singleLine: 'true' },
    { layout: 'absolute' },
    { css: 'background: red' },
]) {
    assert.equal(
        desktopLyricsSettingsSchema.safeParse({ ...defaultDesktopLyricsSettings, ...patch })
            .success,
        false,
    );
}
for (let fontSize = 20; fontSize <= 128; fontSize++) {
    assert.equal(
        desktopLyricsSettingsSchema.parse({ ...defaultDesktopLyricsSettings, fontSize }).fontSize,
        fontSize,
    );
    for (const availableHeight of [56, 112]) {
        for (const [current, next] of [
            [first, second],
            [second, second],
            [['A_BREAK_B_BREAK_C'], second],
            [Array(20).fill('line'), second],
            [[], []],
        ]) {
            const [currentSize, nextSize] = getDesktopLyricsFontSizes(
                current,
                next,
                fontSize,
                availableHeight,
            );
            const rows = (lines) =>
                lines.reduce((sum, line) => sum + line.split('_BREAK_').length, 0);
            assert.ok(
                1.2 * (rows(current) * currentSize + rows(next) * nextSize) <=
                    availableHeight + 1e-8,
            );
            assert.ok(currentSize <= fontSize && nextSize < currentSize);
            assert.ok(currentSize > 0 && nextSize > 0);
        }
    }
}
console.log('Desktop lyrics safe settings and multiline height checks passed');

assert.deepEqual(
    [
        defaultDesktopLyricsSettings.fontSize,
        defaultDesktopLyricsSettings.outline,
        defaultDesktopLyricsSettings.fontGradient,
        defaultDesktopLyricsSettings.fontGradientTop,
        defaultDesktopLyricsSettings.fontGradientColor,
        defaultDesktopLyricsSettings.layout,
        defaultDesktopLyricsSettings.widthCharacters,
        defaultDesktopLyricsSettings.shadow,
    ],
    [24, 2, true, 'rgb(255, 255, 255)', 'rgb(214, 81, 63)', 'diagonal', 20, true],
);
const legacyDefaults = {
    ...defaultDesktopLyricsSettings,
    fontGradient: false,
    fontGradientColor: '#ffffff',
    fontGradientTop: '#ffffff',
    widthCharacters: 20,
};
assert.deepEqual(desktopLyricsSettingsSchema.parse(legacyDefaults), legacyDefaults);
assert.equal(
    getEffectiveDesktopLyricsSettings(defaultDesktopLyricsSettings).translationFontSize,
    19,
);
assert.equal(
    getEffectiveDesktopLyricsSettings(defaultDesktopLyricsSettings).translationFontGradientColor,
    'rgb(214, 81, 63)',
);
for (const [height, primary, next] of [
    [720, 16, 14],
    [1080, 24, 21],
    [1440, 32, 28],
    [1620, 36, 32],
    [2160, 48, 43],
    [1440.25, 32, 28],
    [4320, 96, 86],
]) {
    const defaults = getDefaultDesktopLyricsSettings(height);
    assert.equal(defaults.fontSize, primary);
    assert.equal(defaults.nextStyle.fontSize, next);
    assert.deepEqual(desktopLyricsSettingsSchema.parse(defaults), defaults);
    const effective = getEffectiveDesktopLyricsSettings(defaults);
    assert.equal(effective.nextStyle.fontSize, next);
    assert.equal(effective.translationFontSize, Math.floor(primary * 0.8));
    assert.equal(effective.nextTranslationStyle.fontSize, Math.floor(next * 0.8));
    const independentTranslation = setDesktopLyricsIndependent(
        defaults,
        'nextTranslationIndependent',
        true,
    );
    assert.equal(independentTranslation.nextTranslationStyle.fontSize, next);
    assert.equal(desktopLyricsSettingsSchema.safeParse(independentTranslation).success, true);
}
assert.equal(defaultDesktopLyricsSettings.font.builtIn, 'Poppins');
assert.equal(defaultDesktopLyricsSettings.backgroundOpacity, 10);
assert.equal(defaultDesktopLyricsSettings.nextStyle.fontGradientColor, 'rgb(245, 184, 78)');
assert.equal(defaultDesktopLyricsSettings.nextIndependent, true);
console.log(
    'Requested fresh defaults, screen-height flooring, 90% next emphasis, low-resolution validity and unchanged saved preferences: PASS',
);

// Restored text outline keeps existing preferences and handles the outline-free version.
const savedStyle = { font: 'serif', fontSize: 32, layout: 'diagonal', shadow: false };
const migratedFont = { builtIn: 'serif', custom: null, system: null, type: 'builtIn' };
for (const outline of [undefined, 'none', 'thin', 'thick']) {
    const value = { ...savedStyle, ...(outline ? { outline } : {}) };
    const migrated = desktopLyricsSettingsSchema.parse(value);
    assert.deepEqual(migrated.font, migratedFont);
    assert.deepEqual(migrated.translationFont, migratedFont);
    assert.equal(migrated.fontSize, 32);
    assert.equal(migrated.translationFontSize, 32);
    assert.equal(migrated.outline, outline ? { none: 0, thick: 2, thin: 1 }[outline] : 1);
    assert.equal(migrated.translationOutline, migrated.outline);
    assert.equal(migrated.shadow, false);
    assert.equal(migrated.rollingMode, false);
    assert.equal(migrated.backgroundOpacity, 35);
    assert.equal(migrated.nextIndependent, false);
    assert.equal(migrated.nextStyle.fontSize, 24);
    assert.equal(migrated.nextStyle.font.builtIn, 'Inter');
}
assert.equal(defaultDesktopLyricsSettings.outline, 2);
console.log('Restored text outline and outline-free preference compatibility: PASS');

// Exercise the actual main-process IPC/lifecycle without opening native windows.
const { readFileSync } = await import('node:fs');
const { createRequire } = await import('node:module');
const { EventEmitter } = await import('node:events');
const { runInNewContext } = await import('node:vm');
const require = createRequire(import.meta.url);
const { ModuleKind, transpileModule } = require('typescript');
const handlers = new Map();
const testApp = new EventEmitter();
const windows = [];
let cursor = { x: -1, y: -1 };
let tick;
const preferences = new Map();
let failWrites = false;
class TestWindow extends EventEmitter {
    constructor(options) {
        super();
        this.options = options;
        this.visible = false;
        this.raises = 0;
        this.webContents = Object.assign(new EventEmitter(), {
            send(...args) {
                this.sent.push(args);
            },
            sent: [],
            setWindowOpenHandler(handler) {
                this.windowOpenHandler = handler;
            },
        });
        windows.push(this);
    }
    destroy() {
        this.destroyed = true;
        this.visible = false;
        this.emit('closed');
    }
    focus() {
        this.focused = true;
        this.emit('focus');
    }
    getBounds() {
        return {
            height: this.options.height ?? 160,
            width: this.options.width ?? 640,
            x: this.options.x ?? 90,
            y: this.options.y ?? 150,
        };
    }
    hide() {
        this.visible = false;
        this.emit('hide');
    }
    isAlwaysOnTop() {
        return this.top?.[0] ?? false;
    }
    isDestroyed() {
        return Boolean(this.destroyed);
    }
    isMinimized() {
        return false;
    }
    isVisible() {
        return this.visible;
    }
    async loadFile(_path, options) {
        this.loadedQuery = options?.query;
        this.lockAtLoad = this.ignoresMouse;
    }
    moveTop() {
        this.raises++;
    }
    restore() {
        this.show();
    }
    setAlwaysOnTop(...args) {
        this.top = args;
    }
    setBounds(bounds) {
        Object.assign(this.options, bounds);
        this.emit('resize');
    }
    setFocusable(value) {
        this.focusabilityChanges = (this.focusabilityChanges ?? 0) + 1;
        this.focusable = value;
    }
    setIgnoreMouseEvents(value) {
        this.ignoresMouse = value;
    }
    setSize(width, height) {
        this.setBounds({ height, width });
    }
    show() {
        this.showInactive();
    }
    showInactive() {
        this.visible = true;
        this.emit('show');
    }
}
const main = new TestWindow({});
main.visible = true;
const exports = {};
const compiledFeature = transpileModule(
    readFileSync(
        new URL('../src/main/features/core/desktop-lyrics/index.ts', import.meta.url),
        'utf8',
    ),
    {
        compilerOptions: { esModuleInterop: true, module: ModuleKind.CommonJS },
    },
).outputText;
let testDisplay = {
    scaleFactor: 1,
    size: { height: 1080, width: 1920 },
    workArea: { height: 1080, width: 1920, x: 0, y: 0 },
};
const testScreen = Object.assign(new EventEmitter(), {
    getCursorScreenPoint: () => cursor,
    getDisplayMatching: () => testDisplay,
    getPrimaryDisplay: () => testDisplay,
});
let chooseDesktopFont = async () => ({ filePaths: [] });
const context = {
    __dirname: '/test/main',
    clearInterval() {
        tick = undefined;
    },
    clearTimeout,
    exports,
    process: { env: {}, platform: 'darwin' },
    require: (name) => {
        if (name === 'electron')
            return {
                app: testApp,
                BrowserWindow: TestWindow,
                dialog: { showOpenDialog: (...args) => chooseDesktopFont(...args) },
                ipcMain: {
                    handle: (key, fn) => handlers.set(key, fn),
                    on: (key, fn) => handlers.set(key, fn),
                },
                screen: testScreen,
            };
        if (name === '../settings')
            return {
                store: {
                    get: (key) => preferences.get(key),
                    set: (key, value) => {
                        if (failWrites) throw new Error('Disk failure');
                        preferences.set(key, value);
                    },
                },
            };
        if (name === '/@/main/logger')
            return {
                error() {
                    /* Expected failure paths are asserted below. */
                },
                info() {
                    /* No log output is needed in the lifecycle mock. */
                },
                warn() {
                    /* Expected failure paths are asserted below. */
                },
            };
        if (name === '/@/main/utils/window-bounds')
            return { resolveWindowBounds: (value) => value };
        if (name === '/@/shared/utils/desktop-lyrics')
            return {
                applyDesktopLyricsTime,
                defaultDesktopLyricsSettings,
                desktopLyricsSettingsSchema,
                getDefaultDesktopLyricsSettings,
                getDesktopLyricsWindowSize,
                getEffectiveDesktopLyricsSettings,
                isDesktopLyricsCurrentOnBottom,
                isNativeWayland,
                setDesktopLyricsIndependent,
            };
        return require(name);
    },
    setInterval: (callback) => {
        tick = callback;
        return 1;
    },
    setTimeout,
};
runInNewContext(compiledFeature, context);
const feature = exports.initDesktopLyrics(
    () => main,
    () => {},
);
const restore = () =>
    handlers.get('desktop-lyrics-restore')(
        { sender: main.webContents },
        { close: 'Close', unlock: 'Unlock' },
    );
assert.equal((await restore()).open, false);
assert.equal(windows.length, 1); // First launch never creates an overlay automatically.
assert.throws(() => handlers.get('desktop-lyrics-restore')({ sender: {} }, {}), /Invalid/);
await handlers.get('desktop-lyrics-open')(
    { sender: main.webContents },
    { close: 'Close', unlock: 'Unlock' },
);
const overlay = windows[1];
assert.equal(overlay.options.webPreferences.backgroundThrottling, false);
assert.equal(overlay.options.hasShadow, false);
assert.equal(feature.getState().locked, false);
assert.equal(overlay.lockAtLoad, false);
assert.deepEqual(Array.from(overlay.top), [true, 'screen-saver']);
const raises = overlay.raises;
overlay.emit('blur');
assert.equal(overlay.raises, raises + 1);
feature.setLocked(true);
assert.equal(overlay.ignoresMouse, true);
assert.equal(overlay.focusable, false);
assert.throws(
    () => handlers.get('desktop-lyrics-lock')({ sender: overlay.webContents }, false),
    /main window/,
);
assert.equal(windows.length, 2); // Only the main window and lyrics window exist, even when locked.
assert.equal(handlers.has('desktop-lyrics-unlock'), false);
assert.equal(handlers.has('desktop-lyrics-unlock-ready'), false);
cursor = { x: overlay.getBounds().x + 30, y: overlay.getBounds().y + 30 };
tick();
assert.equal(windows.length, 2); // Hover cannot create an auxiliary unlock button or input surface.
assert.equal(overlay.ignoresMouse, true);
main.emit('minimize');
main.emit('hide');
assert.equal(overlay.visible, true);
assert.equal(overlay.ignoresMouse, true);
handlers.get('desktop-lyrics-lock')({ sender: main.webContents }, false);
assert.equal(overlay.ignoresMouse, false);
feature.setLocked(true);
feature.setLocked(false);
main.emit('minimize');
assert.equal(overlay.visible, true);
const visibleRaises = overlay.raises;
overlay.emit('blur');
assert.equal(overlay.raises, visibleRaises + 1);
assert.equal(main.listenerCount('minimize'), 0);
assert.equal(main.listenerCount('hide'), 0);
main.emit('restore');
assert.equal(overlay.visible, true);
feature.close();
assert.equal(preferences.get('desktop_lyrics_open'), false);
const closedCount = windows.length;
assert.equal((await restore()).open, false);
assert.equal(windows.length, closedCount);
assert.equal(main.listenerCount('restore'), 0);
console.log('Desktop lyrics non-activating raise, lock recovery and main-window lifecycle: PASS');

const open = () =>
    handlers.get('desktop-lyrics-open')(
        { sender: main.webContents },
        { close: 'Close', unlock: 'Unlock' },
    );
main.visible = false;
await open();
let reopened = windows.at(-1);
assert.equal(reopened.visible, true); // Opening while the main window is hidden still shows lyrics.
main.visible = true;
assert.equal(reopened.options.x, 90);
assert.equal(reopened.options.y, 150);
assert.equal(reopened.ignoresMouse, false);
reopened.options.x = 340;
reopened.options.y = 250;
reopened.emit('move');
feature.setLocked(true);
feature.close();
assert.equal(feature.getState().locked, false); // Closed UI must not display a stale lock banner.
assert.equal(preferences.get('desktop_lyrics_locked'), true);
await open();
reopened = windows.at(-1);
assert.equal(reopened.options.x, 340);
assert.equal(reopened.options.y, 250);
assert.equal(reopened.lockAtLoad, true); // Native passthrough applied before loading/showing.
assert.equal(reopened.ignoresMouse, true);
assert.equal(feature.getState().locked, true);
assert.throws(
    () => handlers.get('desktop-lyrics-lock')({ sender: reopened.webContents }, false),
    /main window/,
);
handlers.get('desktop-lyrics-lock')({ sender: main.webContents }, false);
feature.close();
await open();
assert.equal(windows.at(-1).lockAtLoad, false);
feature.setLocked(true);
testApp.emit('before-quit');
assert.equal(feature.getState().open, false);
assert.equal(preferences.get('desktop_lyrics_open'), true); // Teardown must not erase user intent.
const displayPreferences = {
    ...defaultDesktopLyricsSettings,
    displayMode: 'original',
    fontSize: 64,
    showTranslation: false,
    singleLine: true,
    widthCharacters: 35,
};
handlers.get('desktop-lyrics-settings-update')({ sender: main.webContents }, displayPreferences);
// A new feature instance simulates an app restart, retaining only the persisted preferences.
const restarted = exports.initDesktopLyrics(
    () => main,
    () => {},
);
assert.equal(restarted.getState().open, false);
await restore();
const restoredCount = windows.length;
await restore();
assert.equal(windows.length, restoredCount); // Duplicate mounts/restore calls reuse the existing window.
assert.equal(restarted.getState().locked, true);
assert.deepEqual(
    handlers.get('desktop-lyrics-settings')({ sender: main.webContents }),
    displayPreferences,
);
assert.equal(windows.at(-1).lockAtLoad, true);
assert.equal(windows.at(-1).options.x, 0); // Full work-area width clamps the saved x position.
failWrites = true;
restarted.setLocked(false);
assert.equal(restarted.getState().locked, false);
assert.equal(windows.at(-1).ignoresMouse, false); // Storage failure must never prevent recovery.
restarted.close();
failWrites = false;
assert.equal(restarted.getState().open, false);
preferences.set('desktop_lyrics_open', true);
await restore();
restarted.close();
assert.equal(preferences.get('desktop_lyrics_open'), false);
assert.equal((await restore()).open, false);
assert.equal(restarted.getState().open, false);
assert.equal(main.listenerCount('restore'), 0);
console.log(
    'Font size 20-128, position/lock reopen and restart persistence, external unlock on storage failure: PASS',
);

// Evaluate the startup feature list on each platform, preserving existing switches.
const startup = readFileSync(new URL('../src/main/index.ts', import.meta.url), 'utf8');
const featureBlock = startup.slice(
    startup.indexOf('const chromiumDisabledFeatures:'),
    startup.indexOf('// https://github.com/electron/electron/issues/46538'),
);
for (const platform of ['darwin', 'win32', 'linux']) {
    const switches = new Map();
    runInNewContext(transpileModule(featureBlock, {}).outputText, {
        app: { commandLine: { appendSwitch: (key, value) => switches.set(key, value) } },
        isLinux: () => platform === 'linux',
        isMacOS: () => platform === 'darwin',
        shouldDisableMediaFeatures: true,
    });
    const disabled = switches.get('disable-features').split(',');
    assert.equal(disabled.includes('MacWebContentsOcclusion'), platform === 'darwin');
    assert.equal(disabled.includes('WaylandFractionalScaleV1'), platform === 'linux');
    assert.ok(
        disabled.includes('HardwareMediaKeyHandling') && disabled.includes('MediaSessionService'),
    );
}
console.log('macOS occlusion workaround and existing platform feature switches: PASS');

// Translation visibility picks the original row, independently of hiding the next group.
for (const showTranslation of [true, false]) {
    for (const singleLine of [true, false]) {
        const settings = {
            displayMode: showTranslation ? 'both' : 'original',
            showTranslation,
            singleLine,
        };
        const pick = (lines) => lines.slice(0, showTranslation ? 2 : 1);
        assert.deepEqual(getDesktopLyricsPair({ ...grouped, timestamp: 1 }, settings), [
            pick(first),
            singleLine ? [] : pick(second),
        ]);
        assert.deepEqual(
            getDesktopLyricsPair({ ...grouped, offsetMs: 1000, timestamp: 1 }, settings),
            [pick(second), singleLine ? [] : ['Last']],
        );
        assert.deepEqual(getDesktopLyricsPair({ ...snapshot, timestamp: 1 }, settings), [
            ['First'],
            singleLine ? [] : ['Second'],
        ]);
        assert.deepEqual(getDesktopLyricsPair({ ...snapshot, lines: [] }, settings), [
            ['Song'],
            [],
        ]);
        assert.deepEqual(getDesktopLyricsPair({ ...grouped, timestamp: 0 }, settings), [
            ['Song'],
            singleLine ? [] : pick(first),
        ]);
    }
}
assert.deepEqual(
    getDesktopLyricsPair(
        { ...grouped, timestamp: 2 },
        { displayMode: 'original', showTranslation: false, singleLine: false },
    ),
    [['Second original'], ['Last']],
);
assert.deepEqual(
    desktopLyricsSettingsSchema.parse({
        ...defaultDesktopLyricsSettings,
        displayMode: 'original',
        showTranslation: false,
        singleLine: true,
    }),
    {
        ...defaultDesktopLyricsSettings,
        displayMode: 'original',
        showTranslation: false,
        singleLine: true,
    },
);
console.log(
    'Translation last-row selection, single/current-group mode, offset, empty and legacy preferences: PASS',
);

console.log(
    'First launch off, explicit close stays off, quit preserves open intent, startup restore is idempotent and locked: PASS',
);

// Width fits the configured full-width character count plus padding, capped by the work area.
const area = { height: 1080, width: 1920 };
for (const fontSize of [20, 64, 96, 128]) {
    const settings = { ...defaultDesktopLyricsSettings, fontSize };
    const size = getDesktopLyricsWindowSize(grouped, settings, area);
    const [currentSize] = getDesktopLyricsFontSizes(
        second,
        second,
        fontSize,
        size.height - 58,
        settings.translationFontSize,
    );
    assert.equal(currentSize, fontSize);
    assert.equal(
        size.width,
        Math.min(area.width, fontSize * defaultDesktopLyricsSettings.widthCharacters + 32),
    );
    assert.ok(size.height <= area.height);
}
assert.ok(
    getDesktopLyricsWindowSize(grouped, { ...defaultDesktopLyricsSettings, fontSize: 128 }, area)
        .height > 160,
);
for (const fontSize of [20, 26, 64, 128]) {
    assert.equal(
        getDesktopLyricsWindowSize(
            null,
            { ...defaultDesktopLyricsSettings, fontSize },
            { height: 1080, width: 10000 },
        ).width,
        fontSize * defaultDesktopLyricsSettings.widthCharacters + 32,
    );
}
assert.equal(
    getDesktopLyricsWindowSize(
        grouped,
        { ...defaultDesktopLyricsSettings, translationFontSize: 128 },
        area,
    ).width,
    512,
);
for (const width of [800, 1440, 1920, 2560, 3441]) {
    assert.equal(
        getDesktopLyricsWindowSize(null, defaultDesktopLyricsSettings, { height: 1080, width })
            .width,
        Math.min(
            width,
            defaultDesktopLyricsSettings.fontSize * defaultDesktopLyricsSettings.widthCharacters +
                32,
        ),
    );
}
assert.ok(
    getDesktopLyricsWindowSize(
        grouped,
        { ...defaultDesktopLyricsSettings, fontSize: 128, singleLine: true },
        area,
    ).height <
        getDesktopLyricsWindowSize(
            grouped,
            { ...defaultDesktopLyricsSettings, fontSize: 128 },
            area,
        ).height,
);
assert.ok(
    getDesktopLyricsWindowSize(
        grouped,
        {
            ...defaultDesktopLyricsSettings,
            displayMode: 'original',
            fontSize: 128,
            showTranslation: false,
        },
        area,
    ).height <
        getDesktopLyricsWindowSize(
            grouped,
            { ...defaultDesktopLyricsSettings, fontSize: 128 },
            area,
        ).height,
);
assert.deepEqual(
    getDesktopLyricsWindowSize({ ...snapshot, lines: [] }, defaultDesktopLyricsSettings, area),
    { height: 170, width: 512 },
);
const huge = getDesktopLyricsWindowSize(
    { ...snapshot, lines: [{ startMs: 0, text: Array(50).fill('row').join('_BREAK_') }] },
    { ...defaultDesktopLyricsSettings, fontSize: 128, nextIndependent: false },
    { height: 400, width: 800 },
);
assert.deepEqual(huge, { height: 400, width: 800 });
handlers.get('desktop-lyrics-settings-update')(
    { sender: main.webContents },
    defaultDesktopLyricsSettings,
);
preferences.set('desktop_lyrics_locked', false);
await open();
const resized = windows.at(-1);
const before = resized.getBounds();
assert.equal(resized.options.type, 'panel');
assert.equal(resized.options.parent, undefined);
// Resizing preferences keep the previous center, unless the screen edge clamps it.
resized.setBounds({ ...before, x: 500, y: 300 });
for (const patch of [{ widthCharacters: 25 }, { fontSize: 40 }, { fontSize: 24 }, {}]) {
    const previous = resized.getBounds();
    handlers.get('desktop-lyrics-settings-update')(
        { sender: main.webContents },
        { ...defaultDesktopLyricsSettings, ...patch },
    );
    const next = resized.getBounds();
    assert.ok(Math.abs(next.x + next.width / 2 - previous.x - previous.width / 2) <= 0.5);
    assert.ok(Math.abs(next.y + next.height / 2 - previous.y - previous.height / 2) <= 0.5);
}
console.log(
    'Preference resizing preserves both center coordinates with native pixel rounding: PASS',
);

handlers.get('desktop-lyrics-settings-update')(
    { sender: main.webContents },
    { ...defaultDesktopLyricsSettings, fontSize: 128 },
);
handlers.get('desktop-lyrics-publish')({ sender: main.webContents }, grouped);
const after = resized.getBounds();
assert.equal(before.width, 512);
assert.equal(after.width, 1920);
assert.ok(after.height > before.height);
assert.ok(after.x >= 0 && after.x + after.width <= area.width);
assert.ok(after.y >= 0 && after.y + after.height <= area.height);
restarted.setLocked(true);
assert.equal(resized.ignoresMouse, true);
handlers.get('desktop-lyrics-settings-update')(
    { sender: main.webContents },
    defaultDesktopLyricsSettings,
);
assert.equal(resized.ignoresMouse, true);
restarted.close();
assert.equal(resized.isDestroyed(), true);
console.log(
    'Font size 20-128, native enlargement, multiline fitting, no auxiliary unlock button and sender validation: PASS',
);

// Native Wayland preserves whole-window passthrough and external recovery.
const waylandExports = {};
testApp.commandLine = { getSwitchValue: () => 'wayland' };
runInNewContext(compiledFeature, {
    ...context,
    exports: waylandExports,
    process: { env: { XDG_SESSION_TYPE: 'wayland' }, platform: 'linux' },
});
const wayland = waylandExports.initDesktopLyrics(
    () => main,
    () => {},
);
preferences.set('desktop_lyrics_locked', false);
const beforeWayland = windows.length;
await open();
const waylandOverlay = windows.at(-1);
wayland.setLocked(true);
await new Promise((resolve) => setImmediate(resolve));
assert.equal(windows.length, beforeWayland + 1);
assert.equal(wayland.getState().wayland, true);
assert.equal(waylandOverlay.options.type, undefined);
assert.equal(waylandOverlay.ignoresMouse, true);
handlers.get('desktop-lyrics-lock')({ sender: main.webContents }, false);
assert.equal(waylandOverlay.ignoresMouse, false);
wayland.close();
console.log(
    'Wayland: no auxiliary unlock window, whole-window passthrough and main-window recovery: PASS',
);

assert.ok(
    !readFileSync(
        new URL('../src/renderer/features/lyrics/desktop-lyrics-window.tsx', import.meta.url),
        'utf8',
    ).includes('DesktopLyricsUnlock'),
);
assert.ok(
    !readFileSync(new URL('../src/preload/desktop-lyrics.ts', import.meta.url), 'utf8').includes(
        'desktop-lyrics-unlock',
    ),
);
console.log(
    'Locked lyrics have no auxiliary window/button; main-window and tray recovery remain available: PASS',
);

// Independent primary/translation fonts and sizes fit the selected timestamp-group rows.
const translationSettings = {
    ...defaultDesktopLyricsSettings,
    font: { builtIn: 'Poppins', custom: null, system: null, type: 'builtIn' },
    fontSize: 20,
    nextIndependent: false,
    translationFont: { builtIn: 'Inter', custom: null, system: 'Arial', type: 'system' },
    translationFontSize: 128,
    translationIndependent: true,
};
assert.deepEqual(desktopLyricsSettingsSchema.parse(translationSettings), translationSettings);
for (const primarySize of [20, 64, 128])
    for (const translationSize of [20, 64, 128]) {
        const settings = {
            ...translationSettings,
            fontSize: primarySize,
            translationFontSize: translationSize,
        };
        const size = getDesktopLyricsWindowSize(grouped, settings, area);
        const [a, b, c, d] = getDesktopLyricsFontSizes(
            second,
            second,
            primarySize,
            size.height - 58,
            translationSize,
        );
        assert.equal(a, primarySize);
        assert.equal(c, translationSize);
        assert.ok(1.2 * (a + c + b + d) <= size.height - 58 + 1e-8);
        const fitted = getDesktopLyricsFontSizes(
            Array(30).fill('line'),
            second,
            primarySize,
            112,
            translationSize,
        );
        assert.ok(1.2 * (fitted[0] + 29 * fitted[2] + fitted[1] + fitted[3]) <= 112 + 1e-8);
    }
assert.ok(
    getDesktopLyricsWindowSize(grouped, translationSettings, area).height >
        getDesktopLyricsWindowSize(grouped, defaultDesktopLyricsSettings, area).height,
);
assert.equal(
    getDesktopLyricsWindowSize(
        grouped,
        { ...translationSettings, displayMode: 'original', showTranslation: false },
        area,
    ).height,
    170,
);
preferences.set('desktop_lyrics_locked', false);
await handlers.get('desktop-lyrics-open')(
    { sender: main.webContents },
    { close: 'Close', unlock: 'Unlock' },
);
handlers.get('desktop-lyrics-settings-update')({ sender: main.webContents }, translationSettings);
wayland.close();
assert.deepEqual(
    handlers.get('desktop-lyrics-settings')({ sender: main.webContents }),
    translationSettings,
);
console.log(
    'Independent translation font/size, legacy inheritance, safe values, multirow fitting and preference persistence: PASS',
);

assert.deepEqual(
    getDesktopLyricsPair({
        ...snapshot,
        lines: [
            { startMs: 1000, text: 'Primary' },
            { startMs: 1000, text: 'Translation' },
            { startMs: 1000, text: 'Ignore older' },
            { startMs: 1000, text: 'Ignore this too' },
            { startMs: 2000, text: 'Next primary' },
            { startMs: 2000, text: 'Next translation' },
        ],
        timestamp: 1,
    }),
    [
        ['Primary', 'Translation'],
        ['Next primary', 'Next translation'],
    ],
);
assert.deepEqual(
    getDesktopLyricsPair(
        {
            ...snapshot,
            lines: [
                { startMs: 1000, text: 'Primary' },
                { startMs: 1000, text: 'Translation' },
                { startMs: 1000, text: 'Ignore older' },
            ],
            timestamp: 1,
        },
        { ...defaultDesktopLyricsSettings, displayMode: 'original', showTranslation: false },
    ),
    [['Primary'], []],
);
console.log(
    'Original first in timestamp groups, translation second, extra rows hidden, distinct next timestamp: PASS',
);

// Desktop custom-font protocol chooses only explicitly saved paths, never a URL-supplied filename.
const customFontSettings = {
    ...translationSettings,
    font: { ...translationSettings.font, custom: '/tmp/primary font.woff2', type: 'custom' },
    translationFont: {
        ...translationSettings.translationFont,
        custom: '/tmp/translation.ttf',
        type: 'custom',
    },
};
handlers.get('desktop-lyrics-settings-update')({ sender: main.webContents }, customFontSettings);
assert.equal(wayland.getFontPath('/primary'), '/tmp/primary font.woff2');
assert.equal(wayland.getFontPath('/translation'), '/tmp/translation.ttf');
assert.equal(wayland.getFontPath('/etc/passwd'), null);
assert.equal(wayland.getFontPath('/primary/../../etc/passwd'), null);
for (const patch of [
    { system: 'Arial";body{display:none}', type: 'system' },
    { custom: 'https://example.com/font.woff2', type: 'custom' },
    { custom: '/tmp/config.json', type: 'custom' },
    { builtIn: 'anything; color:red' },
    { css: 'arbitrary', custom: '/tmp/font.woff2' },
])
    assert.equal(
        desktopLyricsSettingsSchema.safeParse({
            ...translationSettings,
            font: { ...translationSettings.font, ...patch },
        }).success,
        false,
    );
for (const custom of ['/tmp/font.woff2', 'C:\\Fonts\\test.ttf', '\\\\server\\share\\font.otf'])
    assert.equal(
        desktopLyricsSettingsSchema.safeParse({
            ...customFontSettings,
            font: { ...customFontSettings.font, custom },
        }).success,
        true,
    );
console.log('System/custom font persistence, saved-path-only lookup and CSS/path validation: PASS');

// Execute the actual app protocol handler: reject arbitrary paths/non-font files and
// do not report desktop font failures as errors in the main application's font settings.
const fontMainSource = readFileSync(new URL('../src/main/index.ts', import.meta.url), 'utf8');
const protocolSource = fontMainSource.slice(
    fontMainSource.indexOf("protocol.handle('feishin'"),
    fontMainSource.indexOf(
        'session.defaultSession.webRequest.onHeadersReceived',
        fontMainSource.indexOf("protocol.handle('feishin'"),
    ),
);
const fontHeaders = fontMainSource.slice(
    fontMainSource.indexOf('const FONT_HEADERS'),
    fontMainSource.indexOf('const singleInstance'),
);
let fontFetches = [],
    fontHandler,
    mainFontErrors = 0,
    validFont = true;
runInNewContext(
    transpileModule(fontHeaders + protocolSource, {
        compilerOptions: { module: ModuleKind.CommonJS },
    }).outputText,
    {
        desktopLyrics: wayland,
        getMainWindow: () => ({ webContents: { send: () => mainFontErrors++ } }),
        net: {
            fetch: async (url) => {
                fontFetches.push(url);
                return new Response(
                    validFont ? new Uint8Array([0x77, 0x4f, 0x46, 0x32, 0]) : 'not a font',
                );
            },
        },
        pathToFileURL: require('node:url').pathToFileURL,
        protocol: {
            handle: (name, fn) => {
                assert.equal(name, 'feishin');
                fontHandler = fn;
            },
        },
        Response,
        store: { get: () => '/tmp/app.ttf' },
        URL,
    },
);
assert.equal(
    (await fontHandler({ url: 'feishin://desktop-lyrics/primary?file=/etc/passwd' })).status,
    200,
);
assert.equal(fontFetches.at(-1), 'file:///tmp/primary%20font.woff2');
assert.equal((await fontHandler({ url: 'feishin://desktop-lyrics/translation' })).status, 200);
assert.equal(fontFetches.at(-1), 'file:///tmp/translation.ttf');
const fetchedCount = fontFetches.length;
assert.equal((await fontHandler({ url: 'feishin://desktop-lyrics/unknown' })).status, 403);
assert.equal(fontFetches.length, fetchedCount);
validFont = false;
assert.equal((await fontHandler({ url: 'feishin://desktop-lyrics/primary' })).status, 403);
assert.equal(mainFontErrors, 0);
assert.equal((await fontHandler({ url: 'feishin:/app.ttf' })).status, 403);
assert.equal(mainFontErrors, 1);
console.log(
    'Actual custom font protocol: saved-path routing, magic-number validation and independent main-font errors: PASS',
);

// New preferences have safe defaults for existing users and persist with the other settings.
const oldPreferences = { ...defaultDesktopLyricsSettings };
delete oldPreferences.backgroundOpacity;
delete oldPreferences.transparentBackground;
delete oldPreferences.widthCharacters;

assert.deepEqual(desktopLyricsSettingsSchema.parse(oldPreferences), {
    ...defaultDesktopLyricsSettings,
    backgroundOpacity: 35,
    widthCharacters: 20,
});
assert.equal(defaultDesktopLyricsSettings.backgroundOpacity, 10);
assert.equal(
    desktopLyricsSettingsSchema.parse({ ...defaultDesktopLyricsSettings, widthCharacters: 10 })
        .widthCharacters,
    10,
);
assert.equal(
    desktopLyricsSettingsSchema.parse({ ...defaultDesktopLyricsSettings, widthCharacters: 35 })
        .widthCharacters,
    35,
);
assert.equal(desktopLyricsSettingsSchema.parse(oldPreferences).backgroundOpacity, 35);
assert.equal(
    desktopLyricsSettingsSchema.parse({ ...oldPreferences, backgroundOpacity: 80 })
        .backgroundOpacity,
    80,
);
for (const patch of [
    { widthCharacters: 9 },
    { widthCharacters: 51 },
    { widthCharacters: 35.5 },
    { backgroundOpacity: -1 },
    { backgroundOpacity: 101 },
    { backgroundOpacity: 80.5 },
    { transparentBackground: 'true' },
    { backgroundOpacity: '80' },
]) {
    assert.equal(
        desktopLyricsSettingsSchema.safeParse({ ...defaultDesktopLyricsSettings, ...patch })
            .success,
        false,
    );
}
for (const widthCharacters of [10, 20, 35, 50])
    for (const fontSize of [20, 26, 64, 128]) {
        const settings = { ...defaultDesktopLyricsSettings, fontSize, widthCharacters };
        assert.equal(
            getDesktopLyricsWindowSize(null, settings, { height: 1080, width: 10000 }).width,
            fontSize * widthCharacters + 32,
        );
        assert.equal(
            getDesktopLyricsWindowSize(grouped, settings, { height: 1080, width: 800 }).width,
            Math.min(800, fontSize * widthCharacters + 32),
        );
    }
const appearance = {
    ...customFontSettings,
    backgroundOpacity: 40,
    transparentBackground: false,
    widthCharacters: 20,
};
await handlers.get('desktop-lyrics-open')(
    { sender: main.webContents },
    { close: 'Close', unlock: 'Unlock' },
);
handlers.get('desktop-lyrics-settings-update')({ sender: main.webContents }, appearance);
wayland.setLocked(true);
assert.equal(windows.at(-1).ignoresMouse, true);
wayland.close();
await handlers.get('desktop-lyrics-open')(
    { sender: main.webContents },
    { close: 'Close', unlock: 'Unlock' },
);
assert.deepEqual(handlers.get('desktop-lyrics-settings')({ sender: main.webContents }), appearance);
assert.equal(
    windows.at(-1).getBounds().width,
    appearance.fontSize * appearance.widthCharacters + 32,
);
assert.equal(windows.at(-1).ignoresMouse, true);
wayland.close();
console.log(
    'macOS panel, width slider 20-50/default20, background preferences validation/persistence and whole-window passthrough: PASS',
);

// Independent text appearance is validated at IPC and survives close/reopen.
const oldTextPreferences = { ...defaultDesktopLyricsSettings };
delete oldTextPreferences.fontColor;
delete oldTextPreferences.fontOpacity;
delete oldTextPreferences.translationFontColor;
delete oldTextPreferences.translationFontOpacity;

assert.deepEqual(desktopLyricsSettingsSchema.parse(oldTextPreferences), {
    ...defaultDesktopLyricsSettings,
    fontColor: '#ffffff',
    translationFontColor: '#ffffff',
});
for (const key of ['fontColor', 'translationFontColor']) {
    for (const value of [
        '#fff',
        'red',
        '#gg0000',
        '#11223344',
        'var(--color)',
        '#ffffff;opacity:0',
        null,
    ]) {
        assert.equal(
            desktopLyricsSettingsSchema.safeParse({ ...defaultDesktopLyricsSettings, [key]: value })
                .success,
            false,
        );
    }
    assert.equal(
        desktopLyricsSettingsSchema.safeParse({ ...defaultDesktopLyricsSettings, [key]: '#Aa33Ff' })
            .success,
        true,
    );
}
for (const key of ['fontOpacity', 'translationFontOpacity']) {
    for (const value of [-1, 101, 1.5, NaN, Infinity, '50', null]) {
        assert.equal(
            desktopLyricsSettingsSchema.safeParse({ ...defaultDesktopLyricsSettings, [key]: value })
                .success,
            false,
        );
    }
    for (const value of [0, 50, 100])
        assert.equal(
            desktopLyricsSettingsSchema.parse({ ...defaultDesktopLyricsSettings, [key]: value })[
                key
            ],
            value,
        );
}
const textAppearance = {
    ...appearance,
    fontColor: '#ff8800',
    fontOpacity: 75,
    outline: 20,
    translationFontColor: '#00aaff',
    translationFontOpacity: 40,
};
await handlers.get('desktop-lyrics-open')(
    { sender: main.webContents },
    { close: 'Close', unlock: 'Unlock' },
);
handlers.get('desktop-lyrics-settings-update')({ sender: main.webContents }, textAppearance);
assert.deepEqual(
    handlers.get('desktop-lyrics-settings')({ sender: main.webContents }),
    textAppearance,
);
wayland.close();
await handlers.get('desktop-lyrics-open')(
    { sender: main.webContents },
    { close: 'Close', unlock: 'Unlock' },
);
assert.deepEqual(
    handlers.get('desktop-lyrics-settings')({ sender: main.webContents }),
    textAppearance,
);
assert.equal(windows.at(-1).ignoresMouse, true);
wayland.close();
console.log(
    'Independent primary/translation colors and opacity: defaults, CSS injection rejection, limits and IPC persistence: PASS',
);
const { readdirSync } = await import('node:fs');
const textSettingsKeys = [
    'font',
    'fontSize',
    'translationFont',
    'translationFontSize',
    'fontColor',
    'translationFontColor',
    'fontOpacity',
    'translationFontOpacity',
    'outline',
    'layout',
    'shadow',
    'showTranslation',
    'singleLine',
    'rollingMode',
    'transparentBackground',
    'widthCharacters',
    'backgroundOpacity',
];
for (const file of readdirSync(new URL('../src/i18n/locales/', import.meta.url)).filter((file) =>
    file.endsWith('.json'),
)) {
    const locale = JSON.parse(
        readFileSync(new URL('../src/i18n/locales/' + file, import.meta.url), 'utf8'),
    );
    for (const key of textSettingsKeys)
        assert.ok(locale.desktopLyrics?.[key + 'Description'], file + ': ' + key + ' description');
    for (const key of [
        'fontColor',
        'translationFontColor',
        'fontOpacity',
        'translationFontOpacity',
    ])
        assert.ok(locale.desktopLyrics?.[key], file + ': ' + key);
}
console.log('All 39 locales include new labels and desktop settings descriptions: PASS');

for (const outline of [0, 1, 10, 20])
    assert.equal(
        desktopLyricsSettingsSchema.parse({ ...defaultDesktopLyricsSettings, outline }).outline,
        outline,
    );
for (const outline of [-1, 21, 0.5, '20', '1px', null, Infinity])
    assert.equal(
        desktopLyricsSettingsSchema.safeParse({ ...defaultDesktopLyricsSettings, outline }).success,
        false,
    );
for (const color of ['rgb(255, 255, 255)', 'rgb(0,128,255)'])
    assert.equal(
        desktopLyricsSettingsSchema.parse({ ...defaultDesktopLyricsSettings, fontColor: color })
            .fontColor,
        color,
    );
for (const color of ['rgb(256,0,0)', 'rgb(-1,0,0)', 'rgba(0,0,0,0.5)', 'rgb(0,0,0);opacity:0'])
    assert.equal(
        desktopLyricsSettingsSchema.safeParse({ ...defaultDesktopLyricsSettings, fontColor: color })
            .success,
        false,
    );
console.log(
    'Outline slider 0–20, legacy outline migration, RGB color-picker compatibility and CSS validation: PASS',
);

assert.equal(
    JSON.parse(readFileSync(new URL('../src/i18n/locales/zh-Hans.json', import.meta.url), 'utf8'))
        .desktopLyrics.locked,
    '当前桌面歌词已锁定。',
);

const preGradientSettings = { ...defaultDesktopLyricsSettings };
delete preGradientSettings.fontGradient;
delete preGradientSettings.fontGradientColor;
delete preGradientSettings.fontGradientTop;
delete preGradientSettings.outlineColor;
delete preGradientSettings.translationFontGradient;
delete preGradientSettings.translationFontGradientColor;
delete preGradientSettings.translationFontGradientTop;

assert.deepEqual(desktopLyricsSettingsSchema.parse(preGradientSettings), {
    ...defaultDesktopLyricsSettings,
    fontGradient: false,
    fontGradientColor: defaultDesktopLyricsSettings.fontColor,
    fontGradientTop: defaultDesktopLyricsSettings.fontColor,
    outlineColor: '#000000',
    translationFontGradient: false,
    translationFontGradientColor: defaultDesktopLyricsSettings.translationFontColor,
    translationFontGradientTop: defaultDesktopLyricsSettings.translationFontColor,
});
assert.equal(
    desktopLyricsSettingsSchema.parse({ ...preGradientSettings, fontColor: '#ff8800' })
        .fontGradientColor,
    '#ff8800',
);
for (const key of [
    'outlineColor',
    'fontGradientTop',
    'fontGradientColor',
    'translationFontGradientTop',
    'translationFontGradientColor',
]) {
    for (const value of ['#ff0000', 'rgb(0, 128, 255)'])
        assert.equal(
            desktopLyricsSettingsSchema.parse({ ...defaultDesktopLyricsSettings, [key]: value })[
                key
            ],
            value,
        );
    for (const value of [
        'red',
        'url(example)',
        'rgb(256,0,0)',
        'var(--evil)',
        'rgb(0,0,0);color:red',
    ])
        assert.equal(
            desktopLyricsSettingsSchema.safeParse({ ...defaultDesktopLyricsSettings, [key]: value })
                .success,
            false,
        );
}
for (const key of ['fontGradient', 'translationFontGradient'])
    assert.equal(
        desktopLyricsSettingsSchema.safeParse({ ...defaultDesktopLyricsSettings, [key]: 'true' })
            .success,
        false,
    );
// Migrate the old solid-as-top representation; new top colors stay independent.
const legacyGradient = desktopLyricsSettingsSchema.parse({
    ...preGradientSettings,
    fontColor: '#123456',
    fontGradient: true,
    fontGradientColor: '#654321',
    translationFontColor: '#abcdef',
    translationFontGradient: true,
    translationFontGradientColor: '#fedcba',
});
assert.equal(legacyGradient.fontGradientTop, '#123456');
assert.equal(legacyGradient.translationFontGradientTop, '#abcdef');
const gradientSettings = {
    ...textAppearance,
    fontGradient: true,
    fontGradientColor: '#ff0000',
    fontGradientTop: '#123456',
    outlineColor: '#112233',
    translationFontGradient: true,
    translationFontGradientColor: '#00ff00',
    translationFontGradientTop: '#abcdef',
};
for (const enabled of [false, true]) {
    const changed = desktopLyricsSettingsSchema.parse({
        ...gradientSettings,
        fontColor: '#111111',
        fontGradient: enabled,
        translationFontColor: '#222222',
        translationFontGradient: enabled,
    });
    assert.equal(changed.fontColor, '#111111');
    assert.equal(changed.translationFontColor, '#222222');
    assert.equal(changed.fontGradientTop, '#123456');
    assert.equal(changed.translationFontGradientTop, '#abcdef');
    assert.equal(changed.fontGradientColor, '#ff0000');
    assert.equal(changed.translationFontGradientColor, '#00ff00');
}

await handlers.get('desktop-lyrics-open')(
    { sender: main.webContents },
    { close: 'Close', unlock: 'Unlock' },
);
handlers.get('desktop-lyrics-settings-update')({ sender: main.webContents }, gradientSettings);
wayland.close();
await handlers.get('desktop-lyrics-open')(
    { sender: main.webContents },
    { close: 'Close', unlock: 'Unlock' },
);
assert.deepEqual(
    handlers.get('desktop-lyrics-settings')({ sender: main.webContents }),
    gradientSettings,
);
wayland.close();
for (const file of readdirSync(new URL('../src/i18n/locales/', import.meta.url)).filter((file) =>
    file.endsWith('.json'),
)) {
    const messages = JSON.parse(
        readFileSync(new URL('../src/i18n/locales/' + file, import.meta.url), 'utf8'),
    ).desktopLyrics;
    for (const key of [
        'outlineColor',
        'fontGradient',
        'translationFontGradient',
        'fontGradientTop',
        'fontGradientColor',
        'translationFontGradientTop',
        'translationFontGradientColor',
    ])
        assert.ok(messages[key] && messages[key + 'Description'], file + ': ' + key);
}
console.log(
    'Outline color and independent vertical gradients: legacy defaults, safe colors, persistence and all locales: PASS',
);

// Render LyricLine itself: all text rows expose a marker independent of wrapper depth.
const markedLineExports = {};
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
runInNewContext(
    transpileModule(
        readFileSync(
            new URL('../src/renderer/features/lyrics/lyric-line.tsx', import.meta.url),
            'utf8',
        ),
        {
            compilerOptions: {
                esModuleInterop: true,
                jsx: require('typescript').JsxEmit.ReactJSX,
                module: ModuleKind.CommonJS,
            },
        },
    ).outputText,
    {
        exports: markedLineExports,
        require(name) {
            if (name.endsWith('.css')) return {};
            if (name.endsWith('/sanitize')) return { sanitize: (value) => value };
            if (name.endsWith('/box/box'))
                return { Box: (props) => React.createElement('div', props) };
            if (name.endsWith('/stack/stack'))
                return { Stack: (props) => React.createElement('div', props) };
            return require(name);
        },
    },
);
const markedLineHtml = renderToStaticMarkup(
    React.createElement(markedLineExports.LyricLine, {
        alignment: 'left',
        fontSize: 32,
        romajiText: 'yume',
        text: 'First_BREAK_<ruby>夢<rt>ゆめ</rt></ruby>',
        translatedText: 'Dream',
    }),
);
assert.equal((markedLineHtml.match(/data-lyric-text="true"/g) ?? []).length, 4);
assert.match(markedLineHtml, /<ruby>夢<rt>ゆめ<\/rt><\/ruby>/);
console.log(
    'LyricLine markup: original, split, romaji and translated rows expose stable text markers; ruby unchanged: PASS',
);

// Execute the real marquee component with a minimal DOM/React adapter.
const marqueeExports = {};
let cleanupMarquee,
    observerDisconnected = false,
    resizeMarquee;
const animationRecords = [];
const spans = [80, 500].map((scrollWidth) => ({
    animate(frames, options) {
        const animation = {
            cancel() {
                this.cancelled = true;
            },
            cancelled: false,
            frames,
            options,
            pause() {
                this.paused = true;
            },
            play() {
                this.paused = false;
            },
        };
        animationRecords.push(animation);
        return animation;
    },
    dataset: {},
    scrollWidth,
}));
const viewport = {
    clientWidth: 200,
    // Wrappers may change; only the marked text spans belong to the marquee.
    querySelectorAll: (selector) => (selector === '[data-lyric-text]' ? spans : []),
};
runInNewContext(
    transpileModule(
        readFileSync(
            new URL('../src/renderer/features/lyrics/desktop-lyrics-line.tsx', import.meta.url),
            'utf8',
        ),
        {
            compilerOptions: {
                jsx: require('typescript').JsxEmit.ReactJSX,
                module: ModuleKind.CommonJS,
            },
        },
    ).outputText,
    {
        exports: marqueeExports,
        require(name) {
            if (name === 'react')
                return {
                    useLayoutEffect: (effect) => {
                        cleanupMarquee = effect();
                    },
                    useRef: () => ({ current: viewport }),
                };
            if (name === 'react/jsx-runtime')
                return {
                    jsx: (type, props) => ({ props, type }),
                    jsxs: (type, props) => ({ props, type }),
                };
            if (name.endsWith('.css'))
                return { default: { lineLayers: 'line-layers', viewport: 'viewport' } };
            if (name.endsWith('/lyric-line')) return { LyricLine: () => null };
            throw new Error(name);
        },
        ResizeObserver: class {
            constructor(callback) {
                resizeMarquee = callback;
            }
            disconnect() {
                observerDisconnected = true;
            }
            observe() {
                /* Resize delivery is triggered explicitly below. */
            }
        },
    },
);
const layeredLine = marqueeExports.DesktopLyricsLine({
    alignment: 'center',
    fontSize: 26,
    text: 'Long lyrics',
});
const layers = layeredLine.props.children.props.children;
assert.equal(layers[0].props['aria-hidden'], 'true');
assert.equal(layers[0].props['data-outline'], 'true');
assert.equal(layers[1].props['data-outline'], 'false');
assert.equal(layers[0].props.text, layers[1].props.text);
console.log(
    'Outer outline: identical sanitized lyrics in lower stroke and upper fill layers, decorative layer hidden from accessibility: PASS',
);
assert.equal(spans[0].dataset.overflow, 'false');
assert.equal(spans[1].dataset.overflow, 'true');
assert.equal(animationRecords.length, 1);
assert.equal(animationRecords[0].frames.at(-1).transform, 'translateX(-300px)');
assert.equal(animationRecords[0].options.duration, 4000);
assert.equal(animationRecords[0].frames[1].offset * 4000, 500);
assert.equal(animationRecords[0].options.fill, 'forwards');
assert.equal(animationRecords[0].currentTime, 0);
viewport.clientWidth = 600;
resizeMarquee();
assert.ok(animationRecords[0].cancelled);
assert.equal(spans[1].dataset.overflow, 'false');
viewport.clientWidth = 100;
resizeMarquee();
assert.equal(animationRecords.length, 2);
assert.equal(animationRecords[1].frames.at(-1).transform, 'translateX(-400px)');
cleanupMarquee();
assert.ok(observerDisconnected);
assert.ok(animationRecords[1].cancelled);
console.log(
    'Actual marquee component: short lines stationary, overflow endpoints, resize/font remeasurement and cleanup: PASS',
);

// Exercise actual color controls, including dismissal while an IPC save is pending.
const pickerExports = {};
let finishColorSave,
    finishResetSettings,
    pickerHookIndex = 0,
    pickerHooks = [];
runInNewContext(
    transpileModule(
        readFileSync(
            new URL('../src/renderer/features/lyrics/desktop-lyrics-settings.tsx', import.meta.url),
            'utf8',
        ),
        {
            compilerOptions: {
                jsx: require('typescript').JsxEmit.ReactJSX,
                module: ModuleKind.CommonJS,
            },
        },
    ).outputText,
    {
        exports: pickerExports,
        require(name) {
            if (name === 'react')
                return {
                    useEffect() {
                        /* This harness exercises event handlers, not mount effects. */
                    },
                    useState(initial) {
                        const index = pickerHookIndex++;
                        if (!(index in pickerHooks))
                            pickerHooks[index] = index === 1 ? true : initial;
                        return [
                            pickerHooks[index],
                            (value) => {
                                pickerHooks[index] =
                                    typeof value === 'function' ? value(pickerHooks[index]) : value;
                            },
                        ];
                    },
                };
            if (name === 'react/jsx-runtime')
                return {
                    jsx: (type, props) => ({ props, type }),
                    jsxs: (type, props) => ({ props, type }),
                };
            if (name === 'react-i18next') return { useTranslation: () => ({ t: (key) => key }) };
            if (name.endsWith('/utils/desktop-lyrics'))
                return {
                    defaultDesktopLyricsSettings,
                    desktopLyricsSettingsSchema,
                    getEffectiveDesktopLyricsSettings,
                    setDesktopLyricsIndependent,
                };
            return new Proxy({}, { get: (_, key) => key });
        },
        window: {
            api: {
                desktopLyrics: {
                    resetSettings: () =>
                        new Promise((resolve) => {
                            finishResetSettings = resolve;
                        }),
                    setSettings: (value) =>
                        new Promise((resolve) => {
                            finishColorSave = () => resolve(value);
                        }),
                },
            },
        },
    },
);
const colorOptions = () => {
    pickerHookIndex = 0;
    return pickerExports.DesktopLyricsSettingsSection({}).props.options;
};
for (const gradient of [false, true]) {
    pickerHooks = [
        {
            ...defaultDesktopLyricsSettings,
            fontGradient: gradient,
            translationFontGradient: gradient,
            translationIndependent: true,
        },
    ];
    const keys = gradient
        ? [
              'fontGradientTop',
              'fontGradientColor',
              'translationFontGradientTop',
              'translationFontGradientColor',
              'outlineColor',
              'translationOutlineColor',
          ]
        : ['fontColor', 'translationFontColor', 'outlineColor', 'translationOutlineColor'];
    for (const key of keys) {
        const control = () =>
            colorOptions().find((option) => option.title === `desktopLyrics.${key}`).control.props;
        assert.match(control().value, /^rgb\(/);
        control().onClick();
        assert.equal(control().popoverProps.opened, true);
        control().onChange('rgb(53, 116, 252)');
        control().onChangeEnd('rgb(53, 116, 252)');
        assert.equal(control().disabled, true); // Saving retains existing serialization guard.
        control().popoverProps.onDismiss();
        assert.equal(control().popoverProps.opened, false);
        finishColorSave();
        await new Promise((resolve) => setImmediate(resolve));
        assert.equal(control().popoverProps.opened, false);
        assert.equal(control().value, 'rgb(53, 116, 252)');
        control().onFocus();
        control().onBlur();
        assert.equal(control().popoverProps.opened, false);
    }
}
console.log(
    'Actual desktop color pickers: RGB display, dismiss during save, reopen/blur and both gradient modes: PASS',
);

// The lyrics modal uses marked sliders, while main settings retain numeric size inputs.
pickerHooks = [{ ...defaultDesktopLyricsSettings, translationIndependent: true }];
const compactOptions = () => {
    pickerHookIndex = 0;
    return pickerExports.DesktopLyricsSettingsSection({ compact: true }).props.children.props
        .options;
};
const compactControl = (key) =>
    compactOptions().find((option) => option.id === `desktopLyrics.${key}`).component;
for (const key of [
    'fontSize',
    'translationFontSize',
    'outline',
    'translationOutline',
    'fontOpacity',
    'translationFontOpacity',
    'widthCharacters',
    'backgroundOpacity',
]) {
    const slider = compactControl(key);
    assert.equal(slider.type, 'Slider');
    assert.equal(slider.props.w, '75%');
    assert.equal(slider.props.marks[0].value, slider.props.min);
    assert.equal(slider.props.marks.at(-1).value, slider.props.max);
    assert.ok(slider.props.marks.every((mark) => mark.label));
}
for (const key of ['fontSize', 'translationFontSize']) {
    compactControl(key).props.onChange(64);
    compactControl(key).props.onChangeEnd(64);
    finishColorSave();
    await new Promise((resolve) => setImmediate(resolve));
    const mainControl = colorOptions().find(
        (option) => option.title === `desktopLyrics.${key}`,
    ).control;
    assert.equal(mainControl.type, 'NumberInput');
    assert.equal(mainControl.props.value, 64);
    assert.equal(compactControl(key).props.value, 64);
}
for (const option of colorOptions().filter((option) => option.control.type === 'Slider')) {
    assert.equal(option.control.props.w, 100);
    assert.equal(option.control.props.marks, undefined);
}
console.log(
    'Lyrics modal: eight marked sliders and shared font-size data; main-settings controls unchanged: PASS',
);

assert.equal(defaultDesktopLyricsSettings.translationIndependent, false);
for (let fontSize = 20; fontSize <= 128; fontSize++) {
    const saved = {
        ...customFontSettings,
        fontColor: '#abcdef',
        fontGradient: true,
        fontOpacity: 61,
        fontSize,
        outline: 7,
        outlineColor: '#123456',
        translationIndependent: false,
    };
    const effective = getEffectiveDesktopLyricsSettings(saved);
    assert.equal(effective.translationFontSize, Math.floor(fontSize * 0.8));
    assert.deepEqual(effective.translationFont, saved.font);
    assert.equal(effective.translationFontColor, saved.fontColor);
    assert.equal(effective.translationFontOpacity, saved.fontOpacity);
    assert.equal(effective.translationFontGradient, saved.fontGradient);
    assert.equal(effective.translationOutline, 7);
    assert.equal(effective.translationOutlineColor, '#123456');
    assert.equal(saved.translationFontSize, 128); // Independent preferences are retained.
    const size = getDesktopLyricsWindowSize(grouped, saved, area);
    const [primary, , translation] = getDesktopLyricsFontSizes(
        second,
        second,
        fontSize,
        size.height - 58,
        effective.translationFontSize,
    );
    assert.equal(primary, fontSize);
    assert.equal(translation, Math.floor(fontSize * 0.8));
}
const independent = {
    ...customFontSettings,
    translationOutline: 12,
    translationOutlineColor: '#aabbcc',
};
for (const key of Object.keys(independent).filter((key) => key.startsWith('translation'))) {
    assert.deepEqual(getEffectiveDesktopLyricsSettings(independent)[key], independent[key]);
}
for (const patch of [
    { translationIndependent: 'false' },
    { translationOutline: -1 },
    { translationOutline: 21 },
    { translationOutline: 1.5 },
    { translationOutlineColor: 'var(--unsafe)' },
]) {
    assert.equal(
        desktopLyricsSettingsSchema.safeParse({ ...independent, ...patch }).success,
        false,
    );
}
const oldOutlineSettings = { ...independent };
delete oldOutlineSettings.translationIndependent;
delete oldOutlineSettings.translationOutline;
delete oldOutlineSettings.translationOutlineColor;

const migratedOutline = desktopLyricsSettingsSchema.parse(oldOutlineSettings);
assert.equal(migratedOutline.translationIndependent, false);
assert.equal(migratedOutline.translationOutline, migratedOutline.outline);
assert.equal(migratedOutline.translationOutlineColor, migratedOutline.outlineColor);
handlers.get('desktop-lyrics-settings-update')(
    { sender: main.webContents },
    { ...independent, translationIndependent: false },
);
assert.equal(wayland.getFontPath('/translation'), independent.font.custom);
handlers.get('desktop-lyrics-settings-update')({ sender: main.webContents }, independent);
assert.equal(wayland.getFontPath('/translation'), independent.translationFont.custom);
assert.deepEqual(
    handlers.get('desktop-lyrics-settings')({ sender: main.webContents }),
    independent,
);
for (const linked of [false, true]) {
    pickerHooks = [
        {
            ...independent,
            fontGradient: false,
            translationFontGradient: false,
            translationIndependent: !linked,
        },
    ];
    const mainOptions = colorOptions();
    const modalOptions = compactOptions();
    assert.deepEqual(
        mainOptions.map((option) => option.title),
        modalOptions.map((option) => option.id),
    );
    const keys = mainOptions.map((option) => option.title);
    const toggleIndex = keys.indexOf('desktopLyrics.translationIndependent');
    assert.ok(keys.indexOf('desktopLyrics.outlineColor') < toggleIndex);
    if (linked) {
        assert.ok(
            !keys.some(
                (key) =>
                    key.startsWith('desktopLyrics.translation') &&
                    key !== 'desktopLyrics.translationIndependent' &&
                    key !== 'desktopLyrics.translationBelow',
            ),
        );
        continue;
    }

    for (const key of [
        'translationFont',
        'translationFontSize',
        'translationFontGradient',
        'translationFontColor',
        'translationFontOpacity',
        'translationOutline',
        'translationOutlineColor',
    ]) {
        assert.ok(keys.indexOf('desktopLyrics.' + key) > toggleIndex);
        assert.equal(
            mainOptions.find((option) => option.title === 'desktopLyrics.' + key).control.props
                .disabled,
            linked,
            key,
        );
        assert.equal(
            modalOptions.find((option) => option.id === 'desktopLyrics.' + key).component.props
                .disabled,
            linked,
            key,
        );
    }
    assert.equal(
        mainOptions.find((option) => option.title === 'desktopLyrics.translationFontSize').control
            .props.value,
        linked ? Math.floor(independent.fontSize * 0.8) : independent.translationFontSize,
    );
    assert.ok(
        keys.indexOf('desktopLyrics.translationOutlineColor') >
            keys.indexOf('desktopLyrics.layout'),
    );
}
for (const file of readdirSync(new URL('../src/i18n/locales/', import.meta.url)).filter((file) =>
    file.endsWith('.json'),
)) {
    const messages = JSON.parse(
        readFileSync(new URL('../src/i18n/locales/' + file, import.meta.url), 'utf8'),
    ).desktopLyrics;
    for (const key of ['translationIndependent', 'translationOutline', 'translationOutlineColor'])
        assert.ok(messages[key] && messages[key + 'Description'], file + ': ' + key);
}
console.log(
    'Linked translation: floored 80% size, inherited styles/fonts, independent outlines, saved preferences and identical ordering in both settings surfaces: PASS',
);

const timed = {
    ...snapshot,
    lines: [
        { startMs: 1000, text: 'Translation' },
        { startMs: 1000, text: 'Primary' },
        { startMs: 2500, text: 'Same' },
        { startMs: 2500, text: 'Same' },
        { startMs: 11000, text: 'Same' },
    ],
};
assert.equal(getDesktopLyricsTiming(timed), null);
assert.deepEqual(getDesktopLyricsTiming({ ...timed, timestamp: 1 }), {
    durationMs: 1500,
    startMs: 1000,
});
assert.deepEqual(getDesktopLyricsTiming({ ...timed, timestamp: 2.5 }), {
    durationMs: 8500,
    startMs: 2500,
});
assert.deepEqual(getDesktopLyricsTiming({ ...timed, timestamp: 11 }), {
    durationMs: 4000,
    startMs: 11000,
});
assert.deepEqual(getDesktopLyricsTiming({ ...timed, offsetMs: 1000, timestamp: 1.5 }), {
    durationMs: 8500,
    startMs: 2500,
});
assert.deepEqual(getDesktopLyricsTiming({ ...timed, offsetMs: -8500, timestamp: 11 }), {
    durationMs: 8500,
    startMs: 2500,
});
assert.equal(getDesktopLyricsTiming({ ...timed, lines: [] }), null);
const beforePreview = animationRecords.length;
marqueeExports.DesktopLyricsLine({
    alignment: 'right',
    fontSize: 26,
    scrollDurationMs: 0,
    text: 'Very long preview',
});
assert.equal(animationRecords.length, beforePreview); // Next group never animates, regardless of width.
for (const gap of [1500, 8500]) {
    marqueeExports.DesktopLyricsLine({
        alignment: 'center',
        fontSize: 26,
        scrollDurationMs: gap,
        text: 'Long current group',
    });
    const animation = animationRecords.at(-1);
    assert.equal(animation.options.duration, gap);
    assert.equal(animation.frames[1].offset * animation.options.duration, 500);
    assert.ok(Math.abs((1 - animation.frames[2].offset) * animation.options.duration - 500) < 1e-8);
    assert.ok(
        Math.abs(
            (animation.frames[2].offset - animation.frames[1].offset) * animation.options.duration -
                (gap - 1000),
        ) < 1e-8,
    );
    cleanupMarquee();
}
assert.deepEqual(getDesktopLyricsTiming({ ...timed, durationMs: 15000, timestamp: 11 }), {
    durationMs: 4000,
    startMs: 11000,
});
assert.deepEqual(
    getDesktopLyricsTiming({ ...timed, durationMs: 15000, offsetMs: 1000, timestamp: 10 }),
    { durationMs: 5000, startMs: 11000 },
);
for (const gap of [300, 1000]) {
    const count = animationRecords.length;
    marqueeExports.DesktopLyricsLine({
        alignment: 'center',
        fontSize: 26,
        scrollDurationMs: gap,
        text: 'Short interval',
    });
    assert.equal(animationRecords.length, count);
}
marqueeExports.DesktopLyricsLine({
    alignment: 'center',
    elapsedMs: 900,
    fontSize: 26,
    playing: false,
    scrollDurationMs: 60000,
    text: 'Long interval',
});
const slowAnimation = animationRecords.at(-1);
assert.equal(slowAnimation.paused, true);
assert.equal(slowAnimation.currentTime, 900);
assert.equal((slowAnimation.frames[2].offset - slowAnimation.frames[1].offset) * 60000, 20000); // 400px at 20px/s.
cleanupMarquee();
console.log(
    'Marquee timing: next distinct timestamp/song end, offsets, 500ms pauses, minimum speed, seek/pause and stationary previews/short intervals: PASS',
);

const offsetQuery = {
    local: [{ offsetMs: 10 }, { offsetMs: 20 }],
    selectedOffsetMs: null,
    selectedStructuredIndex: 1,
};
const adjusted = updateLyricsOffset(offsetQuery, 1, -250);
assert.equal(adjusted.selectedOffsetMs, -250);
assert.equal(adjusted.local[0].offsetMs, 10);
assert.equal(adjusted.local[1].offsetMs, -250);
assert.equal(offsetQuery.local[1].offsetMs, 20);
assert.equal(updateLyricsOffset(offsetQuery, 99, 123).local[1].offsetMs, 123);
assert.equal(updateLyricsOffset({ ...offsetQuery, local: null }, 0, 123).selectedOffsetMs, 123);
assert.equal(updateLyricsOffset(undefined, 0, 123), undefined);
await handlers.get('desktop-lyrics-open')(
    { sender: main.webContents },
    { close: 'Close', unlock: 'Unlock' },
);
wayland.setLocked(false);
const offsetWindow = windows.at(-1);
handlers.get('desktop-lyrics-publish')({ sender: main.webContents }, snapshot);
const requestOffset = (input) =>
    handlers.get('desktop-lyrics-offset')({ sender: offsetWindow.webContents }, input);
const sentBefore = main.webContents.sent.length;
requestOffset({ offsetMs: 123, trackKey: 'old' });
assert.equal(main.webContents.sent.length, sentBefore);
requestOffset({ offsetMs: -250, trackKey: 'current' });
assert.equal(main.webContents.sent.at(-1)[0], 'desktop-lyrics-offset-request');
assert.equal(main.webContents.sent.at(-1)[1].offsetMs, -250);
for (const offsetMs of [NaN, Infinity, '250', 0.5])
    assert.throws(() => requestOffset({ offsetMs, trackKey: 'current' }));
assert.throws(
    () =>
        handlers.get('desktop-lyrics-offset')(
            { sender: main.webContents },
            { offsetMs: 123, trackKey: 'current' },
        ),
    /unlocked/,
);
wayland.setLocked(true);
assert.throws(() => requestOffset({ offsetMs: 123, trackKey: 'current' }), /unlocked/);
assert.equal(offsetWindow.ignoresMouse, true);
wayland.setLocked(false);
wayland.close();
console.log(
    'Original + desktop offset share the same immutable query updater; IPC validates sender/values/current track and rejects locked-window requests: PASS',
);

// Run the real main-renderer hook's offset listener without mounting a second player.
const offsetEffects = [],
    offsetHookExports = {};
let offsetCache = offsetQuery,
    offsetUnsubscribed = false,
    offsetWrites = 0,
    receiveOffset;
const currentOffsetSong = { ...song, name: 'Song' };
runInNewContext(
    transpileModule(
        readFileSync(
            new URL('../src/renderer/features/lyrics/use-desktop-lyrics.ts', import.meta.url),
            'utf8',
        ),
        {
            compilerOptions: { esModuleInterop: true, module: ModuleKind.CommonJS },
        },
    ).outputText,
    {
        exports: offsetHookExports,
        require(name) {
            if (name === 'is-electron') return () => true;
            if (name === 'react')
                return {
                    useEffect: (effect) => offsetEffects.push(effect),
                    useMemo: (factory) => factory(),
                };
            if (name.endsWith('/use-local-storage')) return { useLocalStorage: () => [[]] };
            if (name.endsWith('/hooks/use-furigana-lyrics'))
                return {
                    useFuriganaLyrics: () => ({ data: null }),
                    useRomajiLyrics: () => ({ data: null }),
                };
            if (name.endsWith('/api/lyric-translate'))
                return { lyricsTranslationQuery: () => ({}) };
            if (name === '@tanstack/react-query') return { useQuery: () => ({ data: null }) };
            if (name.endsWith('/i18n')) return { language: 'en' };
            if (name.endsWith('/api/query-keys'))
                return {
                    queryKeys: { songs: { lyrics: (server, query) => [server, query.songId] } },
                };
            if (name.endsWith('/lib/react-query'))
                return {
                    queryClient: {
                        setQueryData(key, updater) {
                            assert.deepEqual(Array.from(key), ['server', 'song']);
                            offsetCache = updater(offsetCache);
                            offsetWrites++;
                        },
                    },
                };
            if (name.endsWith('/api/lyrics-api'))
                return { lyricsQueries: { songLyrics: () => ({}) } };
            if (name.endsWith('/utils/update-lyrics-offset')) return { updateLyricsOffset };
            if (name.endsWith('/utils/desktop-lyrics')) return { getDesktopLyricsTrackKey };
            if (name.endsWith('/desktop-lyrics.store'))
                return { useDesktopLyricsState: (fn) => fn({ open: false }) };
            if (name.endsWith('/use-radio-player')) return { useIsRadioActive: () => false };
            if (name.endsWith('/store'))
                return {
                    useLanguage: () => 'en',
                    useLyricsSettings: () => ({ delayMs: 0 }),
                    usePlayerSong: () => currentOffsetSong,
                    usePlayerStatus: () => 'PLAYING',
                    usePlayerStoreBase: {
                        getState: () => ({ getCurrentSong: () => currentOffsetSong }),
                    },
                };
            return new Proxy({}, { get: () => ({}) });
        },
        window: {
            api: {
                desktopLyrics: {
                    onOffset(callback) {
                        receiveOffset = callback;
                        return () => {
                            offsetUnsubscribed = true;
                        };
                    },
                },
            },
        },
    },
);
offsetHookExports.useDesktopLyrics();
const stopOffsetListener = offsetEffects[0]();
receiveOffset({ offsetMs: 500, trackKey: 'previous song' });
assert.equal(offsetWrites, 0);
receiveOffset({ offsetMs: 500, trackKey: getDesktopLyricsTrackKey(currentOffsetSong) });
assert.equal(offsetCache.selectedOffsetMs, 500);
assert.equal(offsetCache.local[1].offsetMs, 500);
stopOffsetListener();
assert.equal(offsetUnsubscribed, true);
console.log(
    'Actual main-renderer offset listener: existing query updated, late old-track requests ignored, listener cleanup: PASS',
);

// Offset dropdown must receive outside clicks even over otherwise draggable lyrics.
const offsetWindowSource = readFileSync(
    new URL('../src/renderer/features/lyrics/desktop-lyrics-window.tsx', import.meta.url),
    'utf8',
);
const offsetCssSource = readFileSync(
    new URL('../src/renderer/features/lyrics/desktop-lyrics-window.module.css', import.meta.url),
    'utf8',
);
assert.ok(offsetWindowSource.includes('data-offset-open={offsetOpen}'));
assert.ok(offsetWindowSource.includes("window.addEventListener('blur', dismissOffset)"));
assert.match(
    offsetCssSource,
    /\.window\[data-offset-open='true'\]\s*\{\s*-webkit-app-region: no-drag;/,
);
console.log(
    'Offset dismissal: open dropdown disables native drag interception and closes on window blur: PASS',
);

// Slash-delimited bilingual rows share the same grouping and sizing rules.
const slashSong = {
    ...snapshot,
    lines: [
        { startMs: 1000, text: '  译文 / Original  ' },
        { startMs: 2000, text: 'Next translation / Next primary' },
    ],
    timestamp: 1,
    title: 'Artist / Song',
};
assert.equal(defaultDesktopLyricsSettings.splitSlashLyrics, true);
assert.deepEqual(getDesktopLyricsPair(slashSong), [
    ['Original', '译文'],
    ['Next primary', 'Next translation'],
]);
assert.deepEqual(
    getDesktopLyricsPair(slashSong, { ...defaultDesktopLyricsSettings, splitSlashLyrics: false }),
    [['  译文 / Original  '], ['Next translation / Next primary']],
);
assert.deepEqual(
    getDesktopLyricsPair(slashSong, {
        ...defaultDesktopLyricsSettings,
        displayMode: 'original',
        showTranslation: false,
    }),
    [['Original'], ['Next primary']],
);
assert.deepEqual(
    getDesktopLyricsPair(slashSong, { ...defaultDesktopLyricsSettings, singleLine: true }),
    [['Original', '译文'], []],
);
assert.deepEqual(getDesktopLyricsPair({ ...slashSong, offsetMs: 1000 }), [
    ['Next primary', 'Next translation'],
    [],
]);
assert.deepEqual(getDesktopLyricsPair({ ...slashSong, timestamp: 0 })[0], ['Artist / Song']);
assert.deepEqual(getDesktopLyricsPair({ ...slashSong, lines: [] }), [['Artist / Song'], []]);
for (const text of [
    'No delimiter',
    '/ Original',
    'Original /',
    ' / ',
    '<b>Original</b>',
    '<span title="a/b">Original</span>',
]) {
    assert.deepEqual(getDesktopLyricsPair({ ...slashSong, lines: [{ startMs: 1000, text }] })[0], [
        text,
    ]);
}
assert.deepEqual(
    getDesktopLyricsPair({
        ...slashSong,
        lines: [{ startMs: 1000, text: 'Ignored / Translation / Primary' }],
    })[0],
    ['Primary', 'Translation'],
);
assert.deepEqual(
    getDesktopLyricsPair({
        ...slashSong,
        lines: [
            { startMs: 1000, text: 'Primary' },
            { startMs: 1000, text: 'Translation / original punctuation' },
        ],
    })[0],
    ['Primary', 'Translation / original punctuation'],
);
const slashSettings = { ...defaultDesktopLyricsSettings, fontSize: 64 };
assert.ok(
    getDesktopLyricsWindowSize(slashSong, slashSettings, area).height >
        getDesktopLyricsWindowSize(slashSong, { ...slashSettings, splitSlashLyrics: false }, area)
            .height,
);
const preSlashSettings = { ...defaultDesktopLyricsSettings };
delete preSlashSettings.splitSlashLyrics;

assert.equal(desktopLyricsSettingsSchema.parse(preSlashSettings).splitSlashLyrics, true);
assert.equal(
    desktopLyricsSettingsSchema.safeParse({
        ...defaultDesktopLyricsSettings,
        splitSlashLyrics: 'true',
    }).success,
    false,
);
handlers.get('desktop-lyrics-settings-update')(
    { sender: main.webContents },
    { ...defaultDesktopLyricsSettings, splitSlashLyrics: false },
);
assert.equal(
    handlers.get('desktop-lyrics-settings')({ sender: main.webContents }).splitSlashLyrics,
    false,
);
for (const compact of [false, true]) {
    pickerHooks = [{ ...defaultDesktopLyricsSettings }];
    pickerHookIndex = 0;
    const section = pickerExports.DesktopLyricsSettingsSection({ compact });
    const options = compact ? section.props.children.props.options : section.props.options;
    const option = options.find(
        (option) => (compact ? option.id : option.title) === 'desktopLyrics.splitSlashLyrics',
    );
    assert.ok(option);
    assert.equal((compact ? option.component : option.control).props.checked, true);
}
for (const file of readdirSync(new URL('../src/i18n/locales', import.meta.url))) {
    if (!file.endsWith('.json')) continue;
    const messages = JSON.parse(
        readFileSync(new URL('../src/i18n/locales/' + file, import.meta.url), 'utf8'),
    ).desktopLyrics;
    assert.ok(messages.splitSlashLyrics && messages.splitSlashLyricsDescription, file);
}
console.log(
    'Slash bilingual recognition: default/toggle, primary/translation, next group, offsets, blanks, sizing, persistence, both settings surfaces and all locales: PASS',
);

const desktopLocaleDirectory = new URL('../src/i18n/locales/', import.meta.url);
const desktopEnglishMessages = JSON.parse(
    readFileSync(new URL('en.json', desktopLocaleDirectory), 'utf8'),
).desktopLyrics;
for (const file of readdirSync(desktopLocaleDirectory).filter((file) => file.endsWith('.json'))) {
    const messages = JSON.parse(
        readFileSync(new URL(file, desktopLocaleDirectory), 'utf8'),
    ).desktopLyrics;
    assert.deepEqual(
        Object.keys(messages).sort(),
        Object.keys(desktopEnglishMessages).sort(),
        `${file}: desktop lyrics translation keys`,
    );
    for (const [key, english] of Object.entries(desktopEnglishMessages)) {
        assert.equal(typeof messages[key], 'string', `${file}: ${key}`);
        assert.ok(messages[key].trim(), `${file}: ${key} must not be empty`);
        assert.deepEqual(
            messages[key].match(/\{\{[^}]+\}\}/g) ?? [],
            english.match(/\{\{[^}]+\}\}/g) ?? [],
            `${file}: ${key} interpolation parameters`,
        );
    }
    if (!['en.json', 'zh-Hans.json', 'zh-Hant.json'].includes(file)) {
        for (const key of [
            'outline',
            'outlineColor',
            'translationIndependentDescription',
            'translationOutline',
            'translationOutlineColor',
        ]) {
            assert.doesNotMatch(
                messages[key],
                /Lyrics font|Lyrics size|Translation font|Translation size|Primary outline|Text outline/,
                `${file}: ${key} must not contain untranslated label fragments`,
            );
        }
    }
}
console.log(
    'All 39 desktop lyrics locales: complete keys, nonempty text, interpolation and localized outline/link labels: PASS',
);

// Run the real window lifecycle with a deterministic clock and a failing storage adapter.
const positionExports = {};
const positionApp = new EventEmitter();
const positionPreferences = new Map();
const positionWrites = [];
const positionWarnings = [];
const positionTimers = new Map();
const positionFailure = new Error('Position storage failure');
let positionClock = 0;
let positionTimerId = 0;
let rejectPositionWrites = false;
let rejectBoundsRead = false;
class PositionTestWindow extends TestWindow {
    getBounds() {
        assert.equal(this.isDestroyed(), false, 'Never read bounds from a destroyed window');
        if (rejectBoundsRead) throw new Error('Native bounds read failure');
        return super.getBounds();
    }
}
const advancePositionClock = (milliseconds) => {
    positionClock += milliseconds;
    for (const [id, timer] of positionTimers) {
        if (timer.at <= positionClock) {
            positionTimers.delete(id);
            timer.callback();
        }
    }
};
runInNewContext(compiledFeature, {
    ...context,
    clearTimeout: (id) => positionTimers.delete(id),
    exports: positionExports,
    require(name) {
        if (name === 'electron')
            return {
                ...context.require(name),
                app: positionApp,
                BrowserWindow: PositionTestWindow,
            };
        if (name === '../settings')
            return {
                store: {
                    get: (key) => positionPreferences.get(key),
                    set(key, value) {
                        if (key === 'desktop_lyrics_bounds') {
                            if (rejectPositionWrites) throw positionFailure;
                            positionWrites.push(value);
                        }
                        positionPreferences.set(key, value);
                    },
                },
            };
        if (name === '/@/main/logger')
            return {
                ...context.require(name),
                warn: (...args) => positionWarnings.push(args),
            };
        return context.require(name);
    },
    setTimeout(callback, delay) {
        const id = ++positionTimerId;
        positionTimers.set(id, { at: positionClock + delay, callback });
        return id;
    },
});
const positionFeature = positionExports.initDesktopLyrics(
    () => main,
    () => {},
);
await open();
let positionWindow = windows.at(-1);
positionWindow.options.x = 100;
positionWindow.emit('move');
advancePositionClock(200);
positionWindow.options.x = 200;
positionWindow.emit('move');
assert.equal(positionWrites.length, 0, 'Moves must not write before the quiet interval');
assert.equal(positionTimers.size, 1);
advancePositionClock(299);
assert.equal(positionWrites.length, 0, 'Repeated moves must reset the quiet interval');
advancePositionClock(1);
assert.equal(positionWrites.length, 1);
assert.equal(positionWrites.at(-1).x, 200);
assert.equal(positionTimers.size, 0);
positionWindow.options.x = 250;
positionWindow.emit('move');
positionWindow.options.x = 275; // Closing reads the final live bounds, not an older move snapshot.
positionFeature.close();
assert.equal(positionWrites.at(-1).x, 275);
assert.equal(positionTimers.size, 0);
const afterPositionClose = positionWrites.length;
advancePositionClock(1000);
positionFeature.dispose();
assert.equal(positionWrites.length, afterPositionClose);

await open();
positionWindow = windows.at(-1);
const unmovedBounds = positionWindow.getBounds();
const beforeUnmovedDestroy = positionWrites.length;
positionWindow.destroy();
assert.equal(positionWrites.length, beforeUnmovedDestroy + 1);
assert.deepEqual(positionWrites.at(-1), unmovedBounds);
assert.equal(positionTimers.size, 0);

for (const finish of ['close', 'dispose', 'native-close', 'destroy', 'renderer-exit', 'quit']) {
    await open();
    positionWindow = windows.at(-1);
    const count = positionWrites.length;
    const x = 400 + count;
    positionWindow.options.x = x;
    positionWindow.emit('move');
    assert.equal(positionWrites.length, count);
    if (finish === 'close') positionFeature.close();
    if (finish === 'dispose') positionFeature.dispose();
    if (finish === 'native-close') {
        positionWindow.emit('close');
        positionWindow.destroy();
    }
    if (finish === 'destroy') positionWindow.destroy();
    if (finish === 'renderer-exit')
        positionWindow.webContents.emit('render-process-gone', {}, { reason: 'crashed' });
    if (finish === 'quit') positionApp.emit('before-quit');
    assert.equal(positionWrites.length, count + 1, `${finish}: exactly one final save`);
    assert.equal(positionWrites.at(-1).x, x, finish);
    assert.equal(positionTimers.size, 0, `${finish}: pending timer cleared`);
    assert.equal(positionFeature.getState().open, false);
    advancePositionClock(1000);
    assert.equal(positionWrites.length, count + 1, `${finish}: no write after destruction`);
    await open();
    assert.equal(windows.at(-1).options.x, x, `${finish}: position restored on reopening`);
    positionFeature.close();
}

await open();
positionWindow = windows.at(-1);
rejectPositionWrites = true;
positionWindow.emit('move');
assert.doesNotThrow(() => advancePositionClock(300));
assert.equal(positionWarnings.at(-1)[0], 'Failed to save desktop lyrics position');
assert.equal(positionWarnings.at(-1)[1], positionFailure);
assert.equal(positionTimers.size, 0);
rejectPositionWrites = false;
positionWindow.options.x = 500;
positionWindow.emit('move');
advancePositionClock(300);
assert.equal(positionWrites.at(-1).x, 500, 'A later move can save after a storage failure');
rejectBoundsRead = true;
assert.throws(() => positionWindow.emit('move'), /Native bounds read failure/);
rejectBoundsRead = false;
positionFeature.close();
await open();
positionWindow = windows.at(-1);
rejectBoundsRead = true;
assert.doesNotThrow(() => positionFeature.dispose());
assert.match(positionWarnings.at(-1)[1].message, /Native bounds read failure/);
assert.equal(positionWindow.isDestroyed(), true);
rejectBoundsRead = false;
for (const finish of ['close', 'dispose', 'native-close', 'destroy']) {
    await open();
    positionWindow = windows.at(-1);
    positionWindow.emit('move');
    const warnings = positionWarnings.length;
    rejectPositionWrites = true;
    assert.doesNotThrow(() => {
        if (finish === 'close') positionFeature.close();
        if (finish === 'dispose') positionFeature.dispose();
        if (finish === 'native-close') {
            positionWindow.emit('close');
            positionWindow.destroy();
        }
        if (finish === 'destroy') positionWindow.destroy();
    });
    assert.equal(positionWarnings.length, warnings + 1, `${finish}: log the storage failure`);
    assert.equal(positionWarnings.at(-1)[1], positionFailure);
    assert.equal(positionTimers.size, 0);
    assert.equal(positionWindow.isDestroyed(), true);
    rejectPositionWrites = false;
}
console.log(
    'Position persistence: 300ms debounce, latest bounds, all teardown paths, timer cleanup, restore and local storage failure recovery: PASS',
);

// Windows keeps its z-order without depending on focus events from a click-through window.
const winTopExports = {};
const winTopTimers = new Map();
let winTopTimerId = 0;
runInNewContext(compiledFeature, {
    ...context,
    clearInterval: (id) => winTopTimers.delete(id),
    exports: winTopExports,
    process: { env: {}, platform: 'win32' },
    setInterval(callback, delay) {
        const id = ++winTopTimerId;
        winTopTimers.set(id, { callback, delay });
        return id;
    },
});
const winTopFeature = winTopExports.initDesktopLyrics(
    () => main,
    () => {},
);
await open();
let winTopWindow = windows.at(-1);
assert.deepEqual(Array.from(winTopWindow.top), [true, 'pop-up-menu']);
assert.equal(winTopWindow.options.webPreferences.backgroundThrottling, false);
const winTopRefresh = () => {
    const refresh = [...winTopTimers.values()].find((timer) => timer.delay === 100);
    assert.ok(refresh, 'Windows has the experimental 100ms topmost maintenance timer');
    refresh.callback();
};
const winCaptureTarget = winTopWindow;
const winCaptureTitle = winTopWindow.options.title;
const winCaptureWindowCount = windows.length;
for (const locked of [false, true, false, true, false]) {
    winTopFeature.setLocked(locked);
    const raises = winTopWindow.raises;
    const sent = winTopWindow.webContents.sent.length;
    winTopRefresh(); // No show/blur event: simulate another topmost application moving above us.
    assert.equal(winTopWindow.raises, raises + 1);
    assert.equal(winTopWindow.ignoresMouse, locked);
    assert.equal(
        winTopWindow.focusabilityChanges ?? 0,
        0,
        'Windows lock/unlock must not change native focusability or taskbar registration',
    );
    assert.equal(windows.at(-1), winCaptureTarget, 'Keep the same capture target window');
    assert.equal(windows.length, winCaptureWindowCount);
    assert.equal(winTopWindow.options.title, winCaptureTitle);
    assert.equal(winTopWindow.visible, true, 'Do not hide or recreate the capture target');
    assert.deepEqual(Array.from(winTopWindow.top), [true, 'pop-up-menu']);
    assert.equal(winTopWindow.webContents.sent.length, sent);
}
winTopWindow.hide();
const hiddenRaises = winTopWindow.raises;
winTopRefresh();
assert.equal(winTopWindow.raises, hiddenRaises, 'Never raise or show a hidden overlay');
const oldWinTopRefresh = [...winTopTimers.values()].find((timer) => timer.delay === 100).callback;
winTopFeature.close();
assert.equal(winTopTimers.size, 0, 'Closing clears hover and topmost timers');
assert.doesNotThrow(oldWinTopRefresh);
assert.equal(winTopWindow.raises, hiddenRaises);
await open();
winTopWindow = windows.at(-1);
assert.equal(winTopTimers.size, 2, 'Reopening creates one hover timer and one topmost timer');
winTopFeature.setLocked(true);
handlers.get('desktop-lyrics-lock')({ sender: main.webContents }, false);
assert.equal(winTopWindow.ignoresMouse, false, 'Main-window unlocking still works');
winTopFeature.dispose();
assert.equal(winTopTimers.size, 0);
console.log(
    'Windows topmost maintenance: explicit overlay level, focus-independent refresh, click-through/external unlock, hidden-window guard and timer teardown: PASS',
);

// New secondary settings preserve the old appearance until explicitly detached.
const oldGroupSettings = { ...defaultDesktopLyricsSettings };
for (const key of [
    'nextIndependent',
    'nextStyle',
    'nextTranslationIndependent',
    'nextTranslationStyle',
])
    delete oldGroupSettings[key];
const migratedGroups = desktopLyricsSettingsSchema.parse(oldGroupSettings);
assert.equal(migratedGroups.nextIndependent, false);
assert.equal(migratedGroups.nextTranslationIndependent, false);
const detachedGroups = {
    ...defaultDesktopLyricsSettings,
    nextIndependent: true,
    nextStyle: {
        ...defaultDesktopLyricsSettings.nextStyle,
        font: { builtIn: 'serif', custom: '/tmp/next.ttf', system: null, type: 'custom' },
        fontColor: '#112233',
        fontOpacity: 43,
        fontSize: 91,
        outline: 7,
    },
    nextStyleInitialized: true,
    nextTranslationIndependent: true,
    nextTranslationStyle: {
        ...defaultDesktopLyricsSettings.nextTranslationStyle,
        font: {
            builtIn: 'monospace',
            custom: '/tmp/next-translation.ttf',
            system: null,
            type: 'custom',
        },
        fontColor: '#abcdef',
        fontOpacity: 67,
        fontSize: 83,
        outline: 13,
    },
    nextTranslationStyleInitialized: true,
    translationStyleInitialized: true,
};
for (const nextIndependent of [false, true]) {
    for (const nextTranslationIndependent of [false, true]) {
        const saved = { ...detachedGroups, nextIndependent, nextTranslationIndependent };
        const effective = getEffectiveDesktopLyricsSettings(saved);
        assert.deepEqual(saved.nextStyle, detachedGroups.nextStyle);
        assert.deepEqual(saved.nextTranslationStyle, detachedGroups.nextTranslationStyle);
        if (nextTranslationIndependent)
            assert.deepEqual(effective.nextTranslationStyle, saved.nextTranslationStyle);
        if (!nextIndependent) {
            assert.equal(effective.nextStyle.fontSize, (saved.fontSize * 20) / 26);
            assert.equal(effective.nextStyle.fontOpacity, saved.fontOpacity * 0.8);
            assert.deepEqual(effective.nextStyle.font, saved.font);
            if (!nextTranslationIndependent)
                assert.equal(
                    effective.nextTranslationStyle.fontSize,
                    (Math.floor(saved.fontSize * 0.8) * 20) / 26,
                );
        } else {
            assert.deepEqual(effective.nextStyle, saved.nextStyle);
            if (nextTranslationIndependent)
                assert.deepEqual(effective.nextTranslationStyle, saved.nextTranslationStyle);
            else {
                assert.equal(
                    effective.nextTranslationStyle.fontSize,
                    Math.floor(saved.nextStyle.fontSize * 0.8),
                );
                assert.deepEqual(effective.nextTranslationStyle.font, saved.nextStyle.font);
                assert.equal(effective.nextTranslationStyle.fontColor, saved.nextStyle.fontColor);
                assert.equal(
                    effective.nextTranslationStyle.fontOpacity,
                    saved.nextStyle.fontOpacity,
                );
                assert.equal(effective.nextTranslationStyle.outline, saved.nextStyle.outline);
            }
        }
    }
}
const nestedEffective = getEffectiveDesktopLyricsSettings(detachedGroups);
for (const height of [56, 112, 400]) {
    const [a, b, c, d] = getDesktopLyricsFontSizes(
        first,
        second,
        nestedEffective.fontSize,
        height,
        nestedEffective.translationFontSize,
        nestedEffective.nextStyle.fontSize,
        nestedEffective.nextTranslationStyle.fontSize,
    );
    assert.ok(1.2 * (a + b + c + d) <= height + 1e-8);
    assert.ok(
        a <= nestedEffective.fontSize &&
            b <= nestedEffective.nextStyle.fontSize &&
            d <= nestedEffective.nextTranslationStyle.fontSize,
    );
}
assert.ok(
    getDesktopLyricsWindowSize(grouped, detachedGroups, area).height >
        getDesktopLyricsWindowSize(grouped, migratedGroups, area).height,
);
for (const role of ['nextStyle', 'nextTranslationStyle']) {
    for (const patch of [
        { fontSize: 129 },
        { fontSize: 0 },
        { fontSize: NaN },
        { fontOpacity: 101 },
        { outline: 21 },
        { outlineColor: 'url(evil)' },
        { fontColor: 'var(--unsafe)' },
        { fontGradient: 'true' },
        { arbitraryCss: 'position:fixed' },
    ]) {
        assert.equal(
            desktopLyricsSettingsSchema.safeParse({
                ...detachedGroups,
                [role]: { ...detachedGroups[role], ...patch },
            }).success,
            false,
        );
    }
}
handlers.get('desktop-lyrics-settings-update')({ sender: main.webContents }, detachedGroups);
assert.deepEqual(
    handlers.get('desktop-lyrics-settings')({ sender: main.webContents }),
    detachedGroups,
);
assert.equal(winTopFeature.getFontPath('/next'), '/tmp/next.ttf');
assert.equal(winTopFeature.getFontPath('/next-translation'), '/tmp/next-translation.ttf');
handlers.get('desktop-lyrics-settings-update')(
    { sender: main.webContents },
    { ...detachedGroups, nextTranslationIndependent: false },
);
assert.equal(winTopFeature.getFontPath('/next-translation'), '/tmp/next.ttf');
assert.equal(winTopFeature.getFontPath('/next/../../secret'), null);

for (const compact of [false, true]) {
    const getOptions = () => {
        pickerHookIndex = 0;
        const section = pickerExports.DesktopLyricsSettingsSection({ compact });
        return compact ? section.props.children.props.options : section.props.options;
    };
    const title = (option) => (compact ? option.id : option.title);
    const control = (option) => (compact ? option.component : option.control);
    for (const gradient of [false, true]) {
        pickerHooks = [
            {
                ...defaultDesktopLyricsSettings,
                fontGradient: gradient,
                nextIndependent: true,
                nextStyle: { ...defaultDesktopLyricsSettings.nextStyle, fontGradient: gradient },
                nextTranslationIndependent: true,
                nextTranslationStyle: {
                    ...defaultDesktopLyricsSettings.nextTranslationStyle,
                    fontGradient: gradient,
                },
                translationFontGradient: gradient,
                translationIndependent: true,
            },
        ];
        const colors = getOptions()
            .map(control)
            .filter((item) => item.type === 'ColorInput');
        assert.equal(colors.length, gradient ? 12 : 8);
        for (const color of colors) {
            assert.deepEqual(Array.from(color.props.swatches ?? []), [
                'rgb(53, 116, 252)',
                'rgb(240, 170, 22)',
                'rgb(29, 185, 84)',
                'rgb(214, 81, 63)',
                'rgb(170, 110, 216)',
            ]);
            assert.equal(color.props.swatchesPerRow, 5);
            assert.equal(color.props.withEyeDropper, false);
        }
    }
    pickerHooks = [{ ...defaultDesktopLyricsSettings }];
    const widthControl = control(
        getOptions().find((option) => title(option) === 'desktopLyrics.widthCharacters'),
    );
    assert.equal(widthControl.props.min, 10);
    assert.equal(widthControl.props.max, 50);
    assert.equal(widthControl.props.value, 20);
    if (compact) assert.equal(widthControl.props.marks[0].value, 10);
    for (const key of ['translationIndependent', 'nextIndependent', 'nextTranslationIndependent']) {
        pickerHooks = [
            {
                ...defaultDesktopLyricsSettings,
                fontColor: '#abcdef',
                fontSize: 57,
                nextIndependent: false,
                nextStyleInitialized: false,
            },
        ];
        const toggle = () =>
            control(getOptions().find((option) => title(option) === `desktopLyrics.${key}`));
        toggle().props.onChange({ currentTarget: { checked: true } });
        finishColorSave();
        await new Promise((resolve) => setImmediate(resolve));
        const saved = pickerHooks[0];
        if (key === 'translationIndependent') {
            assert.equal(saved.translationFontSize, 57);
            assert.equal(saved.translationFontColor, '#abcdef');
            assert.equal(saved.translationStyleInitialized, true);
        } else {
            const role = key === 'nextIndependent' ? 'nextStyle' : 'nextTranslationStyle';
            assert.equal(saved[role].fontColor, '#abcdef');
            assert.equal(
                saved[role].fontSize,
                key === 'nextIndependent' ? 57 : Math.round((57 * 20) / 26),
            );
            assert.equal(saved[role + 'Initialized'], true);
        }
    }
    pickerHooks = [{ ...defaultDesktopLyricsSettings, rollingMode: false }];
    const rollingToggle = () =>
        control(getOptions().find((option) => title(option) === 'desktopLyrics.rollingMode'));
    assert.equal(rollingToggle().props.checked, false);
    rollingToggle().props.onChange({ currentTarget: { checked: true } });
    finishColorSave();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(rollingToggle().props.checked, true);
    const singleToggle = () =>
        control(getOptions().find((option) => title(option) === 'desktopLyrics.singleLine'));
    singleToggle().props.onChange({ currentTarget: { checked: true } });
    finishColorSave();
    await new Promise((resolve) => setImmediate(resolve));
    assert.ok(!getOptions().some((option) => title(option) === 'desktopLyrics.rollingMode'));
    singleToggle().props.onChange({ currentTarget: { checked: false } });
    finishColorSave();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(rollingToggle().props.checked, true);
    for (const singleLine of [false, true]) {
        for (const nextIndependent of [false, true]) {
            for (const nextTranslationIndependent of [false, true]) {
                pickerHooks = [
                    {
                        ...detachedGroups,
                        nextIndependent,
                        nextTranslationIndependent,
                        singleLine,
                        translationIndependent: false,
                    },
                ];
                const options = getOptions();
                const labels = options.map(title);
                assert.equal(labels[1], 'desktopLyrics.singleLine');
                assert.equal(labels.includes('desktopLyrics.rollingMode'), !singleLine);
                assert.ok(!labels.includes('desktopLyrics.translationFont'));
                assert.equal(labels.includes('desktopLyrics.nextIndependent'), !singleLine);
                assert.equal(
                    labels.includes('desktopLyrics.nextTranslationIndependent'),
                    !singleLine,
                );
                const nextFont = options.find(
                    (option) =>
                        title(option) === 'desktopLyrics.nextLyrics · desktopLyrics.styleFont',
                );
                const translatedFont = options.find(
                    (option) =>
                        title(option) === 'desktopLyrics.nextTranslation · desktopLyrics.styleFont',
                );
                assert.equal(!!nextFont, !singleLine && nextIndependent);
                assert.equal(!!translatedFont, !singleLine && nextTranslationIndependent);
                if (nextFont)
                    assert.deepEqual(control(nextFont).props.value, detachedGroups.nextStyle.font);
                if (translatedFont)
                    assert.deepEqual(
                        control(translatedFont).props.value,
                        detachedGroups.nextTranslationStyle.font,
                    );
                if (singleLine)
                    assert.ok(!labels.some((label) => label.startsWith('desktopLyrics.next')));
            }
        }
    }
    pickerHooks = [{ ...detachedGroups }];
    for (const role of ['nextLyrics', 'nextTranslation']) {
        const size = control(
            getOptions().find(
                (option) => title(option) === `desktopLyrics.${role} · desktopLyrics.styleFontSize`,
            ),
        );
        assert.equal(size.type, compact ? 'Slider' : 'NumberInput');
        if (compact) assert.equal(size.props.marks.at(-1).value, 128);
        const color = () =>
            control(
                getOptions().find(
                    (option) =>
                        title(option) ===
                        `desktopLyrics.${role} · desktopLyrics.styleFontGradientTop`,
                ),
            ).props;
        color().onClick();
        color().onChange('rgb(1, 2, 3)');
        color().onChangeEnd('rgb(1, 2, 3)');
        assert.equal(color().disabled, true);
        color().popoverProps.onDismiss();
        assert.equal(color().popoverProps.opened, false);
        finishColorSave();
        await new Promise((resolve) => setImmediate(resolve));
        assert.equal(color().popoverProps.opened, false);
        const toggle = control(
            getOptions().find((option) => title(option) === 'desktopLyrics.nextIndependent'),
        );
        toggle.props.onChange({ currentTarget: { checked: false } });
        assert.ok(
            !getOptions().some((option) => title(option).startsWith('desktopLyrics.nextLyrics ·')),
        );
        finishColorSave();
        await new Promise((resolve) => setImmediate(resolve));
        const expand = control(
            getOptions().find((option) => title(option) === 'desktopLyrics.nextIndependent'),
        );
        expand.props.onChange({ currentTarget: { checked: true } });
        finishColorSave();
        await new Promise((resolve) => setImmediate(resolve));
        assert.equal(color().value, 'rgb(1, 2, 3)', 'Collapsed styles keep saved values');
    }
}
console.log(
    'Secondary styles: legacy scaling, independent inheritance, four-font routing, safe persistence, height fitting, both settings views, conditional rendering and color dismissal: PASS',
);

// First-time independent styles copy their source, then survive disable/reopen/reload.
const inheritanceSource = {
    ...defaultDesktopLyricsSettings,
    fontColor: 'rgb(1, 2, 3)',
    fontOpacity: 33,
    fontSize: 57,
    nextIndependent: false,
    nextStyleInitialized: false,
    outline: 8,
};
const inheritedNext = setDesktopLyricsIndependent(inheritanceSource, 'nextIndependent', true);
assert.equal(inheritedNext.nextStyle.fontSize, 57);
assert.equal(inheritedNext.nextStyle.fontColor, inheritanceSource.fontColor);
assert.equal(inheritedNext.nextStyle.fontOpacity, 33);
assert.equal(inheritedNext.nextStyle.outline, 8);
assert.equal(inheritedNext.nextStyleInitialized, true);
assert.equal(inheritanceSource.nextStyleInitialized, false);
const inheritedTranslation = setDesktopLyricsIndependent(
    inheritanceSource,
    'translationIndependent',
    true,
);
assert.equal(inheritedTranslation.translationFontSize, 57);
assert.equal(inheritedTranslation.translationFontColor, inheritanceSource.fontColor);
assert.equal(inheritedTranslation.translationFontOpacity, 33);
assert.equal(inheritedTranslation.translationOutline, 8);
assert.equal(inheritedTranslation.translationFontGradient, inheritanceSource.fontGradient);
const inheritedNextTranslation = setDesktopLyricsIndependent(
    inheritedNext,
    'nextTranslationIndependent',
    true,
);
assert.deepEqual(inheritedNextTranslation.nextTranslationStyle, inheritedNext.nextStyle);
const linkedNextTranslation = setDesktopLyricsIndependent(
    inheritanceSource,
    'nextTranslationIndependent',
    true,
);
assert.equal(linkedNextTranslation.nextTranslationStyle.fontSize, Math.round((57 * 20) / 26));
assert.equal(linkedNextTranslation.nextTranslationStyle.fontOpacity, Math.round(33 * 0.8));
assert.ok(desktopLyricsSettingsSchema.safeParse(linkedNextTranslation).success);
for (const key of ['nextIndependent', 'nextTranslationIndependent', 'translationIndependent']) {
    let saved = setDesktopLyricsIndependent(inheritanceSource, key, true);
    saved = desktopLyricsSettingsSchema.parse(
        JSON.parse(JSON.stringify(setDesktopLyricsIndependent(saved, key, false))),
    );
    const reopened = setDesktopLyricsIndependent(
        { ...saved, fontColor: '#ff0000', fontSize: 100 },
        key,
        true,
    );
    if (key === 'nextIndependent') assert.deepEqual(reopened.nextStyle, saved.nextStyle);
    if (key === 'nextTranslationIndependent')
        assert.deepEqual(reopened.nextTranslationStyle, saved.nextTranslationStyle);
    if (key === 'translationIndependent') {
        assert.equal(reopened.translationFontSize, saved.translationFontSize);
        assert.equal(reopened.translationFontColor, saved.translationFontColor);
    }
}
const oldRecorded = { ...inheritedNextTranslation, ...inheritedTranslation };
delete oldRecorded.nextStyleInitialized;
delete oldRecorded.nextTranslationStyleInitialized;
delete oldRecorded.translationStyleInitialized;
const recorded = desktopLyricsSettingsSchema.parse(oldRecorded);
assert.equal(recorded.nextStyleInitialized, true);
assert.equal(recorded.nextTranslationStyleInitialized, true);
assert.equal(recorded.translationStyleInitialized, true);
const noRecords = { ...oldRecorded };
for (const key of Object.keys(noRecords))
    if (key.startsWith('translation') || key === 'nextStyle' || key === 'nextTranslationStyle')
        delete noRecords[key];
const missing = desktopLyricsSettingsSchema.parse(noRecords);
assert.equal(missing.nextStyleInitialized, false);
assert.equal(missing.nextTranslationStyleInitialized, false);
assert.equal(missing.translationStyleInitialized, false);
assert.equal(
    setDesktopLyricsIndependent(missing, 'translationIndependent', true).translationFontSize,
    missing.fontSize,
);
console.log(
    'First independent activation: copy original styles, preserve saved records, legacy/missing migration and disable/reopen persistence: PASS',
);

// OBS matching must survive localized open/restore labels and page title updates.
const titleFeature = exports.initDesktopLyrics(
    () => main,
    () => {},
);
for (const title of ['桌面歌词', 'Desktop lyrics', 'デスクトップ歌詞']) {
    await handlers.get('desktop-lyrics-open')(
        { sender: main.webContents },
        { close: 'Close', title, unlock: 'Unlock' },
    );
    const captured = windows.at(-1);
    assert.equal(captured.options.title, 'Feishin - Desktop lyrics');
    let prevented = false;
    captured.emit(
        'page-title-updated',
        {
            preventDefault() {
                prevented = true;
            },
        },
        'Song name',
    );
    assert.equal(prevented, true);
    titleFeature.setLocked(true);
    titleFeature.setLocked(false);
    assert.equal(windows.at(-1), captured);
    assert.equal(captured.options.title, 'Feishin - Desktop lyrics');
    titleFeature.close();
    preferences.set('desktop_lyrics_open', true);
    await handlers.get('desktop-lyrics-restore')(
        { sender: main.webContents },
        { close: 'Close', title, unlock: 'Unlock' },
    );
    assert.equal(windows.at(-1).options.title, 'Feishin - Desktop lyrics');
    // Opening an already restored window must not change its title.
    await handlers.get('desktop-lyrics-open')(
        { sender: main.webContents },
        { close: 'Close', title, unlock: 'Unlock' },
    );
    assert.equal(windows.at(-1).options.title, 'Feishin - Desktop lyrics');
    titleFeature.close();
}
titleFeature.dispose();
console.log(
    'Stable OBS title: localized labels, reopen, page-title protection and same lock/unlock capture target: PASS',
);

// Both NetEase merged lyrics and duplicate timestamps hide translations, never originals.
const mergedPrimary = {
    ...snapshot,
    lines: [
        { startMs: 1000, text: 'Original_BREAK_译文_BREAK_ignored' },
        { startMs: 2000, text: 'Next original_BREAK_下一句译文' },
    ],
    timestamp: 1,
};
assert.deepEqual(getDesktopLyricsPair(mergedPrimary), [
    ['Original', '译文'],
    ['Next original', '下一句译文'],
]);
for (const singleLine of [false, true]) {
    const settings = {
        ...defaultDesktopLyricsSettings,
        displayMode: 'original',
        showTranslation: false,
        singleLine,
    };
    assert.deepEqual(getDesktopLyricsPair(mergedPrimary, settings), [
        ['Original'],
        singleLine ? [] : ['Next original'],
    ]);
    assert.deepEqual(getDesktopLyricsPair({ ...grouped, timestamp: 1 }, settings), [
        ['First original'],
        singleLine ? [] : ['Second original'],
    ]);
    assert.deepEqual(getDesktopLyricsPair({ ...mergedPrimary, offsetMs: 1000 }, settings), [
        ['Next original'],
        [],
    ]);
}
console.log(
    'Hide translations: original-first timestamps and NetEase breaks, extra rows, next previews, offsets and single-line mode: PASS',
);

// Content selection changes text assignment, never the saved upper/lower styles.
assert.equal(defaultDesktopLyricsSettings.displayMode, 'both');
assert.equal(defaultDesktopLyricsSettings.translationBelow, true);
for (const translationBelow of [true, false]) {
    for (const displayMode of ['both', 'original', 'translation']) {
        const prefs = { ...defaultDesktopLyricsSettings, displayMode, translationBelow };
        const pick = (original, translated) =>
            displayMode === 'original'
                ? [original]
                : displayMode === 'translation'
                  ? [translated]
                  : translationBelow
                    ? [original, translated]
                    : [translated, original];
        assert.deepEqual(getDesktopLyricsPair({ ...grouped, timestamp: 1 }, prefs), [
            pick('First original', '第一句译文'),
            pick('Second original', '第二句译文'),
        ]);
        assert.deepEqual(getDesktopLyricsPair(mergedPrimary, prefs), [
            pick('Original', '译文'),
            pick('Next original', '下一句译文'),
        ]);
        assert.deepEqual(getDesktopLyricsPair(slashSong, prefs), [
            pick('Original', '译文'),
            pick('Next primary', 'Next translation'),
        ]);
        assert.deepEqual(
            getDesktopLyricsPair(
                { ...grouped, offsetMs: 1000, timestamp: 1 },
                { ...prefs, singleLine: true },
            ),
            [pick('Second original', '第二句译文'), []],
        );
        assert.deepEqual(getDesktopLyricsPair({ ...snapshot, timestamp: 1 }, prefs), [
            ['First'],
            ['Second'],
        ]);
        assert.deepEqual(getDesktopLyricsPair({ ...snapshot, lines: [] }, prefs), [['Song'], []]);
        assert.ok(desktopLyricsSettingsSchema.safeParse(prefs).success);
    }
}
const oldDisplaySettings = { ...defaultDesktopLyricsSettings, showTranslation: false };
delete oldDisplaySettings.displayMode;
delete oldDisplaySettings.translationBelow;
assert.equal(desktopLyricsSettingsSchema.parse(oldDisplaySettings).displayMode, 'original');
assert.equal(desktopLyricsSettingsSchema.parse(oldDisplaySettings).translationBelow, true);
for (const patch of [{ displayMode: 'invalid' }, { translationBelow: 'true' }])
    assert.equal(
        desktopLyricsSettingsSchema.safeParse({ ...defaultDesktopLyricsSettings, ...patch })
            .success,
        false,
    );
for (const compact of [false, true]) {
    pickerHooks = [{ ...defaultDesktopLyricsSettings }];
    const options = () => {
        pickerHookIndex = 0;
        const section = pickerExports.DesktopLyricsSettingsSection({ compact });
        return compact ? section.props.children.props.options : section.props.options;
    };
    const key = (option) => (compact ? option.id : option.title);
    const props = (name) => {
        const option = options().find((option) => key(option) === 'desktopLyrics.' + name);
        return (compact ? option.component : option.control).props;
    };
    assert.equal(props('showTranslation').value, 'both');
    assert.deepEqual(
        Array.from(props('showTranslation').data, (item) => item.value),
        ['both', 'translation', 'original'],
    );
    for (const mode of ['translation', 'original', 'both']) {
        props('showTranslation').onChange(mode);
        finishColorSave();
        await new Promise((resolve) => setImmediate(resolve));
        assert.equal(props('showTranslation').value, mode);
    }
    const styleBefore = JSON.stringify(pickerHooks[0]);
    props('translationBelow').onChange({ currentTarget: { checked: false } });
    finishColorSave();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(props('translationBelow').checked, false);
    const previous = JSON.parse(styleBefore);
    assert.deepEqual(JSON.parse(JSON.stringify(pickerHooks[0])), {
        ...previous,
        translationBelow: false,
    });
    const labels = options().map(key);
    for (const general of [
        'showTranslation',
        'translationBelow',
        'layout',
        'shadow',
        'widthCharacters',
        'transparentBackground',
    ])
        assert.ok(
            labels.indexOf('desktopLyrics.' + general) < labels.indexOf('desktopLyrics.font'),
        );
    assert.ok(
        labels.indexOf('desktopLyrics.nextIndependent') >
            labels.indexOf('desktopLyrics.outlineColor'),
    );
}
let slotScreenHeight = 1080;
let slotSnapshot = { ...grouped, timestamp: 1 };
// Execute the actual window render with hook stubs; no browser or desktop automation.
let renderSlots,
    slotPrefs,
    slotStateIndex = 0;
const slotCode = transpileModule(
    readFileSync(
        new URL('../src/renderer/features/lyrics/desktop-lyrics-window.tsx', import.meta.url),
        'utf8',
    ),
    {
        compilerOptions: {
            esModuleInterop: true,
            jsx: require('typescript').JsxEmit.ReactJSX,
            module: ModuleKind.CommonJS,
        },
    },
).outputText;
runInNewContext(slotCode, {
    document: { body: { style: {} }, documentElement: { style: {} }, getElementById: () => ({}) },
    exports: {},
    require(name) {
        if (name === 'react')
            return {
                useEffect() {
                    return undefined;
                },
                useRef: (value) => ({ current: value }),
                useState(initial) {
                    const index = slotStateIndex++;
                    return [
                        index === 0
                            ? {
                                  revision: 1,
                                  screenHeight: slotScreenHeight,
                                  snapshot: slotSnapshot,
                              }
                            : index === 7
                              ? slotPrefs
                              : initial,
                        () => {},
                    ];
                },
            };
        if (name === 'react/jsx-runtime')
            return {
                jsx: (type, props) => ({ props, type }),
                jsxs: (type, props) => ({ props, type }),
            };
        if (name === 'react-dom/client')
            return {
                createRoot: () => ({
                    render: (tree) => {
                        renderSlots = tree.props.children.type;
                    },
                }),
            };
        if (name === 'react-i18next') return { useTranslation: () => ({ t: (key) => key }) };
        if (name.endsWith('/utils/desktop-lyrics'))
            return {
                defaultDesktopLyricsSettings,
                getDesktopLyricsControlsLayout,
                getDesktopLyricsFontSizes,
                getDesktopLyricsPair,
                getDesktopLyricsTiming,
                getEffectiveDesktopLyricsSettings,
                isDesktopLyricsCurrentOnBottom,
            };
        if (name === './desktop-lyrics-line') return { DesktopLyricsLine: 'DesktopLyricsLine' };
        if (name.endsWith('.css')) return new Proxy({}, { get: (_, key) => key });
        return new Proxy({}, { get: (_, key) => key });
    },
    window: {
        api: { desktopLyrics: {} },
        devicePixelRatio: 1,
        innerHeight: 1080,
        screen: { height: 1080 },
    },
});
const slotLines = (tree) =>
    !tree || typeof tree !== 'object'
        ? []
        : Array.isArray(tree)
          ? tree.flatMap(slotLines)
          : tree.type === 'DesktopLyricsLine'
            ? [tree.props]
            : slotLines(tree.props?.children);
for (const layout of ['center', 'diagonal']) {
    for (const singleLine of [false, true]) {
        const rendered = [];
        for (const translationBelow of [true, false]) {
            slotStateIndex = 0;
            slotPrefs = {
                ...defaultDesktopLyricsSettings,
                fontColor: '#123456',
                fontSize: 40,
                layout,
                singleLine,
                translationBelow,
                translationFontColor: '#abcdef',
                translationFontSize: 24,
                translationIndependent: true,
            };
            const tree = renderSlots();
            const lines = slotLines(tree);
            assert.equal(lines[0]['data-font'], 'translation');
            assert.equal(lines[1]['data-font'], 'primary');
            assert.equal(lines[0].fontSize, 24);
            assert.equal(lines[1].fontSize, 40);
            assert.equal(lines[0].text, translationBelow ? 'First original' : '第一句译文');
            assert.equal(lines[1].text, translationBelow ? '第一句译文' : 'First original');
            if (layout === 'diagonal' && singleLine) {
                assert.equal(lines[0].alignment, 'left');
                assert.equal(lines[1].alignment, 'right');
            }
            rendered.push(tree.props.style);
        }
        assert.deepEqual(rendered[0], rendered[1]);
    }
}
console.log(
    'Fixed upper/lower slots: three content modes, all source formats, migration, two UI surfaces/order, actual render styles and single-line layout: PASS',
);

// Without a second language, both single-language selections retain the raw row.
for (const displayMode of ['original', 'translation']) {
    for (const singleLine of [false, true]) {
        for (const translationBelow of [false, true]) {
            const prefs = {
                ...defaultDesktopLyricsSettings,
                displayMode,
                singleLine,
                translationBelow,
            };
            assert.deepEqual(getDesktopLyricsPair({ ...snapshot, timestamp: 1 }, prefs), [
                ['First'],
                singleLine ? [] : ['Second'],
            ]);
            assert.deepEqual(
                getDesktopLyricsPair({ ...snapshot, offsetMs: 1000, timestamp: 1 }, prefs),
                [['Second'], singleLine ? [] : ['Last']],
            );
            assert.deepEqual(
                getDesktopLyricsPair(
                    { ...snapshot, lines: [{ startMs: 1000, text: '只有这一行' }], timestamp: 1 },
                    prefs,
                ),
                [['只有这一行'], []],
            );
        }
    }
}
console.log(
    'Single-language fallback: either content selection retains sole row, next preview, offsets, layouts and ordering: PASS',
);

// Defaults: emphasized text below is larger; the following group is smaller.
const emphasisDefaults = getEffectiveDesktopLyricsSettings(defaultDesktopLyricsSettings);
assert.equal(emphasisDefaults.fontSize, 24);
assert.equal(emphasisDefaults.translationFontSize, 19);
assert.ok(emphasisDefaults.nextStyle.fontSize < emphasisDefaults.fontSize);
assert.ok(emphasisDefaults.nextTranslationStyle.fontSize < emphasisDefaults.translationFontSize);
slotStateIndex = 0;
slotPrefs = { ...defaultDesktopLyricsSettings };
const emphasisLines = slotLines(renderSlots());
assert.equal(emphasisLines[0]['data-font'], 'translation');
assert.equal(emphasisLines[1]['data-font'], 'primary');
assert.equal(emphasisLines[0].fontSize, 19);
assert.equal(emphasisLines[1].fontSize, 24);
assert.ok(emphasisLines[2].fontSize < emphasisLines[0].fontSize);
assert.ok(emphasisLines[3].fontSize < emphasisLines[1].fontSize);
assert.equal(emphasisLines[0].text, 'First original');
assert.equal(emphasisLines[1].text, '第一句译文');
console.log(
    'Emphasized/supporting roles: preserved primary profile below, supporting above, defaults 24/19 and smaller next group: PASS',
);

// Test actual adapters/converters without a browser, provider requests or rewritten algorithms.
const resultUtils = {};
runInNewContext(
    transpileModule(
        readFileSync(
            new URL('../src/renderer/features/lyrics/api/lyrics-utils.ts', import.meta.url),
            'utf8',
        ),
        { compilerOptions: { module: ModuleKind.CommonJS } },
    ).outputText,
    { exports: resultUtils, require },
);
const processedExports = {};
runInNewContext(
    transpileModule(
        readFileSync(
            new URL(
                '../src/renderer/features/lyrics/utils/build-desktop-lyrics-lines.ts',
                import.meta.url,
            ),
            'utf8',
        ),
        { compilerOptions: { module: ModuleKind.CommonJS } },
    ).outputText,
    {
        exports: processedExports,
        require: (name) => (name.endsWith('/api/lyrics-utils') ? resultUtils : require(name)),
    },
);
const realConversion = {};
runInNewContext(
    transpileModule(
        readFileSync(
            new URL('../src/main/features/core/lyrics/furigana.ts', import.meta.url),
            'utf8',
        ),
        { compilerOptions: { esModuleInterop: true, module: ModuleKind.CommonJS } },
    ).outputText,
    { console, exports: realConversion, require },
);
const japanese = '夢を見ている';
const rubyText = await realConversion.convertFurigana(japanese);
const romanText = await realConversion.convertRomaji(japanese);
assert.match(rubyText, /<ruby>.*<rt>/);
assert.match(romanText, /yume/);
const sourceRows = [
    { startMs: 1000, text: japanese },
    { startMs: 2000, text: '次の夢' },
];
const rubyRows = await Promise.all(
    sourceRows.map(async (line) => ({
        ...line,
        text: await realConversion.convertFurigana(line.text),
    })),
);
const romanRows = await Promise.all(
    sourceRows.map(async (line) => ({
        ...line,
        text: await realConversion.convertRomaji(line.text),
    })),
);
const combinedResults = processedExports.buildDesktopLyricsLines({
    furiganaLyrics: rubyRows,
    lyrics: sourceRows,
    romajiLyrics: romanRows,
    translatedLyrics: '正在做梦\n下一个梦',
});
const processedSnapshot = { ...snapshot, ...combinedResults, timestamp: 1 };
assert.deepEqual(getDesktopLyricsPair(processedSnapshot), [
    [rubyText, '正在做梦'],
    [rubyRows[1].text, '下一个梦'],
]);
assert.deepEqual(
    getDesktopLyricsPair(processedSnapshot, {
        ...defaultDesktopLyricsSettings,
        translationBelow: false,
    }),
    [
        ['正在做梦', rubyText],
        ['下一个梦', rubyRows[1].text],
    ],
);
assert.equal(processedSnapshot.romajiLines[0].text, romanText);
const convertedNetEaseText = await realConversion.convertFurigana(japanese + '_BREAK_正在做梦');
const romanNetEaseText = await realConversion.convertRomaji(japanese + '_BREAK_正在做梦');
const netEaseProcessed = processedExports.buildDesktopLyricsLines({
    furiganaLyrics: [{ startMs: 1000, text: convertedNetEaseText }],
    lyrics: [{ startMs: 1000, text: japanese + '_BREAK_正在做梦' }],
    romajiLyrics: [{ startMs: 1000, text: romanNetEaseText }],
});
assert.deepEqual(
    getDesktopLyricsPair({ ...snapshot, ...netEaseProcessed, timestamp: 1 })[0],
    convertedNetEaseText.split('_BREAK_'),
);
assert.ok(netEaseProcessed.romajiLines[0].text.includes('_BREAK_'));
const overlayProcessed = processedExports.buildDesktopLyricsLines({
    lyrics: sourceRows,
    pronunciationOverlay: [{ startMs: 1000, text: 'server pronunciation' }],
    translatedLyrics: 'Automatic translation\nSecond translation',
    translationOverlay: [{ startMs: 1000, text: 'Server translation' }],
});
assert.equal(overlayProcessed.translationLines[0].text, 'Server translation');
assert.equal(overlayProcessed.romajiLines[0].text, 'server pronunciation');
assert.deepEqual(
    getDesktopLyricsPair({
        ...snapshot,
        ...processedExports.buildDesktopLyricsLines({
            lyrics: [
                [1000, 'Original'],
                [1000, 'Translation'],
                [2000, 'Next'],
            ],
        }),
        timestamp: 1,
    }),
    [['Original', 'Translation'], ['Next']],
);
assert.ok(
    getDesktopLyricsWindowSize(processedSnapshot, defaultDesktopLyricsSettings, area).height >
        getDesktopLyricsWindowSize(
            { ...snapshot, lines: sourceRows },
            defaultDesktopLyricsSettings,
            area,
        ).height,
);
const annotationSizes = getDesktopLyricsFontSizes(
    [rubyText, '正在做梦'],
    [rubyRows[1].text, '下一个梦'],
    32,
    100,
    25,
    24,
    19,
    true,
);
assert.ok(
    1.2 *
        1.8 *
        (1.5 * annotationSizes[2] +
            annotationSizes[0] +
            1.5 * annotationSizes[3] +
            annotationSizes[1]) <=
        100 + 1e-8,
);
const processedFeature = exports.initDesktopLyrics(
    () => main,
    () => {},
);
await handlers.get('desktop-lyrics-open')(
    { sender: main.webContents },
    { close: 'Close', unlock: 'Unlock' },
);
const processedWindow = windows.at(-1);
handlers.get('desktop-lyrics-publish')({ sender: main.webContents }, processedSnapshot);
const receivedProcessed = () =>
    handlers.get('desktop-lyrics-snapshot')({ sender: processedWindow.webContents }).snapshot;
assert.deepEqual(
    JSON.parse(JSON.stringify(receivedProcessed().romajiLines)),
    JSON.parse(JSON.stringify(combinedResults.romajiLines)),
);
assert.deepEqual(
    JSON.parse(JSON.stringify(receivedProcessed().translationLines)),
    JSON.parse(JSON.stringify(combinedResults.translationLines)),
);
handlers.get('desktop-lyrics-time')(
    { sender: main.webContents },
    { timestamp: 2, trackKey: snapshot.trackKey },
);
assert.ok(receivedProcessed().romajiLines);
handlers.get('desktop-lyrics-publish')(
    { sender: main.webContents },
    { ...snapshot, lines: [], trackKey: 'next-song' },
);
assert.equal(receivedProcessed().romajiLines, undefined);
assert.equal(receivedProcessed().translationLines, undefined);
processedFeature.dispose();
slotSnapshot = processedSnapshot;
slotPrefs = { ...defaultDesktopLyricsSettings };
slotStateIndex = 0;
const annotatedRender = slotLines(renderSlots());
assert.equal(annotatedRender[0].text, rubyText);
assert.equal(annotatedRender[0].romajiText, romanText);
assert.equal(annotatedRender[1].text, '正在做梦');
assert.ok(!annotatedRender[1].romajiText);
assert.equal(annotatedRender[2].romajiText, romanRows[1].text);
console.log(
    'Processed sources: real furigana/romaji, NetEase separators, provider layers, translations, actual render, IPC, cutover and annotation height: PASS',
);

// Reuse one finished translation across manual lyrics UI and desktop lyrics.
const translateExports = {};
let translationRequests = 0;
runInNewContext(
    transpileModule(
        readFileSync(
            new URL('../src/renderer/features/lyrics/api/lyric-translate.ts', import.meta.url),
            'utf8',
        ),
        { compilerOptions: { esModuleInterop: true, module: ModuleKind.CommonJS } },
    ).outputText,
    {
        console,
        exports: translateExports,
        require(name) {
            if (name === 'axios')
                return async () => {
                    translationRequests++;
                    await new Promise((resolve) => setImmediate(resolve));
                    return { data: [{ translations: [{ text: 'Shared completed translation' }] }] };
                };
            return require(name);
        },
    },
);
const { QueryClient: TranslationQueryClient } = require('@tanstack/react-query');
const translationClient = new TranslationQueryClient();
const query = translateExports.lyricsTranslationQuery(
    japanese,
    'test-key',
    'Microsoft Azure',
    'en',
);
const [manualResult, desktopResult] = await Promise.all([
    translationClient.fetchQuery(query),
    translationClient.fetchQuery(query),
]);
assert.equal(manualResult, 'Shared completed translation');
assert.equal(desktopResult, manualResult);
assert.equal(translationRequests, 1);
assert.equal(await translationClient.fetchQuery(query), manualResult);
assert.equal(translationRequests, 1);
await translationClient.fetchQuery(
    translateExports.lyricsTranslationQuery('Different song', 'test-key', 'Microsoft Azure', 'en'),
);
assert.equal(translationRequests, 2);
assert.equal(query.staleTime({ state: { data: null } }), 0);
translationClient.clear();
console.log(
    'Shared translation result cache: concurrent consumers deduplicated, completed result reused, new source isolated, failures retryable: PASS',
);

// Exercise the actual publishing hook with completed provider/conversion results.
const publishingExports = {};
const publishingEffects = [],
    publishingQueryOptions = [],
    publishingSnapshots = [];
let publishingSong = {
    _serverId: 'server',
    _uniqueId: 'queue-song',
    duration: 180,
    id: 'song',
    name: 'Japanese song',
};
const publishingSourceSong = publishingSong;
let publishingPrefs = {
    delayMs: 0,
    enableAutoTranslation: false,
    enableFurigana: true,
    enableRomaji: true,
    preferLocalLyrics: true,
    translationApiKey: 'test-key',
    translationApiProvider: 'Microsoft Azure',
    translationTargetLanguage: 'en',
};
let publishingTrackListener;
runInNewContext(
    transpileModule(
        readFileSync(
            new URL('../src/renderer/features/lyrics/use-desktop-lyrics.ts', import.meta.url),
            'utf8',
        ),
        { compilerOptions: { esModuleInterop: true, module: ModuleKind.CommonJS } },
    ).outputText,
    {
        exports: publishingExports,
        require(name) {
            if (name === 'is-electron') return () => true;
            if (name === 'react')
                return {
                    useEffect: (effect) => publishingEffects.push(effect),
                    useMemo: (factory) => factory(),
                };
            if (name === '@tanstack/react-query')
                return {
                    useQuery: (options) => {
                        publishingQueryOptions.push(options);
                        return options.queryKey?.[0] === 'lyrics-translation'
                            ? { data: '正在做梦\n下一个梦' }
                            : { data: { local: null, selectedStructuredIndex: 0 } };
                    },
                };
            if (name.endsWith('/api/lyric-translate')) return translateExports;
            if (name.endsWith('/api/lyrics-api'))
                return {
                    computeSelectedFromResult: () => ({
                        selected: { lyrics: sourceRows },
                        selectedSynced: true,
                    }),
                    getDisplayOffset: () => 0,
                    lyricsQueries: { songLyrics: () => ({ queryKey: ['lyrics'] }) },
                };
            if (name.endsWith('/api/lyrics-utils')) return resultUtils;
            if (name.endsWith('/hooks/use-furigana-lyrics'))
                return {
                    useFuriganaLyrics: () => ({ data: rubyRows }),
                    useRomajiLyrics: () => ({ data: romanRows }),
                };
            if (name.endsWith('/utils/build-desktop-lyrics-lines')) return processedExports;
            if (name.endsWith('/use-local-storage')) return { useLocalStorage: () => [[]] };
            if (name.endsWith('/i18n')) return { language: 'en', t: (key) => key };
            if (name.endsWith('/desktop-lyrics.store'))
                return {
                    updateDesktopLyricsState: () => {},
                    useDesktopLyricsState: (fn) => fn({ open: true }),
                };
            if (name.endsWith('/use-radio-player')) return { useIsRadioActive: () => false };
            if (name.endsWith('/utils/desktop-lyrics')) return { getDesktopLyricsTrackKey };
            if (name.endsWith('/store/timestamp.store'))
                return { useTimestampStoreBase: { getState: () => ({ timestamp: 1 }) } };
            if (name.endsWith('/store'))
                return {
                    subscribeCurrentTrack: (callback) => {
                        publishingTrackListener = callback;
                        return () => {};
                    },
                    subscribePlayerProgress: () => () => {},
                    useLanguage: () => 'en',
                    useLyricsSettings: () => publishingPrefs,
                    usePlayerSong: () => publishingSourceSong,
                    usePlayerStatus: () => 'PLAYING',
                    usePlayerStoreBase: {
                        getState: () => ({
                            getCurrentSong: () => publishingSong,
                            player: { status: 'PLAYING' },
                        }),
                    },
                };
            if (name.endsWith('/types/types')) return { PlayerStatus: { PLAYING: 'PLAYING' } };
            return new Proxy({}, { get: () => ({}) });
        },
        window: {
            api: {
                desktopLyrics: {
                    publish: (value) => publishingSnapshots.push(value),
                    publishTime: () => {},
                },
            },
        },
    },
);
publishingExports.useDesktopLyrics();
publishingEffects.at(-1)();
const publishedReady = publishingSnapshots.at(-1);
assert.equal(publishedReady.lines[0].text, rubyText);
assert.equal(publishedReady.romajiLines[0].text, romanText);
assert.equal(publishedReady.translationLines[0].text, '正在做梦');
assert.equal(
    publishingQueryOptions.at(-1).enabled,
    false,
    'Reuse cached manual translations without a new automatic request',
);
publishingEffects[2]();
publishingSong = { ...publishingSong, _uniqueId: 'replacement', id: 'replacement' };
publishingTrackListener({ song: publishingSong });
assert.deepEqual(Array.from(publishingSnapshots.at(-1).lines), []);
assert.equal(publishingSnapshots.at(-1).romajiLines, undefined);
assert.equal(publishingSnapshots.at(-1).translationLines, undefined);
const afterCutover = publishingSnapshots.length;
publishingEffects.at(-1)();
assert.equal(
    publishingSnapshots.length,
    afterCutover,
    'Late converted results cannot publish over a new song',
);
publishingSong = publishingSourceSong;
publishingPrefs = { ...publishingPrefs, enableFurigana: false, enableRomaji: false };
publishingExports.useDesktopLyrics();
publishingEffects.at(-1)();
assert.equal(publishingSnapshots.at(-1).lines[0].text, japanese);
assert.equal(
    publishingSnapshots.at(-1).romajiLines,
    undefined,
    'Disabled annotations ignore cached conversions',
);
console.log(
    'Actual result publishing hook: shared flags, completed conversion/translation cache, no duplicate auto request, immediate cutover and late-result guard: PASS',
);
const nonJapaneseResults = processedExports.buildDesktopLyricsLines({
    lyrics: [{ startMs: 1000, text: 'Original' }],
    romajiLyrics: [{ startMs: 1000, text: '' }],
});
assert.equal(
    nonJapaneseResults.romajiLines,
    undefined,
    'No extra annotation height for empty conversion results',
);

const slotButtons = (tree) =>
    !tree || typeof tree !== 'object'
        ? []
        : Array.isArray(tree)
          ? tree.flatMap(slotButtons)
          : tree.type === 'ActionIcon' && tree.props.iconProps
            ? [tree.props]
            : slotButtons(tree.props?.children);

// Height-based scaling, flooring, scaled displays and live resolution changes.
for (const [screenHeight, iconSize] of [
    [720, 12],
    [1080, 18],
    [1080.25, 18],
    [1439.99, 23],
    [1440, 24],
    [1440.25, 24],
    [1920, 32],
    [2160, 36],
    [3840, 64],
]) {
    const controls = getDesktopLyricsControlsLayout(screenHeight);
    assert.equal(controls.iconSize, iconSize);
    slotScreenHeight = screenHeight;
    slotStateIndex = 0;
    const rendered = renderSlots();
    const buttons = slotButtons(rendered);
    assert.equal(buttons.length, 5);
    for (const button of buttons) {
        assert.equal(button.iconProps.size, iconSize);
        assert.equal(button.size, iconSize + 16);
    }
    assert.equal(rendered.props.style['--desktop-controls-height'], `${iconSize + 16}px`);
    const size = getDesktopLyricsWindowSize(
        null,
        { ...defaultDesktopLyricsSettings, fontSize: 20, widthCharacters: 10 },
        { height: 1080, width: 1920 },
        screenHeight,
    );
    assert.ok(size.width - 32 >= controls.buttonSize * 5 + 8, 'All five buttons fit');
    assert.ok(size.height - controls.chromeHeight >= 112, 'Preserve lyric space');
}
const resolutionFeature = exports.initDesktopLyrics(
    () => main,
    () => {},
);
const listenersBeforeOpen = testScreen.listenerCount('display-metrics-changed');
await open();
const resolutionWindow = windows.at(-1);
const firstHeight = resolutionWindow.getBounds().height;
assert.equal(testScreen.listenerCount('display-metrics-changed'), listenersBeforeOpen + 1);
testDisplay = { ...testDisplay, size: { height: 1440, width: 2560 } };
testScreen.emit('display-metrics-changed');
assert.equal(resolutionWindow.getBounds().height, firstHeight + 6);
assert.equal(
    resolutionWindow.webContents.sent
        .filter(([channel]) => channel === 'desktop-lyrics-snapshot')
        .at(-1)[1].screenHeight,
    1440,
);
// A Retina/HiDPI screen's full physical height determines the icon size.
testDisplay = { ...testDisplay, scaleFactor: 2 };
resolutionWindow.emit('move');
assert.equal(resolutionWindow.getBounds().height, firstHeight + 30);
assert.equal(
    resolutionWindow.webContents.sent
        .filter(([channel]) => channel === 'desktop-lyrics-snapshot')
        .at(-1)[1].screenHeight,
    2880,
);
testDisplay = { ...testDisplay, scaleFactor: 1, size: { height: 1080, width: 1920 } };
testScreen.emit('display-metrics-changed');
assert.equal(resolutionWindow.getBounds().height, firstHeight);
// Changing only screen width must not change the icon or window height.
testDisplay = { ...testDisplay, size: { height: 1080, width: 3840 } };
testScreen.emit('display-metrics-changed');
assert.equal(resolutionWindow.getBounds().height, firstHeight);
resolutionFeature.close();
assert.equal(testScreen.listenerCount('display-metrics-changed'), listenersBeforeOpen);
assert.doesNotThrow(() => testScreen.emit('display-metrics-changed'));
console.log(
    'Height-adaptive controls: formula, fractional flooring, HiDPI, five-button fit, live changes and listener cleanup: PASS',
);

// The gear opens one isolated settings window, never raises the main player.
const gearPreload = {};
const gearIpc = Object.assign(new EventEmitter(), { invoke: async (channel) => channel });
runInNewContext(
    transpileModule(
        readFileSync(new URL('../src/preload/desktop-lyrics.ts', import.meta.url), 'utf8'),
        { compilerOptions: { module: ModuleKind.CommonJS } },
    ).outputText,
    { exports: gearPreload, require: () => ({ ipcRenderer: gearIpc }) },
);
assert.equal(await gearPreload.desktopLyrics.openSettings(), 'desktop-lyrics-open-settings');
assert.equal(await gearPreload.desktopLyrics.resetSettings(), 'desktop-lyrics-settings-reset');

// These fixtures model separate application startups using one mock app.
testApp.removeAllListeners('before-quit');
testApp.commandLine = { getSwitchValue: () => 'x11' };
for (const [platform, level] of [
    ['darwin', 'screen-saver'],
    ['win32', 'pop-up-menu'],
    ['linux', undefined],
]) {
    const settingsExports = {};
    const settingsTimers = [];
    runInNewContext(compiledFeature, {
        ...context,
        exports: settingsExports,
        process: { env: {}, platform },
        setInterval(callback) {
            settingsTimers.push(callback);
            return settingsTimers.length;
        },
    });
    const feature = settingsExports.initDesktopLyrics(
        () => main,
        () => {},
    );
    preferences.set('desktop_lyrics_locked', false);
    main.setAlwaysOnTop(false);
    const mainRaises = main.raises;
    await open();
    const lyricsWindow = windows.at(-1);
    const requestSettings = (sender) => handlers.get('desktop-lyrics-open-settings')({ sender });
    assert.throws(() => requestSettings({}), /Cannot open/);
    assert.throws(() => requestSettings(main.webContents), /Cannot open/);
    await requestSettings(lyricsWindow.webContents);
    const settingsWindow = windows.at(-1);
    assert.notEqual(settingsWindow, lyricsWindow);
    assert.equal(settingsWindow.visible, true);
    assert.equal(settingsWindow.options.frame, false, 'Settings use no native title bar');
    assert.equal(settingsWindow.options.parent, undefined);
    assert.equal(settingsWindow.options.webPreferences.nodeIntegration, false);
    assert.equal(settingsWindow.options.webPreferences.contextIsolation, true);
    assert.equal(settingsWindow.options.webPreferences.sandbox, true);
    assert.equal(settingsWindow.top[1], level);
    assert.equal(settingsWindow.top[2], platform === 'darwin' ? 1 : undefined);
    assert.equal(main.isAlwaysOnTop(), false);
    assert.equal(main.raises, mainRaises, 'The main player is never raised');
    assert.equal(settingsWindow.loadedQuery.desktopLyricsSettings, '1');
    const count = windows.length;
    await requestSettings(lyricsWindow.webContents);
    assert.equal(windows.length, count, 'Repeated gear clicks reuse the window');
    assert.ok(settingsWindow.focused);
    settingsWindow.emit('blur');
    assert.equal(settingsWindow.visible, false, 'Clicking outside dismisses the popup');
    assert.equal(settingsWindow.isDestroyed(), false, 'Dismissal preserves in-flight saves');
    const hiddenUpdate = { ...defaultDesktopLyricsSettings, fontSize: 45 };
    handlers.get('desktop-lyrics-settings-update')(
        { sender: settingsWindow.webContents },
        hiddenUpdate,
    );
    assert.equal(preferences.get('desktop_lyrics_settings').fontSize, 45);
    await requestSettings(lyricsWindow.webContents);
    assert.equal(windows.at(-1), settingsWindow);
    assert.equal(settingsWindow.visible, true, 'Gear reopens the same dismissed popup');
    const selectFont = (sender) => handlers.get('desktop-lyrics-select-font')({ sender });
    await assert.rejects(selectFont({}), /Select fonts/);
    await assert.rejects(selectFont(lyricsWindow.webContents), /Select fonts/);
    let finishFontDialog;
    chooseDesktopFont = (parent, options) => {
        assert.equal(parent, settingsWindow);
        assert.deepEqual(Array.from(options.properties), ['openFile']);
        assert.deepEqual(Array.from(options.filters[0].extensions), [
            'ttc',
            'ttf',
            'otf',
            'woff',
            'woff2',
        ]);
        return new Promise((resolve) => {
            finishFontDialog = resolve;
        });
    };
    const selectingFont = selectFont(settingsWindow.webContents);
    settingsWindow.emit('blur');
    assert.equal(settingsWindow.visible, true, 'Native font picker must not dismiss its parent');
    assert.equal(await selectFont(settingsWindow.webContents), null, 'Deduplicate file dialogs');
    finishFontDialog({ filePaths: ['/fonts/test.woff2'] });
    assert.equal(await selectingFont, '/fonts/test.woff2');
    chooseDesktopFont = async () => ({ filePaths: [] });
    assert.equal(
        await selectFont(settingsWindow.webContents),
        null,
        'Cancellation keeps the old font',
    );
    chooseDesktopFont = async () => {
        throw new Error('Font picker failed');
    };
    await assert.rejects(selectFont(settingsWindow.webContents), /Font picker failed/);
    settingsWindow.emit('blur');
    assert.equal(settingsWindow.visible, false, 'Dialog failures release dismissal guard');
    await requestSettings(lyricsWindow.webContents);
    chooseDesktopFont = async () => ({ filePaths: [] });
    assert.equal(settingsWindow.webContents.windowOpenHandler().action, 'deny');
    let prevented = false;
    settingsWindow.webContents.emit('will-navigate', {
        preventDefault: () => {
            prevented = true;
        },
    });
    assert.equal(prevented, true);
    assert.throws(
        () =>
            handlers.get('desktop-lyrics-settings-update')(
                { sender: lyricsWindow.webContents },
                defaultDesktopLyricsSettings,
            ),
        /Update settings/,
    );
    assert.throws(
        () =>
            handlers.get('desktop-lyrics-settings-update')(
                { sender: {} },
                defaultDesktopLyricsSettings,
            ),
        /Update settings/,
    );
    const updated = { ...defaultDesktopLyricsSettings, fontSize: 48 };
    handlers.get('desktop-lyrics-settings-update')({ sender: settingsWindow.webContents }, updated);
    assert.equal(preferences.get('desktop_lyrics_settings').fontSize, 48);
    for (const target of [main, lyricsWindow, settingsWindow]) {
        assert.equal(
            target.webContents.sent
                .filter(([channel]) => channel === 'desktop-lyrics-settings-changed')
                .at(-1)[1].fontSize,
            48,
        );
    }
    const raised = settingsWindow.raises;
    lyricsWindow.emit('blur');
    for (const tick of settingsTimers) tick();
    assert.ok(settingsWindow.raises > raised, 'Only settings are raised after lyrics');
    assert.equal(main.raises, mainRaises);
    feature.setLocked(true);
    assert.equal(lyricsWindow.ignoresMouse, true);
    const resetSettings = (sender) => handlers.get('desktop-lyrics-settings-reset')({ sender });
    assert.throws(() => resetSettings({}), /Reset settings/);
    assert.throws(() => resetSettings(lyricsWindow.webContents), /Reset settings/);
    const stateBeforeReset = JSON.stringify(feature.getState());
    const expectedDefaults = getDefaultDesktopLyricsSettings(
        testDisplay.size.height * testDisplay.scaleFactor,
    );
    assert.equal(resetSettings(settingsWindow.webContents).fontSize, expectedDefaults.fontSize);
    assert.equal(
        preferences.get('desktop_lyrics_settings').nextStyle.fontSize,
        expectedDefaults.nextStyle.fontSize,
    );
    assert.equal(
        JSON.stringify(feature.getState()),
        stateBeforeReset,
        'Resetting styles preserves open/lock state',
    );
    assert.equal(lyricsWindow.ignoresMouse, true);
    assert.equal(
        resetSettings(main.webContents).fontGradientColor,
        expectedDefaults.fontGradientColor,
    );
    failWrites = true;
    assert.throws(() => resetSettings(settingsWindow.webContents), /Disk failure/);
    failWrites = false;
    assert.throws(() => requestSettings(lyricsWindow.webContents), /Cannot open/);
    // Independent settings remain operable while lyrics are wholly click-through.
    handlers.get('desktop-lyrics-lock')({ sender: settingsWindow.webContents }, false);
    assert.equal(lyricsWindow.ignoresMouse, false);
    settingsWindow.destroy();
    assert.throws(
        () =>
            handlers.get('desktop-lyrics-settings-update')(
                { sender: settingsWindow.webContents },
                updated,
            ),
        /Update settings/,
    );
    await requestSettings(lyricsWindow.webContents);
    const reopened = windows.at(-1);
    assert.notEqual(reopened, settingsWindow);
    feature.close();
    assert.equal(reopened.isDestroyed(), true);
    assert.equal(main.isAlwaysOnTop(), false);
    await open();
    await requestSettings(windows.at(-1).webContents);
    const quittingSettings = windows.at(-1);
    feature.dispose();
    assert.equal(quittingSettings.isDestroyed(), true);
}

// Run the real entrypoint with mocked dynamic imports: auxiliary surfaces never import App.
const entrypoint = readFileSync(new URL('../src/renderer/main.tsx', import.meta.url), 'utf8');
for (const [search, expected] of [
    ['?desktopLyrics=1', './features/lyrics/desktop-lyrics-window'],
    ['?desktopLyricsSettings=1', './features/lyrics/desktop-lyrics-settings-window'],
    ['', './app-entry'],
]) {
    const imported = [];
    runInNewContext(entrypoint.replaceAll('import(', 'loadSurface('), {
        loadSurface: (name) => {
            imported.push(name);
            return Promise.resolve();
        },
        URLSearchParams,
        window: { api: {}, location: { search } },
    });
    assert.deepEqual(imported, [expected]);
}
console.log(
    'Independent settings popup: frameless, blur dismissal/reopen, native font picker guards, isolation, live sync, lock recovery and teardown: PASS',
);

// Native Wayland keeps the independent surface usable without claiming unsupported stacking.
testApp.commandLine = { getSwitchValue: () => 'wayland' };
const waylandSettingsFeature = waylandExports.initDesktopLyrics(
    () => main,
    () => {},
);
await open();
const waylandSettingsLyrics = windows.at(-1);
await handlers.get('desktop-lyrics-open-settings')({ sender: waylandSettingsLyrics.webContents });
const waylandSettingsWindow = windows.at(-1);
assert.equal(waylandSettingsWindow.options.alwaysOnTop, false);
assert.equal(waylandSettingsWindow.top, undefined);
assert.equal(waylandSettingsWindow.visible, true);
waylandSettingsFeature.dispose();
assert.equal(waylandSettingsWindow.isDestroyed(), true);

// Failed loads and closing during a load must not leave an orphan or resurrect a window.
const loadingFeature = exports.initDesktopLyrics(
    () => main,
    () => {},
);
preferences.set('desktop_lyrics_locked', false);
await open();
let loadingLyrics = windows.at(-1);
const originalLoad = TestWindow.prototype.loadFile;
TestWindow.prototype.loadFile = async function (_path, options) {
    if (options.query.desktopLyricsSettings) throw new Error('Settings load failed');
    return originalLoad.call(this, _path, options);
};
await assert.rejects(
    handlers.get('desktop-lyrics-open-settings')({ sender: loadingLyrics.webContents }),
    /Settings load failed/,
);
assert.equal(windows.at(-1).isDestroyed(), true);
let finishLoading;
TestWindow.prototype.loadFile = function (_path, options) {
    if (options.query.desktopLyricsSettings)
        return new Promise((resolve) => {
            finishLoading = resolve;
        });
    return originalLoad.call(this, _path, options);
};
const pendingSettings = handlers.get('desktop-lyrics-open-settings')({
    sender: loadingLyrics.webContents,
});
const loadingSettings = windows.at(-1);
await handlers.get('desktop-lyrics-open-settings')({ sender: loadingLyrics.webContents });
assert.equal(loadingSettings.visible, false, 'Repeat clicks never show a half-loaded surface');
loadingFeature.close();
finishLoading();
await pendingSettings;
assert.equal(loadingSettings.visible, false);
assert.equal(loadingSettings.isDestroyed(), true);
TestWindow.prototype.loadFile = originalLoad;
await open();
loadingLyrics = windows.at(-1);
await handlers.get('desktop-lyrics-open-settings')({ sender: loadingLyrics.webContents });
const recoveredSettings = windows.at(-1);
recoveredSettings.webContents.emit('render-process-gone', {}, { reason: 'crashed' });
assert.equal(recoveredSettings.isDestroyed(), true);
assert.equal(loadingLyrics.isDestroyed(), false, 'A settings crash leaves lyrics alive');
loadingFeature.dispose();
console.log(
    'Settings lifecycle failures: load rejection, pending-load deduplication, close-during-load and isolated renderer crash: PASS',
);

// Fresh defaults use the lyric display's physical height; saved preferences always win.
preferences.delete('desktop_lyrics_settings');
preferences.set('desktop_lyrics_locked', false);
testDisplay = { ...testDisplay, scaleFactor: 2, size: { height: 810, width: 1440 } };
const defaultsFeature = exports.initDesktopLyrics(
    () => main,
    () => {},
);
const readDefaults = () => handlers.get('desktop-lyrics-settings')({ sender: main.webContents });
assert.equal(readDefaults().fontSize, 36);
assert.equal(readDefaults().nextStyle.fontSize, 32);
await open();
const defaultsWindow = windows.at(-1);
assert.equal(readDefaults().fontSize, 36);
assert.equal(
    main.webContents.sent
        .filter(([channel]) => channel === 'desktop-lyrics-settings-changed')
        .at(-1)[1].fontSize,
    36,
);
assert.equal(
    preferences.has('desktop_lyrics_settings'),
    false,
    'Reading defaults never rewrites preferences',
);
testDisplay = { ...testDisplay, scaleFactor: 1, size: { height: 1440, width: 2560 } };
testScreen.emit('display-metrics-changed');
assert.equal(readDefaults().fontSize, 32);
assert.equal(readDefaults().nextStyle.fontSize, 28);
const publishedDefaults = defaultsWindow.webContents.sent
    .filter(([channel]) => channel === 'desktop-lyrics-settings-changed')
    .at(-1)[1];
assert.equal(publishedDefaults.fontSize, 32);
assert.equal(publishedDefaults.nextStyle.fontSize, 28);
const savedDefaults = {
    ...readDefaults(),
    fontSize: 55,
    nextStyle: { ...readDefaults().nextStyle, fontSize: 44 },
};
handlers.get('desktop-lyrics-settings-update')({ sender: main.webContents }, savedDefaults);
testDisplay = { ...testDisplay, size: { height: 2160, width: 3840 } };
testScreen.emit('display-metrics-changed');
assert.equal(readDefaults().fontSize, 55);
assert.equal(readDefaults().nextStyle.fontSize, 44);
assert.equal(preferences.get('desktop_lyrics_settings').fontSize, 55);
defaultsFeature.dispose();
console.log(
    'Default settings lifecycle: physical/HiDPI height, initial sizing, live default synchronization, read-only fallback and saved font preservation: PASS',
);

// Both configuration surfaces expose reset last and apply the main-process result.
for (const compact of [false, true]) {
    pickerHooks = [{ ...defaultDesktopLyricsSettings, fontSize: 100, outline: 20 }];
    const getResetOption = () => (compact ? compactOptions() : colorOptions()).at(-1);
    const getResetButton = () => (compact ? getResetOption().component : getResetOption().control);
    assert.equal(
        compact ? getResetOption().id : getResetOption().title,
        'desktopLyrics.resetSettings',
    );
    assert.equal(getResetOption().description, 'desktopLyrics.resetDescription');
    assert.equal(getResetButton().props.disabled, false);
    getResetButton().props.onClick();
    assert.equal(getResetButton().props.disabled, true);
    finishResetSettings(getDefaultDesktopLyricsSettings(1440));
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(pickerHooks[0].fontSize, 32);
    assert.equal(pickerHooks[0].nextStyle.fontSize, 28);
    assert.equal(pickerHooks[0].outline, 2);
    assert.equal(getResetButton().props.disabled, false);
}
console.log(
    'Restore defaults: final button on both settings surfaces, saving guard, screen-based values, authorized IPC, persisted/live state and storage failures: PASS',
);
