import { generatePath, useLocation, useNavigate } from 'react-router';

import styles from './mobile-nav.module.css';

import { openRequestWindow } from '/@/renderer/features/hermes-request/components/request-button';
import { openFeedback } from '/@/renderer/features/sour/components/feedback';
import { toggleStage } from '/@/renderer/features/sour/stage/sour-stage';
import { AppRoute } from '/@/renderer/router/routes';
import { Icon } from '/@/shared/components/icon/icon';
import { LibraryItem } from '/@/shared/types/domain-types';

// Phones: the bar under the player with the menu and Sour Player's main things, one tap each
export const MobileNav = ({ onMenu }: { onMenu: () => void }) => {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const items: {
        active?: boolean;
        icon: Parameters<typeof Icon>[0]['icon'];
        label: string;
        onClick: () => void;
    }[] = [
        { icon: 'menu', label: 'Menu', onClick: onMenu },
        {
            active: pathname === AppRoute.HOME,
            icon: 'library',
            label: 'Home',
            onClick: () => navigate(AppRoute.HOME),
        },
        {
            active: pathname.startsWith('/search'),
            icon: 'search',
            label: 'Search',
            onClick: () => navigate(generatePath(AppRoute.SEARCH, { itemType: LibraryItem.SONG })),
        },
        { icon: 'download', label: 'Request', onClick: openRequestWindow },
        { icon: 'sparkles', label: 'Stage', onClick: () => toggleStage(true) },
        { icon: 'messageCircle', label: 'Report', onClick: openFeedback },
    ];
    return (
        <nav className={styles.nav}>
            {items.map((item) => (
                <button
                    className={item.active ? styles.active : styles.item}
                    key={item.label}
                    onClick={item.onClick}
                    type="button"
                >
                    <Icon icon={item.icon} size="lg" />
                    <span>{item.label}</span>
                </button>
            ))}
        </nav>
    );
};
