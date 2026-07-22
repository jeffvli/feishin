import { BrowserWindow, Menu, MenuItemConstructorOptions, shell } from 'electron';

import packageJson from '../../package.json';

import { PlayerRepeat, PlayerStatus } from '/@/shared/types/types';

export type MenuPlaybackState = {
    accelerators?: {
        globalSearch?: string;
        next?: string;
        pause?: string;
        play?: string;
        playPause?: string;
        previous?: string;
        repeat?: string;
        seekBackward?: string;
        seekForward?: string;
        shuffle?: string;
        stop?: string;
        volumeDown?: string;
        volumeUp?: string;
    };
    inputFocused?: boolean;
    playbackStatus?: PlayerStatus;
    privateMode?: boolean;
    repeatMode?: PlayerRepeat;
    shuffleEnabled?: boolean;
    sidebarCollapsed?: boolean;
};

const MENU_ITEM_IDS = {
    next: 'playback-next',
    pause: 'playback-pause',
    play: 'playback-play',
    previous: 'playback-previous',
    privateMode: 'app-private-mode',
    repeat: 'playback-repeat',
    seekBackward: 'playback-seek-backward',
    seekForward: 'playback-seek-forward',
    shuffle: 'playback-shuffle',
    sidebarCollapsed: 'view-sidebar-collapsed',
    stop: 'playback-stop',
    volumeDown: 'playback-volume-down',
    volumeUp: 'playback-volume-up',
} as const;

const NON_TYPING_MODIFIERS = new Set([
    'alt',
    'cmd',
    'command',
    'commandorcontrol',
    'control',
    'ctrl',
    'meta',
    'option',
    'super',
]);

const hasTypingSensitiveAccelerator = (accelerator?: string): boolean => {
    if (!accelerator) return false;

    const parts = accelerator.toLowerCase().split('+');
    const key = parts.at(-1) || '';

    if (/^f(?:[1-9]|1\d|2[0-4])$/.test(key) || /^(?:media|volume)/.test(key)) {
        return false;
    }

    return !parts.some((part) => NON_TYPING_MODIFIERS.has(part));
};

const isPlaybackItemEnabled = (inputFocused: boolean, accelerator?: string): boolean => {
    return !inputFocused || !hasTypingSensitiveAccelerator(accelerator);
};

export default class MenuBuilder {
    applicationMenu: Menu | null = null;
    developmentEnvironmentSetup = false;
    mainWindow: BrowserWindow;

    constructor(mainWindow: BrowserWindow) {
        this.mainWindow = mainWindow;
    }

