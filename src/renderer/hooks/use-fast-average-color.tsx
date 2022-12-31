import { useEffect, useState } from 'react';
import { FastAverageColor } from 'fast-average-color';

export const useFastAverageColor = (
  src?: string | null,
  aglorithm?: 'dominant' | 'simple' | 'sqrt',
) => {
  const [color, setColor] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fac = new FastAverageColor();

    if (src) {
      fac
        .getColorAsync(src, {
          algorithm: aglorithm || 'dominant',
          ignoredColor: [
            [255, 255, 255, 255], // White
            [0, 0, 0, 255], // Black
          ],
          mode: 'precision',
        })
        .then((color) => {
          return setColor(color.rgb);
        })
        .catch((e) => {
          console.log('Error fetching average color', e);
          return setColor('rgba(0, 0, 0, 0)');
        });
    }

    return () => {
      fac.destroy();
    };
  }, [aglorithm, src]);

  return color;
};
