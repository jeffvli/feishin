import { AxiosHeaders } from 'axios';
import { z } from 'zod';
import { toast } from '/@/renderer/components';
import { useAuthStore } from '/@/renderer/store';
import { ServerListItem } from '/@/renderer/api/types';
import { ServerFeature } from '/@/renderer/api/features.types';

// Since ts-rest client returns a strict response type, we need to add the headers to the body object
export const resultWithHeaders = <ItemType extends z.ZodTypeAny>(itemSchema: ItemType) => {
    return z.object({
        data: itemSchema,
        headers: z.instanceof(AxiosHeaders),
    });
};

export const resultSubsonicBaseResponse = <ItemType extends z.ZodRawShape>(
    itemSchema: ItemType,
) => {
    return z.object({
        'subsonic-response': z
            .object({
                status: z.string(),
                version: z.string(),
            })
            .extend(itemSchema),
    });
};

export const authenticationFailure = (currentServer: ServerListItem | null) => {
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

export const hasFeature = (server: ServerListItem | null, feature: ServerFeature): boolean => {
    if (!server || !server.features) {
        return false;
    }

    return server.features[feature];
};