    buildDarwinTemplate({
        accelerators,
        inputFocused = false,
        playbackStatus = PlayerStatus.PAUSED,
        privateMode = false,
        repeatMode = PlayerRepeat.NONE,
        shuffleEnabled = false,
        sidebarCollapsed = false,
    }: MenuPlaybackState = {}): MenuItemConstructorOptions[] {
        const isPlaying = playbackStatus === PlayerStatus.PLAYING;
        const isRepeatEnabled = repeatMode !== PlayerRepeat.NONE;

        const subMenuAbout: MenuItemConstructorOptions = {
            label: 'Electron',
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                {
                    accelerator: 'Command+,',
                    click: () => {
                        this.mainWindow.webContents.send('renderer-open-settings');
                    },
                    label: 'Settings...',
                },
                { type: 'separator' },
                {
                    click: () => {
                        this.mainWindow.webContents.send('renderer-open-manage-servers');
                    },
                    label: 'Manage Servers...',
                },
                {
                    checked: privateMode,
                    click: () => {
                        this.mainWindow.webContents.send('renderer-toggle-private-mode');
                    },
                    id: MENU_ITEM_IDS.privateMode,
                    label: 'Private Session',
                    type: 'checkbox',
                },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' },
            ],
        };
        const subMenuFile: MenuItemConstructorOptions = {
            label: 'File',
            submenu: [
                {
                    click: () => {
                        this.mainWindow.webContents.send('renderer-open-create-playlist');
                    },
                    label: 'Create Playlist...',
                },
                { type: 'separator' },
                { role: 'close' },
            ],
        };
        const subMenuEdit: MenuItemConstructorOptions = { role: 'editMenu' };
        const subMenuView: MenuItemConstructorOptions = {
            label: 'View',
            submenu: [
                {
                    accelerator: accelerators?.globalSearch,
                    click: () => {
                        this.mainWindow.webContents.send('renderer-open-command-palette');
                    },
                    label: 'Command Palette...',
                },
                {
                    checked: sidebarCollapsed,
                    click: () => {
                        this.mainWindow.webContents.send('renderer-toggle-sidebar');
                    },
                    id: MENU_ITEM_IDS.sidebarCollapsed,
                    label: 'Collapse Sidebar',
                    type: 'checkbox',
                },
                { type: 'separator' },
                { role: 'togglefullscreen' },
                {
                    label: 'Developer',
                    submenu: [{ role: 'reload' }, { role: 'toggleDevTools' }],
                },
            ],
        };
        const subMenuWindow: MenuItemConstructorOptions = { role: 'windowMenu' };
        const subMenuPlayback: MenuItemConstructorOptions = {
            label: 'Playback',
            submenu: [
                {
                    accelerator: accelerators?.play || accelerators?.playPause,
                    click: () => {
                        this.mainWindow.webContents.send('renderer-player-play');
                    },
                    enabled: isPlaybackItemEnabled(
                        inputFocused,
                        accelerators?.play || accelerators?.playPause,
                    ),
                    id: MENU_ITEM_IDS.play,
                    label: 'Play',
                    visible: !isPlaying,
                },
                {
                    accelerator: accelerators?.pause || accelerators?.playPause,
                    click: () => {
                        this.mainWindow.webContents.send('renderer-player-pause');
                    },
                    enabled: isPlaybackItemEnabled(
                        inputFocused,
                        accelerators?.pause || accelerators?.playPause,
                    ),
                    id: MENU_ITEM_IDS.pause,
                    label: 'Pause',
                    visible: isPlaying,
                },
                { type: 'separator' },
                {
                    accelerator: accelerators?.next,
                    click: () => {
                        this.mainWindow.webContents.send('renderer-player-next');
                    },
                    enabled: isPlaybackItemEnabled(inputFocused, accelerators?.next),
                    id: MENU_ITEM_IDS.next,
                    label: 'Next',
                },
                {
                    accelerator: accelerators?.previous,
                    click: () => {
                        this.mainWindow.webContents.send('renderer-player-previous');
                    },
                    enabled: isPlaybackItemEnabled(inputFocused, accelerators?.previous),
                    id: MENU_ITEM_IDS.previous,
                    label: 'Previous',
                },
                {
                    accelerator: accelerators?.seekForward,
                    click: () => {
                        this.mainWindow.webContents.send('renderer-player-skip-forward');
                    },
                    enabled: isPlaybackItemEnabled(inputFocused, accelerators?.seekForward),
                    id: MENU_ITEM_IDS.seekForward,
                    label: 'Seek Forward',
                },
                {
                    accelerator: accelerators?.seekBackward,
                    click: () => {
                        this.mainWindow.webContents.send('renderer-player-skip-backward');
                    },
                    enabled: isPlaybackItemEnabled(inputFocused, accelerators?.seekBackward),
                    id: MENU_ITEM_IDS.seekBackward,
                    label: 'Seek Backforward',
                },
                { type: 'separator' },
                {
                    accelerator: accelerators?.shuffle,
                    checked: shuffleEnabled,
                    click: () => {
                        this.mainWindow.webContents.send('renderer-player-toggle-shuffle');
                    },
                    enabled: isPlaybackItemEnabled(inputFocused, accelerators?.shuffle),
                    id: MENU_ITEM_IDS.shuffle,
                    label: 'Shuffle',
                    type: 'checkbox',
                },
                {
                    accelerator: accelerators?.repeat,
                    checked: isRepeatEnabled,
                    click: () => {
                        this.mainWindow.webContents.send('renderer-player-toggle-repeat');
                    },
                    enabled: isPlaybackItemEnabled(inputFocused, accelerators?.repeat),
                    id: MENU_ITEM_IDS.repeat,
                    label: 'Repeat',
                    type: 'checkbox',
                },
                { type: 'separator' },
                {
                    accelerator: accelerators?.stop,
                    click: () => {
                        this.mainWindow.webContents.send('renderer-player-stop');
                    },
                    enabled: isPlaybackItemEnabled(inputFocused, accelerators?.stop),
                    id: MENU_ITEM_IDS.stop,
                    label: 'Stop',
                },
                { type: 'separator' },
                {
                    accelerator: accelerators?.volumeUp,
                    click: () => {
                        this.mainWindow.webContents.send('renderer-player-volume-up');
                    },
                    enabled: isPlaybackItemEnabled(inputFocused, accelerators?.volumeUp),
                    id: MENU_ITEM_IDS.volumeUp,
                    label: 'Volume Up',
                },
                {
                    accelerator: accelerators?.volumeDown,
                    click: () => {
                        this.mainWindow.webContents.send('renderer-player-volume-down');
                    },
                    enabled: isPlaybackItemEnabled(inputFocused, accelerators?.volumeDown),
                    id: MENU_ITEM_IDS.volumeDown,
                    label: 'Volume Down',
                },
            ],
        };
        const subMenuHelp: MenuItemConstructorOptions = {
            role: 'help',
            submenu: [
                {
                    click() {
                        shell.openExternal('https://github.com/jeffvli/feishin');
                    },
                    label: 'Learn More',
                },
                {
                    click() {
                        shell.openExternal(
                            'https://github.com/jeffvli/feishin?tab=readme-ov-file#getting-started',
                        );
                    },
                    label: 'Documentation',
                },
                {
                    click() {
                        shell.openExternal('https://github.com/jeffvli/feishin/discussions');
                    },
                    label: 'Community Discussions',
                },
                {
                    click() {
                        shell.openExternal('https://github.com/jeffvli/feishin/issues');
                    },
                    label: 'Search Issues',
                },
                { type: 'separator' },
                {
                    click: () => {
                        this.mainWindow.webContents.send('renderer-open-release-notes');
                    },
                    label: 'Version ' + packageJson.version,
                },
            ],
        };

