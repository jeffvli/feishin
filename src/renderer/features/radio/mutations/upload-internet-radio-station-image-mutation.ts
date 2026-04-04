import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { MutationHookArgs } from '/@/renderer/lib/react-query';
import {
    UploadInternetRadioStationImageArgs,
    UploadInternetRadioStationImageResponse,
} from '/@/shared/types/domain-types';

export const useUploadInternetRadioStationImage = (args: MutationHookArgs) => {
    const { options } = args || {};
    const queryClient = useQueryClient();

    return useMutation<
        UploadInternetRadioStationImageResponse,
        AxiosError,
        UploadInternetRadioStationImageArgs,
        null
    >({
        mutationFn: (args) => {
            return api.controller.uploadInternetRadioStationImage({
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
