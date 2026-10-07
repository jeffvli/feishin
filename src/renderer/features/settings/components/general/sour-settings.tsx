import { memo } from 'react';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { openPeople } from '/@/renderer/features/sour/components/people';
import { type SourLook, useSourStore } from '/@/renderer/features/sour/store/sour.store';
import { Button } from '/@/shared/components/button/button';
import { Switch } from '/@/shared/components/switch/switch';

const BUTTONS: Array<[string, string]> = [
    ['people', 'People'],
    ['request', 'Request music (+)'],
    ['mini', 'Mini player'],
    ['group', 'Group Play'],
    ['video', 'Music video'],
];

// Settings > General > Sour Player: look and comfort switches, and which player bar buttons show.
export const SourSettings = memo(() => {
    const look = useSourStore((state) => state.look);
    const setLook = useSourStore((state) => state.setLook);

    const toggle = (key: keyof SourLook, title: string, description: string): SettingOption => ({
        control: (
            <Switch
                aria-label={title}
                checked={!!look[key]}
                onChange={(e) => setLook({ [key]: e.currentTarget.checked } as Partial<SourLook>)}
            />
        ),
        description,
        title,
    });

    const options: SettingOption[] = [
        {
            control: (
                <Button onClick={openPeople} size="compact-sm" variant="default">
                    Open People
                </Button>
            ),
            description: 'Your profile, who is online, the group page, the leaderboard and your recaps.',
            title: 'Profile and friends',
        },
        toggle('albumAccent', 'Accent colour from the album', 'The app accent follows the cover of the song that is playing.'),
        toggle('animatedBackground', 'Animated background', 'A slow moving gradient in the album colours behind the pages.'),
        toggle('seasonal', 'Seasonal themes', 'Switches to a Hermes theme that fits the time of year when Sour Player starts.'),
        toggle('startupSound', 'Startup sound', 'A short jingle when Sour Player opens.'),
        toggle('reducedMotion', 'Reduce motion', 'Turns off animations and transitions.'),
        toggle('autoVideo', 'Open music videos by themselves', 'A small video window opens when a song with a music video starts.'),
        ...BUTTONS.map(([id, label]) => ({
            control: (
                <Switch
                    aria-label={label}
                    checked={!look.hiddenButtons.includes(id)}
                    onChange={(e) =>
                        setLook({
                            hiddenButtons: e.currentTarget.checked
                                ? look.hiddenButtons.filter((b) => b !== id)
                                : [...look.hiddenButtons, id],
                        })
                    }
                />
            ),
            description: 'Show this button in the player bar.',
            title: `Player bar: ${label}`,
        })),
    ];

    return <SettingsSection options={options} title="Sour Player" />;
});
