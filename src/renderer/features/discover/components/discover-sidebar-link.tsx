import { useTranslation } from 'react-i18next';

import { DiscoverUnreadBadge } from '/@/renderer/features/discover/components/discover-unread-badge';
import { SidebarIcon } from '/@/renderer/features/sidebar/components/sidebar-icon';
import { SidebarItem } from '/@/renderer/features/sidebar/components/sidebar-item';
import { AppRoute } from '/@/renderer/router/routes';
import { useDiscoverSettings } from '/@/renderer/store';
import { Group } from '/@/shared/components/group/group';

interface DiscoverSidebarLinkProps {
    gap?: 'md' | 'sm';
}

/**
 * Discover as a standalone nav row, deliberately outside the My Library accordion: it is
 * ListenBrainz's view of what you might want next, not anything on your server.
 *
 * Because it sits outside that list it has no entry in the sidebar reorder settings, and its
 * visibility follows the Discover settings directly. Enabling Discover and supplying a
 * username is the whole of turning it on.
 */
export function DiscoverSidebarLink({ gap = 'md' }: DiscoverSidebarLinkProps) {
    const { t } = useTranslation();
    const { enabled, username } = useDiscoverSettings();

    if (!enabled || !username) {
        return null;
    }

    return (
        <SidebarItem to={AppRoute.DISCOVER}>
            <Group gap={gap}>
                <SidebarIcon route={AppRoute.DISCOVER} />
                {t('page.sidebar.discover')}
                <DiscoverUnreadBadge />
            </Group>
        </SidebarItem>
    );
}
