import { Stack } from '@mantine/core';
import { ApplicationSettings } from '/@/renderer/features/settings/components/general/application-settings';
import { ControlSettings } from '/@/renderer/features/settings/components/general/control-settings';
import { SidebarSettings } from '/@/renderer/features/settings/components/general/sidebar-settings';
import { ThemeSettings } from '/@/renderer/features/settings/components/general/theme-settings';
import { RemoteSettings } from '/@/renderer/features/settings/components/general/remote-settings';
import { CacheSettings } from '/@/renderer/features/settings/components/window/cache-settngs';
import isElectron from 'is-electron';
import { HomeSettings } from '/@/renderer/features/settings/components/general/home-settings';
import { SidebarReorder } from '/@/renderer/features/settings/components/general/sidebar-reorder';
import { ContextMenuSettings } from '/@/renderer/features/settings/components/general/context-menu-settings';
import { ArtistSettings } from '/@/renderer/features/settings/components/general/artist-settings';

export const GeneralTab = () => {
    return (
        <Stack spacing="md">
            <ApplicationSettings />
            <ThemeSettings />
            <ControlSettings />
            <HomeSettings />
            <ArtistSettings />
            <SidebarReorder />
            <SidebarSettings />
            <ContextMenuSettings />
            {isElectron() && <RemoteSettings />}
            <CacheSettings />
        </Stack>
    );
};
