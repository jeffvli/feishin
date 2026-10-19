import { useLocation, useNavigate } from 'react-router';

import styles from './mobile-nav.module.css';

import { useGroupPlayStore } from '/@/renderer/features/group-play/store/group-play.store';
import { openRequestWindow } from '/@/renderer/features/hermes-request/components/request-button';
import { openFeedback } from '/@/renderer/features/sour/components/feedback';
import { openPeople } from '/@/renderer/features/sour/components/people';
import { AppRoute } from '/@/renderer/router/routes';
import { Icon } from '/@/shared/components/icon/icon';

const openGroupPlay = () => useGroupPlayStore.setState({ panelOpen: true });

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
            icon: 'house',
            label: 'Home',
            onClick: () => navigate(AppRoute.HOME),
        },
        { icon: 'groupPlay', label: 'Group', onClick: openGroupPlay },
        { icon: 'user', label: 'People', onClick: openPeople },
        { icon: 'download', label: 'Request', onClick: openRequestWindow },
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
