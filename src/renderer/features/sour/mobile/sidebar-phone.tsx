import styles from '/@/renderer/features/sour/components/sidebar-friends.module.css';
import { openSourTv } from '/@/renderer/features/sour/components/sour-tv';
import { isNativeApp } from '/@/renderer/features/sour/mobile/android';
import { openDriving } from '/@/renderer/features/sour/mobile/phone-features';
import {
    openOffline,
    openPhoneSettings,
    openQr,
    whatsPlaying,
} from '/@/renderer/features/sour/mobile/phone-panels';
import { useMyProfile } from '/@/renderer/features/sour/store/sour.store';
import { Accordion } from '/@/shared/components/accordion/accordion';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Text } from '/@/shared/components/text/text';

// the phone menu's Phone section (the phone apps, and Offline in the web app)
export const SidebarPhone = () => {
    const admin = !!useMyProfile().data?.perks?.includes('admin');
    const all: {
        icon: Parameters<typeof Icon>[0]['icon'];
        label: string;
        onClick: () => void;
    }[] = [
        { icon: 'mediaPlay', label: 'Driving mode', onClick: openDriving },
        { icon: 'download', label: 'Offline', onClick: openOffline },
        { icon: 'search', label: 'Scan or show a code', onClick: openQr },
        { icon: 'microphone', label: "What's playing?", onClick: whatsPlaying },
        { icon: 'settings', label: 'Phone settings', onClick: openPhoneSettings },
    ];
    // the web app (iPhone Home Screen): offline songs only
    const items = all.filter((item) => isNativeApp() || item.label === 'Offline');
    // admins: Sour Player TV (this phone on the TV runs Group Play for an event)
    if (admin) items.unshift({ icon: 'tv', label: 'Sour Player TV', onClick: openSourTv });
    return (
        <Accordion.Item value="phone">
            <Accordion.Control>
                <Text fw={600} variant="secondary">
                    Phone
                </Text>
            </Accordion.Control>
            <Accordion.Panel>
                {items.map((item) => (
                    <button
                        className={styles.link}
                        key={item.label}
                        // opened once the menu has closed (closing it took the new sheet with it)
                        onClick={() => window.setTimeout(item.onClick, 320)}
                        type="button"
                    >
                        <Group gap="sm">
                            <Icon icon={item.icon} />
                            {item.label}
                        </Group>
                    </button>
                ))}
            </Accordion.Panel>
        </Accordion.Item>
    );
};
