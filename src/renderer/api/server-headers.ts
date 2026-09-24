import isElectron from 'is-electron';

import { mergeCustomHeaders } from '/@/shared/utils/server-headers';

export const getDesktopCustomHeaders = (headers?: Record<string, string>) =>
    isElectron() ? headers : undefined;

export const mergeDesktopHeaders = (
    headers: Record<string, string> | undefined,
    requiredHeaders: Record<string, string> = {},
): Record<string, string> => mergeCustomHeaders(getDesktopCustomHeaders(headers), requiredHeaders);
