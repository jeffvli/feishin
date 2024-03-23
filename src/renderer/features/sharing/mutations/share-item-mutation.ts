import { useMutation } from '@tanstack/react-query';
import { AnyLibraryItems, ShareItemResponse, ShareItemArgs } from '/@/renderer/api/types';
import { AxiosError } from 'axios';
import { api } from '/@/renderer/api';
import { MutationHookArgs } from '/@/renderer/lib/react-query';
import { getServerById } from '/@/renderer/store';

export const useShareItem = (args: MutationHookArgs) => {
    const { options } = args || {};

    return useMutation<
        ShareItemResponse,
        AxiosError,
        Omit<ShareItemArgs, 'server' | 'apiClientProps'>,
        { previous: { items: AnyLibraryItems } | undefined }
    >({
        mutationFn: (args) => {
            const server = getServerById(args.serverId);
            if (!server) throw new Error('Server not found');
            return api.controller.shareItem({ ...args, apiClientProps: { server } });
        },
        onSuccess: (_data, variables) => {
            if (!_data?.id) throw new Error('Failed to share item');
            const server = getServerById(variables.serverId);
            if (!server) throw new Error('Server not found');
            navigator.clipboard.writeText(`${server.url}/share/${_data.id}`);
        },
        ...options,
    });
};
