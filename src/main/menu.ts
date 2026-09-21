import { BrowserWindow, Menu, MenuItemConstructorOptions, shell } from 'electron';

import packageJson from '../../package.json';

import { PlayerRepeat, PlayerStatus } from '/@/shared/types/types';

type Locale = Record<string, unknown>;

const localeModules = import.meta.glob('../i18n/locales/*.json', {
    import: 'default',
}) as Record<string, () => Promise<Locale>>;

const loadLocale = async (language: string): Promise<Locale | undefined> => {
    const loader = localeModules[`../i18n/locales/${language}.json`];
    return loader ? loader() : undefined;
};

export const isMenuLanguage = (language: string): boolean =>
    !!localeModules[`../i18n/locales/${language}.json`];

const getMenuTranslations = async (language = 'en'): Promise<Record<string, string>> => {
    const selectedLanguage = isMenuLanguage(language) ? language : 'en';
    const [english, selected] = await Promise.all([
        loadLocale('en'),
        selectedLanguage === 'en' ? undefined : loadLocale(selectedLanguage),
    ]);

    return {
        ...(english?.nativeMenu as Record<string, string>),
        ...(selected?.nativeMenu as Record<string, string>),
        version: (
            (selected?.nativeMenu as Record<string, string> | undefined)?.version ??
            (english?.nativeMenu as Record<string, string> | undefined)?.version ??
            ''
        ).replace('{{version}}', packageJson.version),
    };
};

const getMenuTranslationKey = (id: string): string | undefined => {
    if (!id.startsWith('menu-')) return undefined;

    const key = id
        .slice('menu-'.length)
        .replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());

    return key.endsWith('Action') ? key.slice(0, -'Action'.length) : key;
};

