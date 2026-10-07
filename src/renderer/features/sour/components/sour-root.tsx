import { useEffect } from 'react';

import { HolidayLayer } from '/@/renderer/features/sour/components/holiday-layer';
import { MiniPlayer } from '/@/renderer/features/sour/components/mini-player';
import { SourSafe } from '/@/renderer/features/sour/components/sour-safe';
import { applyAppIcon } from '/@/renderer/features/sour/skins/app-icon';
import { currentHoliday, holidayById } from '/@/renderer/features/sour/skins/holidays';
import { useSourStore } from '/@/renderer/features/sour/store/sour.store';
import { useSettingsStore } from '/@/renderer/store/settings.store';

const DAILY_COLORS = [
    '#f2c14e',
    '#9bd06b',
    '#ff7a6b',
    '#7c8cff',
    '#ff71ce',
    '#2ed3c6',
    '#ff9f43',
    '#b48ef0',
    '#e84393',
    '#39c0ed',
];
export const dailyColor = (d = new Date()) => {
    const days = Math.floor(
        Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000,
    );
    return DAILY_COLORS[days % DAILY_COLORS.length];
};

// Spacing for the density slider (Mantine's spacing scale, in rem)
const SPACING: Array<[string, number]> = [
    ['xs', 0.625],
    ['sm', 0.75],
    ['md', 1],
    ['lg', 1.25],
    ['xl', 2],
];

// The look switches from the Sour Studio, as classes and variables on <html>
const LookSwitches = () => {
    const look = useSourStore((s) => s.look);
    useEffect(() => {
        const root = document.documentElement;
        root.classList.toggle('sour-corners-sharp', look.corners === 'sharp');
        root.classList.toggle('sour-corners-round', look.corners === 'round');
        root.classList.toggle('sour-press', look.pressFx && !look.reducedMotion);
        root.classList.toggle('sour-cursor', look.cursor);
        root.classList.toggle('sour-bar-floating', look.barLayout === 'floating');
        root.classList.toggle('sour-glass', look.glass);
        root.classList.toggle('sour-sidebar-right', look.sidebarRight);
        root.classList.toggle('sour-fade-covers', look.fadeCovers && !look.reducedMotion);
    }, [look]);

    useEffect(() => {
        const root = document.documentElement;
        for (const [name, rem] of SPACING) {
            if (look.density === 1) root.style.removeProperty(`--mantine-spacing-${name}`);
            else root.style.setProperty(`--mantine-spacing-${name}`, `${(rem * look.density).toFixed(3)}rem`);
        }
    }, [look.density]);

    useEffect(() => {
        if (!look.dailyTheme || look.albumAccent) return undefined;
        const apply = () =>
            document.documentElement.style.setProperty('--theme-colors-primary', dailyColor());
        apply();
        const timer = setInterval(apply, 10 * 60000);
        return () => {
            clearInterval(timer);
            document.documentElement.style.removeProperty('--theme-colors-primary');
        };
    }, [look.albumAccent, look.dailyTheme]);
    return null;
};

// Holiday skins switch on by themselves for each holiday and your own theme comes back afterwards.
// Picking another theme during a holiday is respected until the next one.
const HolidaySkin = () => {
    const holidays = useSourStore((s) => s.look.holidays);
    const iconPack = useSourStore((s) => s.look.iconPack);
    useEffect(() => {
        const check = () => {
            const { holidayRestore, set } = useSourStore.getState();
            const settings = useSettingsStore.getState();
            const theme = settings.general.theme;
            const holiday = holidays ? currentHoliday() : null;
            if (holiday) {
                if (!settings.general.followSystemTheme && holidayRestore?.holiday !== holiday.id) {
                    set({
                        holidayRestore: {
                            holiday: holiday.id,
                            theme:
                                holidayRestore && holidayById(holidayRestore.holiday)?.theme === theme
                                    ? holidayRestore.theme
                                    : theme,
                        },
                    });
                    if (theme !== holiday.theme)
                        settings.actions.setSettings({ general: { theme: holiday.theme } });
                }
            } else if (holidayRestore) {
                if (holidayById(holidayRestore.holiday)?.theme === theme)
                    settings.actions.setSettings({ general: { theme: holidayRestore.theme } });
                set({ holidayRestore: null });
            }
            applyAppIcon(useSourStore.getState().look.iconPack, holiday?.emoji ?? null).catch(
                () => {},
            );
        };
        check();
        const timer = setInterval(check, 30 * 60000);
        return () => clearInterval(timer);
    }, [holidays, iconPack]);
    return null;
};

// Everything Sour Player shows on top of the app, each piece on its own so one can't break another.
export const SourRoot = () => (
    <>
        <SourSafe name="look switches">
            <LookSwitches />
        </SourSafe>
        <SourSafe name="holiday skin">
            <HolidaySkin />
        </SourSafe>
        <SourSafe name="holiday layer">
            <HolidayLayer />
        </SourSafe>
        <SourSafe name="mini player">
            <MiniPlayer />
        </SourSafe>
    </>
);
