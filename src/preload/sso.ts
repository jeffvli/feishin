import { ipcRenderer } from 'electron';

import { SsoLoginResponse } from '/@/shared/types/domain-types';

export const sso = {
    login: (url: string, ssoCookieName?: string): Promise<SsoLoginResponse> =>
        ipcRenderer.invoke('sso:login', url, ssoCookieName),
};
