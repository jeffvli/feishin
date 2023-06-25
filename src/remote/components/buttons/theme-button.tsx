import { useIsDark, useToggleDark } from '/@/remote/store';
import { RiMoonLine, RiSunLine } from 'react-icons/ri';
import { RemoteButton } from '/@/remote/components/buttons/remote-button';
import { AppTheme } from '/@/renderer/themes/types';
import { useEffect } from 'react';

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
      size="xl"
      tooltip="Toggle Theme"
      variant="default"
      onClick={() => toggleDark()}
    >
      {isDark ? <RiSunLine size={30} /> : <RiMoonLine size={30} />}
    </RemoteButton>
  );
};
