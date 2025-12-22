import { useMemo } from 'react';
import { Navigate, Outlet } from 'react-router';

import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer } from '/@/renderer/store';

export const AppOutlet = () => {
    const currentServer = useCurrentServer();

    const isActionsRequired = useMemo(() => {
        const isServerRequired = !currentServer;

        const actions = [isServerRequired];
        const isActionRequired = actions.some((c) => c);

        return isActionRequired;
    }, [currentServer]);

    if (isActionsRequired) {
        return <Navigate replace to={AppRoute.ACTION_REQUIRED} />;
    }

    return <Outlet />;
};
