import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { api } from '/@/renderer/api';
import { MutationHookArgs } from '/@/renderer/lib/react-query';
import { AnyLibraryItems, ShareItemArgs, ShareItemResponse } from '/@/shared/types/domain-types';

export const useShareItem = (args: MutationHookArgs) => {
    const { options } = args || {};

    return useMutation<
        ShareItemResponse,
        AxiosError,
        ShareItemArgs,
        { previous: undefined | { items: AnyLibraryItems } }
    >({
        mutationFn: (args) => {
            return api.controller.shareItem({
                ...args,
                apiClientProps: { serverId: args.apiClientProps.serverId },
            });
        },
        retry: false,
        ...options,
    });
};