const applyMenuTranslations = (menu: Menu, translations: Record<string, string>) => {
    for (const item of menu.items) {
        const key = item.id ? getMenuTranslationKey(item.id) : undefined;
        if (key && translations[key]) {
            item.label = translations[key];
        }

        if (item.submenu) {
            applyMenuTranslations(item.submenu, translations);
        }
    }
};

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
    about: 'menu-about',
    aboutAction: 'menu-about-action',
    close: 'menu-close',
    copy: 'menu-copy',
    cut: 'menu-cut',
    edit: 'menu-edit',
    file: 'menu-file',
    help: 'menu-help',
    hide: 'menu-hide',
    hideOthers: 'menu-hide-others',
    next: 'playback-next',
    paste: 'menu-paste',
    pause: 'playback-pause',
    play: 'playback-play',
    previous: 'playback-previous',
    privateMode: 'app-private-mode',
    quit: 'menu-quit',
    redo: 'menu-redo',
    repeat: 'playback-repeat',
    seekBackward: 'playback-seek-backward',
    seekForward: 'playback-seek-forward',
    selectAll: 'menu-select-all',
    services: 'menu-services',
    shuffle: 'playback-shuffle',
    sidebarCollapsed: 'view-sidebar-collapsed',
    stop: 'playback-stop',
    toggleDevTools: 'menu-toggle-dev-tools',
    toggleFullscreen: 'menu-toggle-fullscreen',
    undo: 'menu-undo',
    unhide: 'menu-unhide',
    view: 'menu-view',
    volumeDown: 'playback-volume-down',
    volumeUp: 'playback-volume-up',
    window: 'menu-window',
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
    showMainWindow: () => void;

    constructor(mainWindow: BrowserWindow, showMainWindow: () => void) {
        this.mainWindow = mainWindow;
        this.showMainWindow = showMainWindow;
    }

    buildDarwinTemplate({
        accelerators,
        inputFocused = false,
        playbackStatus = PlayerStatus.PAUSED,
        privateMode = false,
        repeatMode = PlayerRepeat.NONE,
        shuffleEnabled = false,
        sidebarCollapsed = false,
        translations,
    }: MenuPlaybackState & { translations: Record<string, string> }): MenuItemConstructorOptions[] {
        const isPlaying = playbackStatus === PlayerStatus.PLAYING;
        const isRepeatEnabled = repeatMode !== PlayerRepeat.NONE;

        const subMenuAbout: MenuItemConstructorOptions = {
            id: MENU_ITEM_IDS.about,
            label: translations.about,
            submenu: [
                { id: MENU_ITEM_IDS.aboutAction, label: translations.about, role: 'about' },
                { type: 'separator' },
                {
                    accelerator: 'Command+,',
                    click: () => {
                        this.mainWindow.webContents.send('renderer-open-settings');
                    },
                    label: translations.settings,
                },
                { type: 'separator' },
                {
                    click: () => {
                        this.mainWindow.webContents.send('renderer-open-manage-servers');
                    },
                    label: translations.manageServers,
                },
                {
                    checked: privateMode,
                    click: () => {
                        this.mainWindow.webContents.send('renderer-toggle-private-mode');
                    },
                    id: MENU_ITEM_IDS.privateMode,
                    label: translations.privateMode,
                    type: 'checkbox',
                },
                { type: 'separator' },
                { id: MENU_ITEM_IDS.services, label: translations.services, role: 'services' },
                { type: 'separator' },
                { id: MENU_ITEM_IDS.hide, label: translations.hide, role: 'hide' },
                {
                    id: MENU_ITEM_IDS.hideOthers,
                    label: translations.hideOthers,
                    role: 'hideOthers',
                },
                { id: MENU_ITEM_IDS.unhide, label: translations.unhide, role: 'unhide' },
                { type: 'separator' },
                { id: MENU_ITEM_IDS.quit, label: translations.quit, role: 'quit' },
            ],
        };
        const subMenuFile: MenuItemConstructorOptions = {
            id: MENU_ITEM_IDS.file,
            label: translations.file,
            submenu: [
                {
                    click: () => {
                        this.mainWindow.webContents.send('renderer-open-create-playlist');
                    },
                    label: translations.createPlaylist,
                },
                { type: 'separator' },
                { id: MENU_ITEM_IDS.close, label: translations.close, role: 'close' },
            ],
        };
        const subMenuEdit: MenuItemConstructorOptions = {
            id: MENU_ITEM_IDS.edit,
            label: translations.edit,
            submenu: [
                { id: MENU_ITEM_IDS.undo, label: translations.undo, role: 'undo' },
                { id: MENU_ITEM_IDS.redo, label: translations.redo, role: 'redo' },
                { type: 'separator' },
                { id: MENU_ITEM_IDS.cut, label: translations.cut, role: 'cut' },
                { id: MENU_ITEM_IDS.copy, label: translations.copy, role: 'copy' },
                { id: MENU_ITEM_IDS.paste, label: translations.paste, role: 'paste' },
                { id: MENU_ITEM_IDS.selectAll, label: translations.selectAll, role: 'selectAll' },
            ],
        };
        const subMenuView: MenuItemConstructorOptions = {
            id: MENU_ITEM_IDS.view,
            label: translations.view,
            submenu: [
                {
                    accelerator: accelerators?.globalSearch,
                    click: () => {
                        this.mainWindow.webContents.send('renderer-open-command-palette');
                    },
                    label: translations.commandPalette,
                },
                {
                    checked: sidebarCollapsed,
                    click: () => {
                        this.mainWindow.webContents.send('renderer-toggle-sidebar');
                    },
                    id: MENU_ITEM_IDS.sidebarCollapsed,
                    label: translations.sidebar,
                    type: 'checkbox',
                },
                { type: 'separator' },
                {
                    id: MENU_ITEM_IDS.toggleFullscreen,
                    label: translations.toggleFullscreen,
                    role: 'togglefullscreen',
                },
                {
                    label: translations.developer,
                    submenu: [
                        { label: translations.reload, role: 'reload' },
                        {
                            id: MENU_ITEM_IDS.toggleDevTools,
                            label: translations.toggleDevTools,
                            role: 'toggleDevTools',
                        },
                    ],
                },
            ],
        };
        const subMenuWindow: MenuItemConstructorOptions = {
            id: MENU_ITEM_IDS.window,
            label: translations.window,
            role: 'windowMenu',
            submenu: [
                {
                    click: this.showMainWindow,
                    label: translations.showFeishin,
                },
            ],
        };
        const subMenuPlayback: MenuItemConstructorOptions = {
            label: translations.playback,
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
                    label: translations.play,
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
                    label: translations.pause,
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
                    label: translations.next,
                },
                {
                    accelerator: accelerators?.previous,
                    click: () => {
                        this.mainWindow.webContents.send('renderer-player-previous');
                    },
                    enabled: isPlaybackItemEnabled(inputFocused, accelerators?.previous),
                    id: MENU_ITEM_IDS.previous,
                    label: translations.previous,
                },
                {
                    accelerator: accelerators?.seekForward,
                    click: () => {
                        this.mainWindow.webContents.send('renderer-player-skip-forward');
                    },
                    enabled: isPlaybackItemEnabled(inputFocused, accelerators?.seekForward),
                    id: MENU_ITEM_IDS.seekForward,
                    label: translations.seekForward,
                },
                {
                    accelerator: accelerators?.seekBackward,
                    click: () => {
                        this.mainWindow.webContents.send('renderer-player-skip-backward');
                    },
                    enabled: isPlaybackItemEnabled(inputFocused, accelerators?.seekBackward),
                    id: MENU_ITEM_IDS.seekBackward,
                    label: translations.seekBackward,
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
                    label: translations.shuffle,
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
                    label: translations.repeat,
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
                    label: translations.stop,
                },
                { type: 'separator' },
                {
                    accelerator: accelerators?.volumeUp,
                    click: () => {
                        this.mainWindow.webContents.send('renderer-player-volume-up');
                    },
                    enabled: isPlaybackItemEnabled(inputFocused, accelerators?.volumeUp),
                    id: MENU_ITEM_IDS.volumeUp,
                    label: translations.volumeUp,
                },
                {
                    accelerator: accelerators?.volumeDown,
                    click: () => {
                        this.mainWindow.webContents.send('renderer-player-volume-down');
                    },
                    enabled: isPlaybackItemEnabled(inputFocused, accelerators?.volumeDown),
                    id: MENU_ITEM_IDS.volumeDown,
                    label: translations.volumeDown,
                },
            ],
        };
        const subMenuHelp: MenuItemConstructorOptions = {
            id: MENU_ITEM_IDS.help,
            label: translations.help,
            submenu: [
                {
                    click() {
                        shell.openExternal('https://github.com/jeffvli/feishin');
                    },
                    label: translations.learnMore,
                },
                {
                    click() {
                        shell.openExternal(
                            'https://github.com/jeffvli/feishin?tab=readme-ov-file#getting-started',
                        );
                    },
                    label: translations.documentation,
                },
                {
                    click() {
                        shell.openExternal('https://github.com/jeffvli/feishin/discussions');
                    },
                    label: translations.communityDiscussions,
                },
                {
                    click() {
                        shell.openExternal('https://github.com/jeffvli/feishin/issues');
                    },
                    label: translations.searchIssues,
                },
                { type: 'separator' },
                {
                    click: () => {
                        this.mainWindow.webContents.send('renderer-open-release-notes');
                    },
                    label: translations.version,
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

    buildDefaultTemplate(translations: Record<string, string>): MenuItemConstructorOptions[] {
        const templateDefault: MenuItemConstructorOptions[] = [
            {
                id: MENU_ITEM_IDS.file,
                label: translations.file,
                submenu: [
                    {
                        accelerator: 'Ctrl+O',
                        label: translations.open,
                    },
                    {
                        accelerator: 'Ctrl+,',
                        click: () => {
                            this.mainWindow.webContents.send('renderer-open-settings');
                        },
                        label: translations.settings,
                    },
                    { type: 'separator' },
                    {
                        accelerator: 'Ctrl+W',
                        click: () => {
                            this.mainWindow.close();
                        },
                        label: translations.close,
                    },
                ],
            },
            {
                id: MENU_ITEM_IDS.edit,
                label: translations.edit,
                submenu: [
                    { label: translations.undo, role: 'undo' },
                    { label: translations.redo, role: 'redo' },
                    { type: 'separator' },
                    { label: translations.cut, role: 'cut' },
                    { label: translations.copy, role: 'copy' },
                    { label: translations.paste, role: 'paste' },
                    { label: translations.selectAll, role: 'selectAll' },
                ],
            },
            {
                id: MENU_ITEM_IDS.view,
                label: translations.view,
                submenu:
                    process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true'
                        ? [
                              {
                                  accelerator: 'Ctrl+R',
                                  click: () => {
                                      this.mainWindow.webContents.reload();
                                  },
                                  label: translations.reload,
                              },
                              {
                                  accelerator: 'F11',
                                  click: () => {
                                      this.mainWindow.setFullScreen(
                                          !this.mainWindow.isFullScreen(),
                                      );
                                  },
                                  label: translations.toggleFullscreen,
                              },
                              {
                                  accelerator: 'Alt+Ctrl+I',
                                  click: () => {
                                      this.mainWindow.webContents.toggleDevTools();
                                  },
                                  label: translations.toggleDevTools,
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
                                  label: translations.toggleFullscreen,
                              },
                          ],
            },
            {
                id: MENU_ITEM_IDS.window,
                label: translations.window,
                role: 'windowMenu',
                submenu: [{ click: this.showMainWindow, label: translations.showFeishin }],
            },
            {
                id: MENU_ITEM_IDS.help,
                label: translations.help,
                submenu: [
                    {
                        click() {
                            shell.openExternal('https://github.com/jeffvli/feishin');
                        },
                        label: translations.learnMore,
                    },
                    {
                        click() {
                            shell.openExternal(
                                'https://github.com/jeffvli/feishin?tab=readme-ov-file#getting-started',
                            );
                        },
                        label: translations.documentation,
                    },
                    {
                        click() {
                            shell.openExternal('https://github.com/jeffvli/feishin/discussions');
                        },
                        label: translations.communityDiscussions,
                    },
                    {
                        click() {
                            shell.openExternal('https://github.com/jeffvli/feishin/issues');
                        },
                        label: translations.searchIssues,
                    },
                ],
            },
        ];

        return templateDefault;
    }

    async buildMenu(playbackState: MenuPlaybackState = {}, language = 'en'): Promise<Menu> {
        if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
            this.setupDevelopmentEnvironment();
        }

        const translations = await getMenuTranslations(language);
        const template =
            process.platform === 'darwin'
                ? this.buildDarwinTemplate({ ...playbackState, translations })
                : this.buildDefaultTemplate(translations);

        const menu = Menu.buildFromTemplate(template);
        applyMenuTranslations(menu, translations);

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
