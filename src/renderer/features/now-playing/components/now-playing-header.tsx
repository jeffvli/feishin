import { useEffect, useState } from 'react';
import { Group } from '@mantine/core';
import { FastAverageColor } from 'fast-average-color';
import { PageHeader, TextTitle } from '/@/renderer/components';
import { useCurrentSong } from '/@/renderer/store';
import { getHeaderColor } from '/@/renderer/utils';
import { useTheme } from '/@/renderer/hooks';

export const NowPlayingHeader = () => {
  const [headerColor, setHeaderColor] = useState({ isDark: false, value: 'rgba(0, 0, 0, 0)' });
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
          return setHeaderColor({
            isDark,
            value: getHeaderColor(color.rgb, theme === 'dark' ? 0.5 : 0.8),
          });
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
        <TextTitle
          fw="bold"
          order={3}
        >
          Queue
        </TextTitle>
      </Group>
    </PageHeader>
  );
};
