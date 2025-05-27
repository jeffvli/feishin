import { useAuthStore } from '/@/renderer/store';
import { toast } from '/@/shared/components/toast/toast';
import { ServerListItem } from '/@/shared/types/types';

export const authenticationFailure = (currentServer: null | ServerListItem) => {
    toast.error({
        message: 'Your session has expired.',
    });

    if (currentServer) {
        const serverId = currentServer.id;
        const token = currentServer.ndCredential;
        console.log(`token is expired: ${token}`);
        useAuthStore.getState().actions.updateServer(serverId, { ndCredential: undefined });
        useAuthStore.getState().actions.setCurrentServer(null);
    }
};
