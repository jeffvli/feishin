import { useEffect, useState } from 'react';
import { Group } from '@mantine/core';
import { FastAverageColor } from 'fast-average-color';
import { PageHeader, Text } from '/@/components';
import { useCurrentSong } from '/@/store';
import { getHeaderColor } from '/@/utils';
import { useTheme } from '/@/hooks';

export const NowPlayingHeader = () => {
  const [headerColor, setHeaderColor] = useState({ isDark: false, value: 'transparent' });
  const currentSong = useCurrentSong();
  const theme = useTheme();

  useEffect(() => {
    const fac = new FastAverageColor();
    const url = currentSong?.imageUrl;

    if (url) {
      fac
        .getColorAsync(currentSong?.imageUrl, {
          algorithm: 'simple',
          ignoredColor: [
            [255, 255, 255, 255], // White
            [0, 0, 0, 255], // Black
          ],
          mode: 'precision',
        })
        .then((color) => {
          const isDark = color.isDark;
          setHeaderColor({ isDark, value: getHeaderColor(color.rgb, theme === 'dark' ? 0.3 : 1) });
        })
        .catch((e) => {
          console.log(e);
        });
    }

    return () => {
      fac.destroy();
    };
  }, [currentSong?.imageUrl, theme]);

  return (
    <PageHeader backgroundColor={headerColor.value}>
      <Group>
        <Text size="xl">Queue</Text>
      </Group>
    </PageHeader>
  );
};
