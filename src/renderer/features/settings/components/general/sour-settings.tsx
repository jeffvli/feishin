import isElectron from 'is-electron';
import { memo } from 'react';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { openPeople, openProfileHelper } from '/@/renderer/features/sour/components/people';
import { openSourStudio } from '/@/renderer/features/sour/components/sour-studio';
import { openFeedback, openReports } from '/@/renderer/features/sour/components/feedback';
import { HomeBackgroundSetting } from '/@/renderer/features/sour/components/home-background';
import {
    type SourLook,
    useMyProfile,
    useSourStore,
} from '/@/renderer/features/sour/store/sour.store';
import {
    DiscordDisplayType,
    useDiscordSettings,
    useSettingsStoreActions,
} from '/@/renderer/store/settings.store';
import { Button } from '/@/shared/components/button/button';
import { Switch } from '/@/shared/components/switch/switch';

const BUTTONS: Array<[string, string]> = [
    ['people', 'People'],
    ['request', 'Request music (+)'],
    ['mini', 'Mini player'],
    ['group', 'Group Play'],
    ['video', 'Music video'],
    ['stage', 'Sour Stage'],
    ['studio', 'Sour Studio'],
];

// Settings > General > Sour Player: look and comfort switches, and which player bar buttons show.
export const SourSettings = memo(() => {
    const look = useSourStore((state) => state.look);
    const setLook = useSourStore((state) => state.setLook);
    const discord = useDiscordSettings();
    const { setSettings } = useSettingsStoreActions();
    const hiddenPlaylists = useSourStore((state) => state.hiddenPlaylists) ?? [];
    const setStore = useSourStore((state) => state.set);
    const admin = !!useMyProfile().data?.perks?.includes('admin');

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
                <Switch
                    aria-label="Discord status"
                    checked={discord.enabled}
                    onChange={(e) =>
                        setSettings({
                            discord: e.currentTarget.checked
                                ? {
                                      displayType: DiscordDisplayType.SONG_NAME,
                                      enabled: true,
                                      showAsListening: true,
                                      showPaused: false,
                                  }
                                : { enabled: false },
                        })
                    }
                />
            ),
            description:
                'Shows "Listening to" with the song and artist on your Discord profile, like Spotify does (the Discord app has to be running; more options under Settings > Window > Discord).',
            isHidden: !isElectron(),
            title: 'Discord status',
        },
        toggle(
            'simple',
            'Simple mode',
            'Just the basics: play music, search, playlists and requests. Hides the extras, effects and social bits (turn it off any time to get them all back).',
        ),
        {
            control: (
                <Button onClick={openPeople} size="compact-sm" variant="default">
                    Open People
                </Button>
            ),
            description:
                'Your profile, who is online, the group page, the leaderboard and your recaps.',
            title: 'Profile and friends',
        },
        {
            control: (
                <Button onClick={openFeedback} size="compact-sm" variant="default">
                    Report or suggest
                </Button>
            ),
            description:
                'Something broken, or an idea? It goes straight to the admins of your Hermes Music.',
            title: 'Report a bug or suggest something',
        },
        {
            control: (
                <Button onClick={openReports} size="compact-sm" variant="default">
                    Open reports
                </Button>
            ),
            description: 'Every bug report and suggestion your friends sent. Only admins have this.',
            isHidden: !admin,
            title: 'Bug reports and suggestions',
        },
        {
            control: <HomeBackgroundSetting />,
            description: 'Your own picture or GIF behind the Home page (kept on this computer).',
            title: 'Home background',
        },
        toggle(
            'autoUpdate',
            'Auto updates',
            'New versions download by themselves and install the next time nothing is playing for a minute.',
        ),
        {
            control: (
                <Button onClick={openProfileHelper} size="compact-sm" variant="default">
                    Edit a profile
                </Button>
            ),
            description:
                "Fix a friend's name, bio, pictures or colours for them. Only Navidrome admins have this.",
            isHidden: !admin,
            title: "Edit someone's profile",
        },
        {
            control: (
                <Button onClick={openSourStudio} size="compact-sm" variant="default">
                    Open Sour Studio
                </Button>
            ),
            description:
                'Skins, holiday decorations, visualizers, layout, fonts and the app icon (Ctrl+Alt+L).',
            title: 'Sour Studio',
        },
        toggle(
            'albumAccent',
            'Accent colour from the album',
            'The app accent follows the cover of the song that is playing.',
        ),
        toggle(
            'animatedBackground',
            'Animated background',
            'A slow moving gradient in the album colours behind the pages.',
        ),
        toggle(
            'seasonal',
            'Seasonal themes',
            'Switches to a Hermes theme that fits the time of year when Sour Player starts (holiday skins win while a holiday is on).',
        ),
        toggle('startupSound', 'Startup sound', 'A short jingle when Sour Player opens.'),
        toggle('reducedMotion', 'Reduce motion', 'Turns off animations and transitions.'),
        toggle(
            'autoVideo',
            'Open music videos by themselves',
            'A small video window opens when a song with a music video starts.',
        ),
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

    if (hiddenPlaylists.length) {
        options.push({
            control: (
                <Button
                    onClick={() => setStore({ hiddenPlaylists: [] })}
                    size="compact-sm"
                    variant="default"
                >
                    Show them all again
                </Button>
            ),
            description: `Hidden from the sidebar: ${hiddenPlaylists.map((h) => h.name).join(', ')}. Right-click a playlist on the Playlists page to show just that one.`,
            title: 'Hidden playlists',
        });
    }

    options.push({
        control: <></>,
        description:
            'The Determination font is by anonymous-1438277 on fontstruct.com, licensed CC BY 3.0. The other fonts are from Google Fonts (SIL Open Font License / Apache 2.0) and emoji are Twemoji (CC BY 4.0); licences are included with the app.',
        title: 'Font credits',
    });

    return <SettingsSection options={options} title="Sour Player" />;
});
