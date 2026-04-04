import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { MutationHookArgs } from '/@/renderer/lib/react-query';
import {
    DeleteInternetRadioStationImageArgs,
    DeleteInternetRadioStationImageResponse,
} from '/@/shared/types/domain-types';

export const useDeleteInternetRadioStationImage = (args: MutationHookArgs) => {
    const { options } = args || {};
    const queryClient = useQueryClient();

    return useMutation<
        DeleteInternetRadioStationImageResponse,
        AxiosError,
        DeleteInternetRadioStationImageArgs,
        null
    >({
        mutationFn: (args) => {
            return api.controller.deleteInternetRadioStationImage({
                ...args,
                apiClientProps: { serverId: args.apiClientProps.serverId },
            });
        },
        onSuccess: (_data, variables) => {
            const { apiClientProps } = variables;
            const serverId = apiClientProps.serverId;

            if (!serverId) return;

            queryClient.invalidateQueries({
                queryKey: queryKeys.radio.list(serverId),
            });
        },
        ...options,
    });
};
