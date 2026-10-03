import { openModal } from '@mantine/modals';
import { t } from 'i18next';

import { ServerList } from '/@/renderer/features/servers/components/server-list';
import { requestAdministratorAccess } from '/@/renderer/features/settings/components/administrator-access-modal';

export const openManageServersModal = () => {
    requestAdministratorAccess(() => {
        openModal({
            children: <ServerList />,
            title: t('page.manageServers.title'),
        });
    });
};
