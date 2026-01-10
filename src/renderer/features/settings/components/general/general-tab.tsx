import { memo, useMemo } from 'react';
import { Fragment } from 'react/jsx-runtime';

import { ApplicationSettings } from '/@/renderer/features/settings/components/general/application-settings';
import { ControlSettings } from '/@/renderer/features/settings/components/general/control-settings';
import { LyricSettings } from '/@/renderer/features/settings/components/general/lyric-settings';
import { QueryBuilderSettings } from '/@/renderer/features/settings/components/general/query-builder-settings';
import { ScrobbleSettings } from '/@/renderer/features/settings/components/general/scrobble-settings';
import { SidebarSettings } from '/@/renderer/features/settings/components/general/sidebar-settings';
import { ThemeSettings } from '/@/renderer/features/settings/components/general/theme-settings';
import { useCurrentServer } from '/@/renderer/store';
import { hasFeature } from '/@/shared/api/utils';
import { Divider } from '/@/shared/components/divider/divider';
import { Stack } from '/@/shared/components/stack/stack';
import { ServerFeature } from '/@/shared/types/features-types';

export const GeneralTab = memo(() => {
    const server = useCurrentServer();
    const supportsSmartPlaylists = hasFeature(server, ServerFeature.PLAYLISTS_SMART);

    const sections = useMemo(() => {
        const baseSections = [
            { component: ThemeSettings, key: 'theme' },
            { component: ApplicationSettings, key: 'application' },
            { component: ControlSettings, key: 'control' },
            { component: SidebarSettings, key: 'sidebar' },
            { component: ScrobbleSettings, key: 'scrobble' },
            { component: LyricSettings, key: 'lyrics' },
        ];

        if (supportsSmartPlaylists) {
            baseSections.push({ component: QueryBuilderSettings, key: 'queryBuilder' });
        }

        return baseSections;
    }, [supportsSmartPlaylists]);

    return (
        <Stack gap="md">
            {sections.map(({ component: Section, key }, index) => (
                <Fragment key={key}>
                    <Section />
                    {index < sections.length - 1 && <Divider />}
                </Fragment>
            ))}
        </Stack>
    );
});
