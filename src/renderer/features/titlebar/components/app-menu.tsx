import isElectron from 'is-electron';
import { Fragment, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';

import packageJson from '../../../../../package.json';

import { ServerSelectorItems } from '/@/renderer/features/sidebar/components/server-selector-items';
import { AppRoute } from '/@/renderer/router/routes';
import { useAppStore, useAppStoreActions, useSidebarStore } from '/@/renderer/store';
import { DropdownMenu, MenuItemProps } from '/@/shared/components/dropdown-menu/dropdown-menu';
import { Icon } from '/@/shared/components/icon/icon';
import { toast } from '/@/shared/components/toast/toast';

const browser = isElectron() ? window.api.browser : null;

interface BaseMenuItem {
    id: string;
    type: 'conditional-group' | 'conditional-item' | 'custom' | 'divider' | 'item';
}

interface ConditionalGroupItem extends BaseMenuItem {
    condition: boolean;
    items: MenuItem[];
    type: 'conditional-group';
}

interface ConditionalItem extends BaseMenuItem {
    condition: boolean;
    item: Omit<MenuItem, 'id' | 'type'>;
    type: 'conditional-item';
}

interface CustomItem extends BaseMenuItem {
    component: ReactNode;
    type: 'custom';
}

interface DividerItem extends BaseMenuItem {
    type: 'divider';
}

type MenuItem = ConditionalGroupItem | ConditionalItem | CustomItem | DividerItem | RegularMenuItem;

interface RegularMenuItem extends BaseMenuItem {
    component?: 'a' | typeof Link;
    href?: string;
    icon?: keyof typeof import('/@/shared/components/icon/icon').AppIcon;
    iconColor?:
        | 'contrast'
        | 'default'
        | 'error'
        | 'info'
        | 'inherit'
        | 'muted'
        | 'primary'
        | 'success'
        | 'warn';
    label: string;
    leftSection?: ReactNode;
    onClick?: () => void;
    rightSection?: ReactNode;
    target?: string;
    to?: string;
    type: 'item';
}

export const AppMenu = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { collapsed } = useSidebarStore();
    const { privateMode } = useAppStore();
    const { setPrivateMode, setSideBar } = useAppStoreActions();

    const handleBrowserDevTools = () => {
        browser?.devtools();
    };

    const handleCollapseSidebar = () => {
        setSideBar({ collapsed: true });
    };

    const handleExpandSidebar = () => {
        setSideBar({ collapsed: false });
    };

    const handlePrivateModeOff = () => {
        setPrivateMode(false);
        toast.info({
            message: t('form.privateMode.disabled', { postProcess: 'sentenceCase' }),
            title: t('form.privateMode.title', { postProcess: 'sentenceCase' }),
        });
    };

    const handlePrivateModeOn = () => {
        setPrivateMode(true);
        toast.info({
            message: t('form.privateMode.enabled', { postProcess: 'sentenceCase' }),
            title: t('form.privateMode.title', { postProcess: 'sentenceCase' }),
        });
    };

    const handleQuit = () => {
        browser?.quit();
    };

    const menuConfig: MenuItem[] = [
        {
            condition: privateMode,
            id: 'private-mode-off',
            item: {
                icon: 'lock',
                iconColor: 'error',
                label: t('page.appMenu.privateModeOff', { postProcess: 'sentenceCase' }),
                onClick: handlePrivateModeOff,
                type: 'item',
            },
            type: 'conditional-item',
        },
        {
            condition: !privateMode,
            id: 'private-mode-on',
            item: {
                icon: 'lockOpen',
                label: t('page.appMenu.privateModeOn', { postProcess: 'sentenceCase' }),
                onClick: handlePrivateModeOn,
                type: 'item',
            },
            type: 'conditional-item',
        },
        {
            id: 'divider-1',
            type: 'divider',
        },
        {
            condition: collapsed,
            id: 'navigation-group',
            items: [
                {
                    icon: 'arrowLeftS',
                    id: 'go-back',
                    label: t('page.appMenu.goBack', { postProcess: 'sentenceCase' }),
                    onClick: () => navigate(-1),
                    type: 'item',
                },
                {
                    icon: 'arrowRightS',
                    id: 'go-forward',
                    label: t('page.appMenu.goForward', { postProcess: 'sentenceCase' }),
                    onClick: () => navigate(1),
                    type: 'item',
                },
            ],
            type: 'conditional-group',
        },
        {
            condition: collapsed,
            id: 'sidebar-expand',
            item: {
                icon: 'panelRightOpen',
                id: 'expand-sidebar',
                label: t('page.appMenu.expandSidebar', { postProcess: 'sentenceCase' }),
                onClick: handleExpandSidebar,
                type: 'item',
            },
            type: 'conditional-item',
        },
        {
            condition: !collapsed,
            id: 'sidebar-collapse',
            item: {
                icon: 'panelRightClose',
                id: 'collapse-sidebar',
                label: t('page.appMenu.collapseSidebar', { postProcess: 'sentenceCase' }),
                onClick: handleCollapseSidebar,
                type: 'item',
            },
            type: 'conditional-item',
        },
        {
            id: 'divider-2',
            type: 'divider',
        },
        {
            component: Link,
            icon: 'settings',
            id: 'settings',
            label: t('page.appMenu.settings', { postProcess: 'sentenceCase' }),
            to: AppRoute.SETTINGS,
            type: 'item',
        },
        {
            id: 'divider-3',
            type: 'divider',
        },
        {
            component: <ServerSelectorItems />,
            id: 'server-selector',
            type: 'custom',
        },
        {
            id: 'divider-4',
            type: 'divider',
        },
        {
            component: 'a',
            href: 'https://github.com/jeffvli/feishin/releases',
            icon: 'brandGitHub',
            id: 'version',
            label: t('page.appMenu.version', {
                postProcess: 'sentenceCase',
                version: packageJson.version,
            }),
            rightSection: <Icon icon="externalLink" />,
            target: '_blank',
            type: 'item',
        },
        {
            condition: isElectron(),
            id: 'devtools',
            item: {
                icon: 'appWindow',
                id: 'open-devtools',
                label: t('page.appMenu.openBrowserDevtools', { postProcess: 'sentenceCase' }),
                onClick: handleBrowserDevTools,
                type: 'item',
            },
            type: 'conditional-item',
        },
        {
            condition: isElectron(),
            id: 'quit',
            item: {
                icon: 'x',
                id: 'quit-app',
                label: t('page.appMenu.quit', { postProcess: 'sentenceCase' }),
                onClick: handleQuit,
                type: 'item',
            },
            type: 'conditional-item',
        },
    ];

    const renderMenuItem = (item: MenuItem): ReactNode => {
        switch (item.type) {
            case 'conditional-group':
                if (!item.condition) return null;
                return (
                    <div key={item.id}>
                        {item.items.map((subItem) => {
                            return <Fragment key={subItem.id}>{renderMenuItem(subItem)}</Fragment>;
                        })}
                    </div>
                );

            case 'conditional-item':
                if (!item.condition) return null;
                return <Fragment key={item.id}>{renderMenuItem(item.item as MenuItem)}</Fragment>;

            case 'custom':
                return <div key={item.id}>{item.component}</div>;

            case 'divider':
                return <DropdownMenu.Divider key={item.id} />;

            case 'item': {
                const leftSection =
                    item.leftSection ||
                    (item.icon && <Icon color={item.iconColor} icon={item.icon} />);

                const props = {
                    leftSection,
                    ...(item.rightSection && { rightSection: item.rightSection }),
                    ...(item.onClick && { onClick: item.onClick }),
                    ...(item.component && { component: item.component }),
                    ...(item.to && { to: item.to }),
                    ...(item.href && { href: item.href }),
                    ...(item.target && { target: item.target }),
                } as MenuItemProps;

                return (
                    <DropdownMenu.Item key={item.id} {...props}>
                        {item.label}
                    </DropdownMenu.Item>
                );
            }

            default:
                return null;
        }
    };

    return <>{menuConfig.map((item) => renderMenuItem(item))}</>;
};
