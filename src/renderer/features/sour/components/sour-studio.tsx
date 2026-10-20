import { openModal } from '@mantine/modals';
import clsx from 'clsx';
import { useEffect, useState } from 'react';

import styles from './sour-studio.module.css';

import { fontFamily, SOUR_FONTS } from '/@/renderer/features/sour/fonts';
import { drawAppIcon, ICON_PACKS } from '/@/renderer/features/sour/skins/app-icon';
import { currentHoliday, HOLIDAY_LIST } from '/@/renderer/features/sour/skins/holidays';
import {
    type BarVisualizerStyle,
    type SourLook,
    useMyProfile,
    useSourStore,
} from '/@/renderer/features/sour/store/sour.store';
import {
    BAR_STYLES,
    SourVisualizer,
    VISUALIZER_STYLES,
} from '/@/renderer/features/sour/visualizer/sour-visualizer';
import { useCustomThemes } from '/@/renderer/store/custom-themes.store';
import { useSettingsStore } from '/@/renderer/store/settings.store';
import { THEME_DATA } from '/@/renderer/themes/use-app-theme';
import { fontOptions } from '/@/renderer/types/fonts';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { SegmentedControl } from '/@/shared/components/segmented-control/segmented-control';
import { Select } from '/@/shared/components/select/select';
import { Slider } from '/@/shared/components/slider/slider';
import { Stack } from '/@/shared/components/stack/stack';
import { Switch } from '/@/shared/components/switch/switch';
import { Tabs } from '/@/shared/components/tabs/tabs';
import { Text } from '/@/shared/components/text/text';
import { getAppTheme } from '/@/shared/themes/app-theme';
import { FontType } from '/@/shared/types/types';

const LookSwitch = ({
    description,
    id,
    label,
}: {
    description: string;
    id: keyof SourLook;
    label: string;
}) => {
    const value = useSourStore((s) => s.look[id]);
    const setLook = useSourStore((s) => s.setLook);
    return (
        <Switch
            checked={!!value}
            description={description}
            label={label}
            onChange={(e) => setLook({ [id]: e.currentTarget.checked } as Partial<SourLook>)}
        />
    );
};

