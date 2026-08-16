import { useDiscoverUnreadCount } from '/@/renderer/features/discover/hooks/use-discover-unread';
import { Badge } from '/@/shared/components/badge/badge';

/**
 * Count of unseen items in this week's ListenBrainz playlists, shown next to the Discover
 * nav entry. Renders nothing at all when there is nothing new, when the badge is switched
 * off, or when Discover has no username, so the sidebar stays quiet by default.
 */
export function DiscoverUnreadBadge() {
    const count = useDiscoverUnreadCount();

    if (count === 0) {
        return null;
    }

    return (
        <Badge size="sm" variant="filled">
            {count > 99 ? '99+' : count}
        </Badge>
    );
}
