import { isMacOS, isWindows, isLinux } from '../utils';

export const utils = {
    isLinux,
    isMacOS,
    isWindows,
};

export type Utils = typeof utils;