// every theme, in groups: Sour skins, holiday skins, Hermes, the classic Feishin themes and your own
const SkinGrid = ({ items }: { items: { label: string; value: string }[] }) => {
    const theme = useSettingsStore((s) => s.general.theme);
    const setSettings = useSettingsStore((s) => s.actions.setSettings);
    return (
        <div className={styles.grid}>
            {items.map((t) => {
                const c = getAppTheme(t.value).colors ?? {};
                return (
                    <button
                        className={clsx(styles.skin, { [styles.active]: theme === t.value })}
                        key={t.value}
                        onClick={() =>
                            setSettings({
                                general: { followSystemTheme: false, theme: t.value },
                            })
                        }
                        style={{
                            background: String(c.background),
                            color: String(c.foreground),
                        }}
                        type="button"
                    >
                        <span className={styles.swatches}>
                            <i style={{ background: String(c.primary) }} />
                            <i style={{ background: String(c.surface) }} />
                            <i style={{ background: String(c['background-alternate']) }} />
                        </span>
                        <span className={styles.skinName}>
                            {t.label.replace(/^Sour /, '').replace(/ \(holiday\)$/, '')}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

const Skins = () => {
    const custom = useCustomThemes()
        .filter((t) => !t.error)
        .map((t) => ({ label: t.label, value: t.id }));
    const holiday = (t: { label: string }) => t.label.endsWith('(holiday)');
    const groups: Array<[string, { label: string; value: string }[]]> = [
        ['Sour skins', THEME_DATA.filter((t) => t.label.startsWith('Sour ') && !holiday(t))],
        ['Holiday skins', THEME_DATA.filter(holiday)],
        ['Hermes', THEME_DATA.filter((t) => t.label.startsWith('Hermes '))],
        [
            'Classic themes',
            THEME_DATA.filter((t) => !/^(Sour|Hermes) /.test(t.label)).sort((a, b) =>
                a.label.localeCompare(b.label),
            ),
        ],
        ['Your themes', custom],
    ];
    return (
        <Stack gap="sm">
            <Text isMuted size="sm">
                Click one to wear it. Holiday skins also switch on by themselves (Holidays tab).
            </Text>
            {groups
                .filter(([, items]) => items.length)
                .map(([title, items]) => (
                    <Stack gap={6} key={title}>
                        <Text fw={700} size="sm">
                            {title}
                        </Text>
                        <SkinGrid items={items} />
                    </Stack>
                ))}
        </Stack>
    );
};

const Holidays = () => {
    const now = currentHoliday();
    return (
        <Stack gap="sm">
            <LookSwitch
                description="Skins, falling snow, bats, hearts and friends, a greeting and a holiday app icon. Your own theme comes back after each holiday."
                id="holidays"
                label="Holiday skins and decorations"
            />
            <div className={styles.list}>
                {HOLIDAY_LIST.map((h) => (
                    <div
                        className={clsx(styles.row, { [styles.now]: now?.id === h.id })}
                        key={h.id}
                    >
                        <span className={styles.emoji}>{h.emoji}</span>
                        <span className={styles.grow}>{h.name}</span>
                        <Text isMuted size="xs">
                            {now?.id === h.id ? 'on now' : h.particles}
                        </Text>
                    </div>
                ))}
            </div>
            <Text isMuted size="sm">
                Your birthday (set it in your profile) gets confetti all day.
            </Text>
        </Stack>
    );
};

const Visualizers = () => {
    const current = useSourStore((s) => s.look.visualizer);
    const barStyle = useSourStore((s) => s.look.barStyle) ?? 'bars';
    const setLook = useSourStore((s) => s.setLook);
    const perks = useMyProfile().data?.perks ?? [];
    return (
        <Stack gap="sm">
            <LookSwitch
                description="A small visualizer strip next to the controls and in the mini player."
                id="barVisualizer"
                label="Visualizer in the player bar"
            />
            <SegmentedControl
                data={BAR_STYLES.map((v) => ({ label: v.label, value: v.id }))}
                onChange={(v) => setLook({ barStyle: v as BarVisualizerStyle })}
                value={barStyle}
            />
            <div className={styles.grid}>
                {VISUALIZER_STYLES.filter((v) => !v.perk || perks.includes(v.perk)).map((v) => (
                    <button
                        className={clsx(styles.viz, { [styles.active]: current === v.id })}
                        key={v.id}
                        onClick={() => setLook({ visualizer: v.id })}
                        type="button"
                    >
                        <div className={styles.vizCanvas}>
                            <SourVisualizer style={v.id} />
                        </div>
                        <span>{v.label}</span>
                    </button>
                ))}
            </div>
            <Text isMuted size="sm">
                The big one lives in the Sour Stage (full screen now playing).
            </Text>
        </Stack>
    );
};

const Layout = () => {
    const look = useSourStore((s) => s.look);
    const setLook = useSourStore((s) => s.setLook);
    return (
        <Stack gap="md">
            <Stack gap={4}>
                <Text fw={600} size="sm">
                    App look
                </Text>
                <SegmentedControl
                    data={[
                        { label: 'New (v0.8)', value: 'new' },
                        { label: 'Classic (v0.7)', value: 'classic' },
                    ]}
                    onChange={(v) => setLook({ ui: v as SourLook['ui'] })}
                    value={look.ui ?? 'new'}
                />
            </Stack>
            <Stack gap={4}>
                <Text fw={600} size="sm">
                    Player bar
                </Text>
                <SegmentedControl
                    data={[
                        { label: 'Classic', value: 'classic' },
                        { label: 'Floating', value: 'floating' },
                    ]}
                    onChange={(v) => setLook({ barLayout: v as SourLook['barLayout'] })}
                    value={look.barLayout}
                />
            </Stack>
            <Stack gap={4}>
                <Text fw={600} size="sm">
                    Corners
                </Text>
                <SegmentedControl
                    data={[
                        { label: 'Sharp', value: 'sharp' },
                        { label: 'Normal', value: 'normal' },
                        { label: 'Extra round', value: 'round' },
                    ]}
                    onChange={(v) => setLook({ corners: v as SourLook['corners'] })}
                    value={look.corners}
                />
            </Stack>
            <Stack gap={4}>
                <Text fw={600} size="sm">
                    Spacing
                </Text>
                <Slider
                    defaultValue={look.density}
                    label={(v) => (v < 0.95 ? 'Compact' : v > 1.05 ? 'Cozy' : 'Normal')}
                    max={1.25}
                    min={0.8}
                    onChangeEnd={(v) => setLook({ density: v })}
                    step={0.05}
                />
            </Stack>
            <LookSwitch
                description="Swap the sidebar to the right side."
                id="sidebarRight"
                label="Sidebar on the right"
            />
            <LookSwitch
                description="See-through menus and popups."
                id="glass"
                label="Glass menus"
            />
            <LookSwitch
                description="A little lemon instead of the arrow."
                id="cursor"
                label="Lemon cursor"
            />
            <LookSwitch
                description="Buttons squish a little when pressed."
                id="pressFx"
                label="Press animations"
            />
            <LookSwitch
                description="Album covers fade in instead of popping."
                id="fadeCovers"
                label="Fade in covers"
            />
            <LookSwitch
                description="Turns off animations and the holiday bits."
                id="reducedMotion"
                label="Reduce motion"
            />
        </Stack>
    );
};

const Fonts = () => {
    const font = useSettingsStore((s) => s.font);
    const setSettings = useSettingsStore((s) => s.actions.setSettings);
    const perks = useMyProfile().data?.perks ?? [];
    return (
        <Stack gap="sm">
            <Select
                data={fontOptions(perks, font.builtIn)}
                description="The font for the whole app."
                label="App font"
                onChange={(v) =>
                    v && setSettings({ font: { builtIn: v, type: FontType.BUILT_IN } })
                }
                value={font.type === FontType.BUILT_IN ? font.builtIn : null}
            />
            <Text isMuted size="sm">
                Fonts for your name (profile editor) and your playlist titles (playlist Theme
                button):
            </Text>
            <div className={styles.fonts}>
                {SOUR_FONTS.filter((f) => !f.perk || perks.includes(f.id)).map((f) => (
                    <div className={styles.fontRow} key={f.id}>
                        <span
                            className={styles.fontSample}
                            style={{ fontFamily: fontFamily(f.id) }}
                        >
                            Sour Player
                        </span>
                        <Text isMuted size="xs">
                            {f.label}
                        </Text>
                    </div>
                ))}
            </div>
        </Stack>
    );
};

const Icons = () => {
    const pack = useSourStore((s) => s.look.iconPack);
    const setLook = useSourStore((s) => s.setLook);
    const [previews, setPreviews] = useState<Record<string, string>>({});
    useEffect(() => {
        let alive = true;
        Promise.all(
            ICON_PACKS.map(
                async (p) => [p.id, await drawAppIcon(p.id, null, p.id === 'pixel')] as const,
            ),
        )
            .then((list) => {
                if (alive)
                    setPreviews(
                        Object.fromEntries(list.filter(([, v]) => v)) as Record<string, string>,
                    );
            })
            .catch(() => {});
        return () => {
            alive = false;
        };
    }, []);
    return (
        <Stack gap="sm">
            <Text isMuted size="sm">
                The icon in your taskbar or dock (desktop app). Holidays add a little emoji to it.
            </Text>
            <div className={styles.grid}>
                {ICON_PACKS.map((p) => (
                    <button
                        className={clsx(styles.icon, { [styles.active]: pack === p.id })}
                        key={p.id}
                        onClick={() => setLook({ iconPack: p.id })}
                        type="button"
                    >
                        {previews[p.id] ? (
                            <img alt="" src={previews[p.id]} />
                        ) : (
                            <span className={styles.iconBlank} />
                        )}
                        <span>{p.label}</span>
                    </button>
                ))}
            </div>
        </Stack>
    );
};

const Extras = () => (
    <Stack gap="md">
        <LookSwitch
            description="Loading spinners become a spinning lemon."
            id="lemonLoader"
            label="Lemon loading spinner"
        />
        <LookSwitch
            description="A short lemon splash while Sour Player opens."
            id="splash"
            label="Splash screen"
        />
        <LookSwitch
            description="A short jingle when Sour Player opens."
            id="startupSound"
            label="Startup sound"
        />
        <LookSwitch
            description="The accent colour changes every day (the same for everyone)."
            id="dailyTheme"
            label="Colour of the day"
        />
        <LookSwitch
            description="The accent follows the cover of the song that's playing."
            id="albumAccent"
            label="Accent from the album"
        />
        <LookSwitch
            description="A slow gradient in the album colours behind the pages."
            id="animatedBackground"
            label="Animated background"
        />
        <LookSwitch
            description="Pop-ups when friends join your group, send you songs and more."
            id="socialToasts"
            label="Friend pop-ups"
        />
        <LookSwitch
            description="Hover a cover in Sour Player's own lists for a second to hear a bit of it."
            id="hoverPreview"
            label="Hover previews"
        />
        <LookSwitch
            description="When the queue runs out, songs like the last one are added so the music doesn't stop."
            id="keepPlaying"
            label="Keep playing"
        />
    </Stack>
);

const Studio = () => (
    <Tabs defaultValue="skins" keepMounted={false}>
        <Tabs.List>
            <Tabs.Tab value="skins">Skins</Tabs.Tab>
            <Tabs.Tab value="holidays">Holidays</Tabs.Tab>
            <Tabs.Tab value="visualizer">Visualizer</Tabs.Tab>
            <Tabs.Tab value="layout">Layout</Tabs.Tab>
            <Tabs.Tab value="fonts">Fonts</Tabs.Tab>
            <Tabs.Tab value="icon">Icon</Tabs.Tab>
            <Tabs.Tab value="extras">Extras</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel pt="md" value="skins">
            <Skins />
        </Tabs.Panel>
        <Tabs.Panel pt="md" value="holidays">
            <Holidays />
        </Tabs.Panel>
        <Tabs.Panel pt="md" value="visualizer">
            <Visualizers />
        </Tabs.Panel>
        <Tabs.Panel pt="md" value="layout">
            <Layout />
        </Tabs.Panel>
        <Tabs.Panel pt="md" value="fonts">
            <Fonts />
        </Tabs.Panel>
        <Tabs.Panel pt="md" value="icon">
            <Icons />
        </Tabs.Panel>
        <Tabs.Panel pt="md" value="extras">
            <Extras />
        </Tabs.Panel>
    </Tabs>
);

// The Sour Studio: everything about how Sour Player looks, in one place.
export const openSourStudio = () =>
    openModal({ children: <Studio />, size: 'xl', title: 'Sour Studio' });

export const SourStudioButton = () => (
    <ActionIcon
        icon="palette"
        iconProps={{ size: 'lg' }}
        onClick={(e) => {
            e.stopPropagation();
            openSourStudio();
        }}
        size="sm"
        tooltip={{ label: 'Sour Studio: skins, holidays, visualizers (Ctrl+Alt+L)', openDelay: 0 }}
        variant="subtle"
    />
);
