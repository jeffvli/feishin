import { pathToFileURL } from 'node:url';

const VERSION_PATTERN = /^(\d+)\.(\d+)\.(\d+)(?:-beta\.(\d+))?$/;

const RELEASE_PERSONALITIES = {
    beta: [
        {
            intro: 'The soundcheck continues. Please ignore the mysterious cable by the bar.',
            title: 'Soundcheck Shenanigans',
        },
        {
            intro: 'Fresh from the test bench, where it behaved perfectly while somebody was watching.',
            title: 'Mind the Feedback',
        },
        {
            intro: 'A new beta has entered the venue. It has ID and appears old enough to install.',
            title: 'One for the Road Test',
        },
    ],
    hotfix: [
        {
            intro: 'A small adjustment behind the bar, completed without unplugging the speakers.',
            title: 'Tiny Fix, Big Tune',
        },
        {
            intro: 'We found the squeak, tightened the correct screw, and put the screwdriver away.',
            title: 'No More Funny Noises',
        },
        {
            intro: 'A quick tune-up for the jukebox. The music can carry on pretending nothing happened.',
            title: 'The One Where We Fixed It',
        },
    ],
    major: [
        {
            intro: 'The doors are open, the lights are on, and this version has brought its own headline act.',
            title: 'The Big Gig',
        },
        {
            intro: 'A proper new era for KatiesAmp. Please keep drinks away from the release button.',
            title: 'New Amp, Who Dis?',
        },
        {
            intro: 'Everything is turned up, including the version number.',
            title: 'Turn It Up to Eleven',
        },
    ],
    minor: [
        {
            intro: 'New tricks are on tap, the queue is behaving, and nobody has tripped over the aux cable.',
            title: 'Permission to Rock',
        },
        {
            intro: 'A fresh round of improvements has arrived at the bar. This one is on the house.',
            title: 'Fresh Tunes on Tap',
        },
        {
            intro: 'The jukebox has learned a few new moves and promises not to show off during service.',
            title: 'Another Round for the Jukebox',
        },
    ],
};

/* eslint-disable @typescript-eslint/explicit-function-return-type */
export const generateReleaseNotes = ({ channel, customIntro = '', customTitle = '', version }) => {
    const match = VERSION_PATTERN.exec(version);
    if (!match) {
        throw new Error(`Invalid KatiesAmp release version: ${version || '(missing)'}`);
    }

    if (channel !== 'beta' && channel !== 'release') {
        throw new Error(`Unsupported release channel: ${channel}`);
    }

    const [, majorValue, minorValue, patchValue, betaValue] = match;
    const major = Number(majorValue);
    const minor = Number(minorValue);
    const patch = Number(patchValue);
    const beta = Number(betaValue || 0);
    const personalityType =
        channel === 'beta' ? 'beta' : patch > 0 ? 'hotfix' : minor > 0 ? 'minor' : 'major';
    const personalities = RELEASE_PERSONALITIES[personalityType];
    const personality = personalities[(major + minor + patch + beta) % personalities.length];
    const subtitle = customTitle.trim() || personality.title;
    const intro = customIntro.trim() || personality.intro;

    return {
        notes: `## ${subtitle}\n\n${intro}\n\nThe important bits are below, because even a good joke should come with proper release notes.`,
        title: `KatiesAmp v${version}: ${subtitle}`,
    };
};
/* eslint-enable @typescript-eslint/explicit-function-return-type */

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
    console.log(
        JSON.stringify(
            generateReleaseNotes({
                channel: process.env.KATIESAMP_RELEASE_CHANNEL || '',
                customIntro: process.env.KATIESAMP_RELEASE_INTRO || '',
                customTitle: process.env.KATIESAMP_RELEASE_TITLE || '',
                version: process.env.KATIESAMP_RELEASE_VERSION || '',
            }),
        ),
    );
}
