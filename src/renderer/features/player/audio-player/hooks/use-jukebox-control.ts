import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { api } from '/@/renderer/api';
import { JukeboxControlArgs, JukeboxControlResponse } from '/@/shared/types/domain-types';

export const useJukeboxControl = () => {
    return useMutation<JukeboxControlResponse, AxiosError, JukeboxControlArgs>({
        mutationFn: (args) => {
            return api.controller.jukeboxControl!({
                ...args,
                apiClientProps: { serverId: args.apiClientProps.serverId },
            });
        },
    });
};
