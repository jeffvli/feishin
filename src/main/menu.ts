import { app, BrowserWindow, Menu, MenuItemConstructorOptions, shell } from 'electron';

import packageJson from '../../package.json';

import { PlayerRepeat, PlayerStatus } from '/@/shared/types/types';

export type MenuPlaybackState = {
    accelerators?: {
        next?: string;
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
    playbackStatus?: PlayerStatus;
    privateMode?: boolean;
    repeatMode?: PlayerRepeat;
    shuffleEnabled?: boolean;
    sidebarCollapsed?: boolean;
};

interface DarwinMenuItemConstructorOptions extends MenuItemConstructorOptions {
    selector?: string;
    submenu?: DarwinMenuItemConstructorOptions[] | Menu;
}

export default class MenuBuilder {
    developmentEnvironmentSetup = false;
    mainWindow: BrowserWindow;

    constructor(mainWindow: BrowserWindow) {
        this.mainWindow = mainWindow;
    }

    buildDarwinTemplate({
        accelerators,
        playbackStatus = PlayerStatus.PAUSED,
        privateMode = false,
        repeatMode = PlayerRepeat.NONE,
        shuffleEnabled = false,
        sidebarCollapsed = false,
    }: MenuPlaybackState = {}): MenuItemConstructorOptions[] {
        const isPlaying = playbackStatus === PlayerStatus.PLAYING;
        const isRepeatEnabled = repeatMode !== PlayerRepeat.NONE;

        const subMenuAbout: DarwinMenuItemConstructorOptions = {
            label: 'Electron',
            submenu: [
                {
                    label: 'About Feishin',
                    selector: 'orderFrontStandardAboutPanel:',
                },
                { type: 'separator' },
                {
                    accelerator: 'Command+,',
                    click: () => {
                        this.mainWindow.webContents.send('renderer-open-settings');
                    },
                    label: 'Settings',
                },
                { type: 'separator' },
                {
                    click: () => {
                        this.mainWindow.webContents.send('renderer-open-manage-servers');
                    },
                    label: 'Manage servers',
                },
                {
                    checked: privateMode,
                    click: () => {
                        this.mainWindow.webContents.send('renderer-toggle-private-mode');
                    },
                    label: 'Private session',
                    type: 'checkbox',
                },
                { type: 'separator' },
                { label: 'Services', submenu: [] },
                { type: 'separator' },
                {
                    accelerator: 'Command+H',
                    label: 'Hide Feishin',
                    selector: 'hide:',
                },
                {
                    accelerator: 'Command+Shift+H',
                    label: 'Hide Others',
                    selector: 'hideOtherApplications:',
                },
                { label: 'Show All', selector: 'unhideAllApplications:' },
                { type: 'separator' },
                {
                    accelerator: 'Command+Q',
                    click: () => {
                        app.quit();
                    },
                    label: 'Quit',
                },
            ],
        };
        const subMenuEdit: DarwinMenuItemConstructorOptions = {
            label: 'Edit',
            submenu: [
                { accelerator: 'Command+Z', label: 'Undo', selector: 'undo:' },
                { accelerator: 'Shift+Command+Z', label: 'Redo', selector: 'redo:' },
                { type: 'separator' },
                { accelerator: 'Command+X', label: 'Cut', selector: 'cut:' },
                { accelerator: 'Command+C', label: 'Copy', selector: 'copy:' },
                { accelerator: 'Command+V', label: 'Paste', selector: 'paste:' },
                {
                    accelerator: 'Command+A',
                    label: 'Select All',
                    selector: 'selectAll:',
                },
            ],
        };
        const subMenuViewDev: MenuItemConstructorOptions = {
            label: 'View',
            submenu: [
                {
                    accelerator: 'Command+K',
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
                    label: 'Collapse sidebar',
                    type: 'checkbox',
                },
                { type: 'separator' },
                {
                    accelerator: 'Command+R',
                    click: () => {
                        this.mainWindow.webContents.reload();
                    },
                    label: 'Reload',
                },
                {
                    accelerator: 'Ctrl+Command+F',
                    click: () => {
                        this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
                    },
                    label: 'Toggle Full Screen',
                },
                {
                    accelerator: 'Alt+Command+I',
                    click: () => {
                        this.mainWindow.webContents.toggleDevTools();
                    },
                    label: 'Toggle Developer Tools',
                },
            ],
        };
        const subMenuViewProd: MenuItemConstructorOptions = {
            label: 'View',
            submenu: [
                {
                    accelerator: 'Command+K',
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
                    label: 'Collapse sidebar',
                    type: 'checkbox',
                },
                { type: 'separator' },
                {
                    accelerator: 'Ctrl+Command+F',
                    click: () => {
                        this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
                    },
                    label: 'Toggle Full Screen',
                },
            ],
        };
        const subMenuWindow: DarwinMenuItemConstructorOptions = {
            label: 'Window',
            submenu: [
                {
                    accelerator: 'Command+M',
                    label: 'Minimize',
                    selector: 'performMiniaturize:',
                },
                { accelerator: 'Command+W', label: 'Close', selector: 'performClose:' },
                { type: 'separator' },
                { label: 'Bring All to Front', selector: 'arrangeInFront:' },
            ],
        };
        const subMenuPlayback: MenuItemConstructorOptions = {
            label: 'Playback',
            submenu: [
                {
                    accelerator: accelerators?.playPause,
                    click: () => {
                        this.mainWindow.webContents.send('renderer-player-play-pause');
                    },
                    label: isPlaying ? 'Pause' : 'Play',
                },
                { type: 'separator' },
                {
                    accelerator: accelerators?.next,
                    click: () => {
                        this.mainWindow.webContents.send('renderer-player-next');
                    },
                    label: 'Next',
                },
                {
                    accelerator: accelerators?.previous,
                    click: () => {
                        this.mainWindow.webContents.send('renderer-player-previous');
                    },
                    label: 'Previous',
                },
                {
                    accelerator: accelerators?.seekForward,
                    click: () => {
                        this.mainWindow.webContents.send('renderer-player-skip-forward');
                    },
                    label: 'Seek Forward',
                },
                {
                    accelerator: accelerators?.seekBackward,
                    click: () => {
                        this.mainWindow.webContents.send('renderer-player-skip-backward');
                    },
                    label: 'Seek Backforward',
                },
                { type: 'separator' },
                {
                    accelerator: accelerators?.shuffle,
                    checked: shuffleEnabled,
                    click: () => {
                        this.mainWindow.webContents.send('renderer-player-toggle-shuffle');
                    },
                    label: 'Shuffle',
                    type: 'checkbox',
                },
                {
                    accelerator: accelerators?.repeat,
                    checked: isRepeatEnabled,
                    click: () => {
                        this.mainWindow.webContents.send('renderer-player-toggle-repeat');
                    },
                    label: 'Repeat',
                    type: 'checkbox',
                },
                { type: 'separator' },
                {
                    accelerator: accelerators?.stop,
                    click: () => {
                        this.mainWindow.webContents.send('renderer-player-stop');
                    },
                    label: 'Stop',
                },
                { type: 'separator' },
                {
                    accelerator: accelerators?.volumeUp,
                    click: () => {
                        this.mainWindow.webContents.send('renderer-player-volume-up');
                    },
                    label: 'Volume Up',
                },
                {
                    accelerator: accelerators?.volumeDown,
                    click: () => {
                        this.mainWindow.webContents.send('renderer-player-volume-down');
                    },
                    label: 'Volume Down',
                },
            ],
        };
        const subMenuHelp: MenuItemConstructorOptions = {
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
                { type: 'separator' },
                {
                    click: () => {
                        this.mainWindow.webContents.send('renderer-open-release-notes');
                    },
                    label: 'Version ' + packageJson.version,
                },
            ],
        };

        const subMenuView =
            process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true'
                ? subMenuViewDev
                : subMenuViewProd;

        return [
            subMenuAbout,
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
}
