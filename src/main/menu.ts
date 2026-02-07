import { app, BrowserWindow, Menu, MenuItemConstructorOptions, shell } from 'electron';

import packageJson from '../../package.json';

interface DarwinMenuItemConstructorOptions extends MenuItemConstructorOptions {
    selector?: string;
    submenu?: DarwinMenuItemConstructorOptions[] | Menu;
}

export default class MenuBuilder {
    mainWindow: BrowserWindow;

    constructor(mainWindow: BrowserWindow) {
        this.mainWindow = mainWindow;
    }

    buildDarwinTemplate(
        privateMode: boolean,
        collapsedSidebar: boolean,
    ): MenuItemConstructorOptions[] {
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
                    label: 'Command Palette…',
                },
                {
                    checked: collapsedSidebar,
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

        return [subMenuAbout, subMenuEdit, subMenuView, subMenuWindow, subMenuHelp];
    }

    buildDefaultTemplate(
        privateMode: boolean = false,
        collapsedSidebar: boolean = false,
    ): MenuItemConstructorOptions[] {
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
                    {
                        checked: privateMode,
                        click: () => {
                            this.mainWindow.webContents.send('renderer-toggle-private-mode');
                        },
                        label: 'Private &session',
                        type: 'checkbox',
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
                                  checked: collapsedSidebar,
                                  click: () => {
                                      this.mainWindow.webContents.send('renderer-toggle-sidebar');
                                  },
                                  label: 'Collapse &Sidebar',
                                  type: 'checkbox',
                              },
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
                                  checked: collapsedSidebar,
                                  click: () => {
                                      this.mainWindow.webContents.send('renderer-toggle-sidebar');
                                  },
                                  label: 'Collapse &Sidebar',
                                  type: 'checkbox',
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

    buildMenu(privateMode: boolean = false, collapsedSidebar: boolean = false): Menu {
        if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
            this.setupDevelopmentEnvironment();
        }

        const template =
            process.platform === 'darwin'
                ? this.buildDarwinTemplate(privateMode, collapsedSidebar)
                : this.buildDefaultTemplate(privateMode, collapsedSidebar);

        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);

        return menu;
    }

    setupDevelopmentEnvironment(): void {
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
