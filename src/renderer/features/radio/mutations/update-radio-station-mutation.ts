import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { MutationHookArgs } from '/@/renderer/lib/react-query';
import {
    UpdateInternetRadioStationArgs,
    UpdateInternetRadioStationResponse,
} from '/@/shared/types/domain-types';

export const useUpdateRadioStation = (args: MutationHookArgs) => {
    const { options } = args || {};
    const queryClient = useQueryClient();

    return useMutation<
        UpdateInternetRadioStationResponse,
        AxiosError,
        UpdateInternetRadioStationArgs,
        null
    >({
        mutationFn: (args) => {
            return api.controller.updateInternetRadioStation({
                ...args,
                apiClientProps: { serverId: args.apiClientProps.serverId },
            });
        },
        onSuccess: (_args, variables) => {
            queryClient.invalidateQueries({
                exact: false,
                queryKey: queryKeys.radio.list(variables.apiClientProps.serverId),
            });
        },
        ...options,
    });
};
