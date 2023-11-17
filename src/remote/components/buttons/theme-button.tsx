import { useIsDark, useToggleDark } from '/@/remote/store';
import { RiMoonLine, RiSunLine } from 'react-icons/ri';
import { RemoteButton } from '/@/remote/components/buttons/remote-button';

export const ThemeButton = () => {
    const isDark = useIsDark();
    const toggleDark = useToggleDark();

    return (
        <RemoteButton
            tooltip="Toggle Theme"
            onClick={() => toggleDark()}
        >
            {isDark ? <RiSunLine size={30} /> : <RiMoonLine size={30} />}
        </RemoteButton>
    );
};
