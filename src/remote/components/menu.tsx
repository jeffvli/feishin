import { CiImageOff, CiImageOn } from 'react-icons/ci';
import { LuMonitor, LuMonitorOff } from 'react-icons/lu';
import { RiMenuFill, RiMoonLine, RiSunLine } from 'react-icons/ri';
import { RemoteButton } from '/@/remote/components/buttons/remote-button';
import { DropdownMenu } from '/@/renderer/components/dropdown-menu';
import { useIsDark, useShowImage, useToggleDark, useToggleShowImage } from '/@/remote/store';
import { useNoSleepContext } from '/@/remote/context/nosleep-context';
import { useToggleNoSleep } from '/@/remote/hooks/use-toggle-no-sleep';

export const ResponsiveMenu = () => {
    const showImage = useShowImage();
    const toggleImage = useToggleShowImage();
    const isDark = useIsDark();
    const toggleDark = useToggleDark();

    const { enabled } = useNoSleepContext();
    const toggleNoSleep = useToggleNoSleep();

    return (
        <DropdownMenu closeOnItemClick={false}>
            <DropdownMenu.Target>
                <RemoteButton>
                    <RiMenuFill size={30} />
                </RemoteButton>
            </DropdownMenu.Target>

            <DropdownMenu.Dropdown>
                <DropdownMenu.Item
                    icon={showImage ? <CiImageOff size={30} /> : <CiImageOn size={30} />}
                    onClick={toggleImage}
                >
                    {showImage ? 'Hide Image' : 'Show Image'}
                </DropdownMenu.Item>
                <DropdownMenu.Item
                    icon={isDark ? <RiSunLine size={30} /> : <RiMoonLine size={30} />}
                    onClick={toggleDark}
                >
                    Toggle Theme
                </DropdownMenu.Item>
                <DropdownMenu.Item
                    icon={enabled ? <LuMonitorOff size={30} /> : <LuMonitor size={30} />}
                    onClick={toggleNoSleep}
                >
                    {enabled ? 'Enable screen lock' : 'Disable screen lock'}
                </DropdownMenu.Item>
            </DropdownMenu.Dropdown>
        </DropdownMenu>
    );
};
