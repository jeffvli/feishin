import stc from 'string-to-color';

import { isLightColor } from '/@/shared/utils/is-light-color';

const randomSeed = '121212';

export const stringToColor = (string: string) => {
    const hex = stc({ seed: randomSeed, string });

    return { color: hex, isLight: isLightColor(hex) };
};
