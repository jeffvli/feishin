import { TFunction } from 'react-i18next';

import en from '/@/i18n/locales/en.json';
import { titleCase } from '/@/renderer/utils/title-case';

export const normalizeReleaseTypes = (types: string[], t: TFunction) => {
    const primary: string[] = [];
    const secondary: string[] = [];
    const unknown: string[] = [];

    for (const type of types) {
        const lower = type.toLocaleLowerCase();

        if (lower in en.releaseType.primary) {
            primary.push(t(`releaseType.primary.${lower}`, { postProcess: 'sentenceCase' }));
        } else if (lower in en.releaseType.secondary) {
            secondary.push(t(`releaseType.secondary.${lower}`, { postProcess: 'sentenceCase' }));
        } else {
            unknown.push(titleCase(type));
        }
    }

    primary.sort();
    secondary.sort();
    unknown.sort();

    return primary.concat(secondary, unknown);
};