        return [
            subMenuAbout,
            subMenuFile,
            subMenuEdit,
            subMenuView,
            subMenuPlayback,
            subMenuWindow,
            subMenuHelp,
        ];
    }

    buildDefaultTemplate(): MenuItemConstructorOptions[] {
        const templateDefault: MenuItemConstructorOptions[] = [
            {
                label: '&File',
                submenu: [
                    {
                        accelerator: 'Ctrl+O',
                        label: '&Open',
                    },
                    {
                        accelerator: 'Ctrl+,',
                        click: () => {
                            this.mainWindow.webContents.send('renderer-open-settings');
                        },
                        label: '&Settings...',
                    },
                    { type: 'separator' },
                    {
                        accelerator: 'Ctrl+W',
                        click: () => {
                            this.mainWindow.close();
                        },
                        label: '&Close',
                    },
                ],
            },
            {
                label: '&View',
                submenu:
                    process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true'
                        ? [
                              {
                                  accelerator: 'Ctrl+R',
                                  click: () => {
                                      this.mainWindow.webContents.reload();
                                  },
                                  label: '&Reload',
                              },
                              {
                                  accelerator: 'F11',
                                  click: () => {
                                      this.mainWindow.setFullScreen(
                                          !this.mainWindow.isFullScreen(),
                                      );
                                  },
                                  label: 'Toggle &Full Screen',
                              },
                              {
                                  accelerator: 'Alt+Ctrl+I',
                                  click: () => {
                                      this.mainWindow.webContents.toggleDevTools();
                                  },
                                  label: 'Toggle &Developer Tools',
                              },
                          ]
                        : [
                              {
                                  accelerator: 'F11',
                                  click: () => {
                                      this.mainWindow.setFullScreen(
                                          !this.mainWindow.isFullScreen(),
                                      );
                                  },
                                  label: 'Toggle &Full Screen',
                              },
                          ],
            },
            {
                label: 'Help',
                submenu: [
                    {
                        click() {
                            shell.openExternal('https://github.com/jeffvli/feishin');
                        },
                        label: 'Learn More',
                    },
                    {
                        click() {
                            shell.openExternal(
                                'https://github.com/jeffvli/feishin?tab=readme-ov-file#getting-started',
                            );
                        },
                        label: 'Documentation',
                    },
                    {
                        click() {
                            shell.openExternal('https://github.com/jeffvli/feishin/discussions');
                        },
                        label: 'Community Discussions',
                    },
                    {
                        click() {
                            shell.openExternal('https://github.com/jeffvli/feishin/issues');
                        },
                        label: 'Search Issues',
                    },
                ],
            },
        ];

        return templateDefault;
    }

    buildMenu(playbackState: MenuPlaybackState = {}): Menu {
        if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
            this.setupDevelopmentEnvironment();
        }

        const template =
            process.platform === 'darwin'
                ? this.buildDarwinTemplate(playbackState)
                : this.buildDefaultTemplate();

        const menu = Menu.buildFromTemplate(template);
        this.applicationMenu = menu;
        Menu.setApplicationMenu(menu);

        return menu;
    }

    setupDevelopmentEnvironment(): void {
        // buildMenu can run multiple times as menu state updates; attach this once.
        if (this.developmentEnvironmentSetup) {
            return;
        }

        this.developmentEnvironmentSetup = true;

        this.mainWindow.webContents.on('context-menu', (_, props) => {
            const { x, y } = props;

            Menu.buildFromTemplate([
                {
                    click: () => {
                        this.mainWindow.webContents.inspectElement(x, y);
                    },
                    label: 'Inspect element',
                },
            ]).popup({ window: this.mainWindow });
        });
    }

    updateMenu({
        accelerators,
        inputFocused = false,
        playbackStatus = PlayerStatus.PAUSED,
        privateMode = false,
        repeatMode = PlayerRepeat.NONE,
        shuffleEnabled = false,
        sidebarCollapsed = false,
    }: MenuPlaybackState = {}): void {
        if (process.platform !== 'darwin' || !this.applicationMenu) {
            return;
        }

        const privateModeItem = this.applicationMenu.getMenuItemById(MENU_ITEM_IDS.privateMode);
        const sidebarItem = this.applicationMenu.getMenuItemById(MENU_ITEM_IDS.sidebarCollapsed);
        const pauseItem = this.applicationMenu.getMenuItemById(MENU_ITEM_IDS.pause);
        const playItem = this.applicationMenu.getMenuItemById(MENU_ITEM_IDS.play);
        const repeatItem = this.applicationMenu.getMenuItemById(MENU_ITEM_IDS.repeat);
        const shuffleItem = this.applicationMenu.getMenuItemById(MENU_ITEM_IDS.shuffle);

        if (privateModeItem) privateModeItem.checked = privateMode;
        if (sidebarItem) sidebarItem.checked = sidebarCollapsed;
        if (pauseItem) pauseItem.visible = playbackStatus === PlayerStatus.PLAYING;
        if (playItem) playItem.visible = playbackStatus !== PlayerStatus.PLAYING;
        if (repeatItem) repeatItem.checked = repeatMode !== PlayerRepeat.NONE;
        if (shuffleItem) shuffleItem.checked = shuffleEnabled;

        const playbackAccelerators = [
            [MENU_ITEM_IDS.play, accelerators?.play || accelerators?.playPause],
            [MENU_ITEM_IDS.pause, accelerators?.pause || accelerators?.playPause],
            [MENU_ITEM_IDS.next, accelerators?.next],
            [MENU_ITEM_IDS.previous, accelerators?.previous],
            [MENU_ITEM_IDS.seekForward, accelerators?.seekForward],
            [MENU_ITEM_IDS.seekBackward, accelerators?.seekBackward],
            [MENU_ITEM_IDS.shuffle, accelerators?.shuffle],
            [MENU_ITEM_IDS.repeat, accelerators?.repeat],
            [MENU_ITEM_IDS.stop, accelerators?.stop],
            [MENU_ITEM_IDS.volumeUp, accelerators?.volumeUp],
            [MENU_ITEM_IDS.volumeDown, accelerators?.volumeDown],
        ] as const;

        for (const [id, accelerator] of playbackAccelerators) {
            const item = this.applicationMenu.getMenuItemById(id);
            if (item) item.enabled = isPlaybackItemEnabled(inputFocused, accelerator);
        }
    }
}
