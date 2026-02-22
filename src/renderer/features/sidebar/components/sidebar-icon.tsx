import {
    RiAlbumFill,
    RiAlbumLine,
    RiFlag2Fill,
    RiFlag2Line,
    RiFolder3Fill,
    RiFolder3Line,
    RiHeartFill,
    RiHeartLine,
    RiHome6Fill,
    RiHome6Line,
    RiMusic2Fill,
    RiMusic2Line,
    RiPlayFill,
    RiPlayLine,
    RiPlayListFill,
    RiPlayListLine,
    RiRadioFill,
    RiRadioLine,
    RiSearchFill,
    RiSearchLine,
    RiSettings2Fill,
    RiSettings2Line,
    RiUserVoiceFill,
    RiUserVoiceLine,
} from 'react-icons/ri';
import { generatePath, useLocation } from 'react-router';

import styles from './sidebar-icon.module.css';

import { AppRoute } from '/@/renderer/router/routes';
import { LibraryItem } from '/@/shared/types/domain-types';

interface SidebarIconProps {
    active?: boolean;
    route: string;
    size?: string;
}

export const SidebarIcon = ({ active, route, size }: SidebarIconProps) => {
    const location = useLocation();
    const isActive = active !== undefined ? active : location.pathname === route;
    const renderIcon = () => {
        switch (route) {
            case AppRoute.HOME:
                if (isActive) return <RiHome6Fill size={size} />;
                return <RiHome6Line size={size} />;
            case AppRoute.LIBRARY_ALBUM_ARTISTS:
                if (isActive) return <RiUserVoiceFill size={size} />;
                return <RiUserVoiceLine size={size} />;
            case AppRoute.LIBRARY_ALBUMS:
                if (isActive) return <RiAlbumFill size={size} />;
                return <RiAlbumLine size={size} />;
            case AppRoute.LIBRARY_ARTISTS:
                if (isActive) return <RiUserVoiceFill size={size} />;
                return <RiUserVoiceLine size={size} />;
            case AppRoute.LIBRARY_FOLDERS:
                if (isActive) return <RiFolder3Fill size={size} />;
                return <RiFolder3Line size={size} />;
            case AppRoute.LIBRARY_GENRES:
                if (isActive) return <RiFlag2Fill size={size} />;
                return <RiFlag2Line size={size} />;
            case AppRoute.LIBRARY_SONGS:
                if (isActive) return <RiMusic2Fill size={size} />;
                return <RiMusic2Line size={size} />;
            case AppRoute.NOW_PLAYING:
                if (isActive) return <RiPlayFill size={size} />;
                return <RiPlayLine size={size} />;
            case AppRoute.PLAYLISTS:
                if (isActive) return <RiPlayListFill size={size} />;
                return <RiPlayListLine size={size} />;
            case AppRoute.RADIO:
                if (isActive) return <RiRadioFill size={size} />;
                return <RiRadioLine size={size} />;
            case AppRoute.SETTINGS:
                if (isActive) return <RiSettings2Fill size={size} />;
                return <RiSettings2Line size={size} />;
            case generatePath(AppRoute.SEARCH, { itemType: LibraryItem.SONG }):
                if (isActive) return <RiSearchFill size={size} />;
                return <RiSearchLine size={size} />;
            default:
                if (route.startsWith(AppRoute.FAVORITES)) {
                    if (isActive) return <RiHeartFill size={size} />;
                    return <RiHeartLine size={size} />;
                }
                return <RiHome6Line size={size} />;
        }
    };
    return <span className={styles.wrapper}>{renderIcon()}</span>;
};
