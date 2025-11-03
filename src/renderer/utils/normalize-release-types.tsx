import { TFunction } from 'react-i18next';

import { titleCase } from '/@/renderer/utils/title-case';

// Release types derived from https://musicbrainz.org/doc/Release_Group/Type
const PRIMARY_MAPPING = {
    album: 'album',
    broadcast: 'broadcast',
    ep: 'ep',
    other: 'other',
    single: 'single',
} as const;

const SECONDARY_MAPPING = {
    audiobook: 'audiobook',
    'audio drama': 'audioDrama',
    compilation: 'compilation',
    demo: 'demo',
    'dj-mix': 'djMix',
    'field recording': 'fieldRecording',
    interview: 'interview',
    live: 'live',
    'mixtape/street': 'mixtape',
    remix: 'remix',
    soundtrack: 'soundtrack',
    spokenword: 'spokenWord',
} as const;

export const normalizeReleaseTypes = (types: string[], t: TFunction) => {
    const primary: string[] = [];
    const secondary: string[] = [];
    const unknown: string[] = [];

    for (const type of types) {
        const lower = type.toLocaleLowerCase();

        if (lower in PRIMARY_MAPPING) {
            primary.push(
                t(`releaseType.primary.${PRIMARY_MAPPING[lower]}`, { postProcess: 'sentenceCase' }),
            );
        } else if (lower in SECONDARY_MAPPING) {
            secondary.push(
                t(`releaseType.secondary.${SECONDARY_MAPPING[lower]}`, {
                    postProcess: 'sentenceCase',
                }),
            );
        } else {
            unknown.push(titleCase(type));
        }
    }

    primary.sort();
    secondary.sort();
    unknown.sort();

    return primary.concat(secondary, unknown);
};
