import { useEffect } from 'react';
import { RiMoonLine, RiSunLine } from 'react-icons/ri';

import { RemoteButton } from '/@/remote/components/buttons/remote-button';
import { useIsDark, useToggleDark } from '/@/remote/store';
import { AppTheme } from '/@/shared/themes/app-theme-types';

export const ThemeButton = () => {
    const isDark = useIsDark();
    const toggleDark = useToggleDark();

    useEffect(() => {
        const targetTheme: AppTheme = isDark ? AppTheme.DEFAULT_DARK : AppTheme.DEFAULT_LIGHT;
        document.body.setAttribute('data-theme', targetTheme);
    }, [isDark]);

    return (
        <RemoteButton
            mr={5}
            onClick={() => toggleDark()}
            size="xl"
            tooltip={{
                label: 'Toggle Theme',
            }}
            variant="default"
        >
            {isDark ? <RiSunLine size={30} /> : <RiMoonLine size={30} />}
        </RemoteButton>
    );
};
