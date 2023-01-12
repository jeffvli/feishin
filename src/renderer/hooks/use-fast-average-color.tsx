import { useEffect, useState } from 'react';
import { FastAverageColor } from 'fast-average-color';

export const useFastAverageColor = (
  src?: string | null,
  srcLoaded?: boolean,
  aglorithm?: 'dominant' | 'simple' | 'sqrt',
) => {
  const [color, setColor] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fac = new FastAverageColor();

    if (src && srcLoaded) {
      fac
        .getColorAsync(src, {
          algorithm: aglorithm || 'dominant',
          ignoredColor: [
            [255, 255, 255, 255, 55], // White
            [0, 0, 0, 255, 20], // Black
            [0, 0, 0, 0, 20], // Transparent
          ],
          mode: 'speed',
        })
        .then((color) => {
          return setColor(color.rgb);
        })
        .catch((e) => {
          console.log('Error fetching average color', e);
          return setColor('rgba(0, 0, 0, 0)');
        });
    } else if (srcLoaded) {
      return setColor('var(--placeholder-bg)');
    }

    return () => {
      fac.destroy();
    };
  }, [aglorithm, srcLoaded, src]);

  return color;
};
