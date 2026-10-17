import styles from '/@/renderer/features/sour/components/sidebar-friends.module.css';
import { openDriving } from '/@/renderer/features/sour/mobile/phone-features';
import {
    openOffline,
    openPhoneSettings,
    openQr,
    whatsPlaying,
} from '/@/renderer/features/sour/mobile/phone-panels';
import { Accordion } from '/@/shared/components/accordion/accordion';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Text } from '/@/shared/components/text/text';

// the phone menu's Phone section (Android app only)
export const SidebarPhone = () => {
    const items: {
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
                        onClick={item.onClick}
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
