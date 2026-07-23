import { mutationOptions, useMutation } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router';

import { isAnalyticsDisabled } from '/@/renderer/features/analytics/hooks/use-analytics-disabled';
import { getRoutePattern } from '/@/renderer/features/analytics/utils/get-route-pattern';
import { logger } from '/@/renderer/utils/logger';
const trackPageView = (routePattern: string) => {
    window.umami?.track((props) => ({
        language: props.language,
        url: routePattern,
        website: props.website,
    }));
};

export const usePageTracker = () => {
    const location = useLocation();
    const routePattern = useMemo(() => getRoutePattern(location.pathname), [location.pathname]);

    const { mutate: trackPageViewMutation } = useMutation(pageTrackerMutation);

    useEffect(() => {
        if (!window.umami || isAnalyticsDisabled()) {
            return;
        }

        trackPageViewMutation(routePattern, {
            onSettled: () => {
                logger.debug('Page view tracked', { route: routePattern });
            },
        });
    }, [routePattern, trackPageViewMutation]);
};

const pageTrackerMutation = mutationOptions({
    gcTime: 0,
    mutationFn: (routePattern: string) => {
        try {
            trackPageView(routePattern);
            return Promise.resolve();
        } catch (error) {
            return Promise.reject(error);
        }
    },
    mutationKey: ['analytics', 'page-tracker'],

    retry: false,
    throwOnError: false,
});
