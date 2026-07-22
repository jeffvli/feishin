import { useEffect } from 'react';

import { parseVersionFromTag, useGithubLatestRelease } from '/@/renderer/hooks/use-github-releases';
import { useAppStore } from '/@/renderer/store';

// 6 hours
const CHECK_FOR_UPDATES_INTERVAL_MS = 6 * 60 * 60 * 1000;

export const useCheckForUpdates = () => {
    const setLatestVersion = useAppStore((state) => state.actions.setLatestVersion);

    const query = useGithubLatestRelease({
        refetchInterval: CHECK_FOR_UPDATES_INTERVAL_MS,
        refetchIntervalInBackground: true,
    });

    useEffect(() => {
        if (query.data) {
            setLatestVersion(parseVersionFromTag(query.data.tag_name));
        }
    }, [query.data, setLatestVersion]);

    return query;
};
