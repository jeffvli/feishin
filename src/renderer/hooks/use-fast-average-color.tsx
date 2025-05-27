import { FastAverageColor } from 'fast-average-color';
import { useEffect, useRef, useState } from 'react';

export const useFastAverageColor = (args: {
    algorithm?: 'dominant' | 'simple' | 'sqrt';
    id?: string;
    src?: null | string;
    srcLoaded?: boolean;
}) => {
    const { algorithm, id, src, srcLoaded } = args;
    const idRef = useRef<string | undefined>(id);

    const [background, setBackground] = useState<string | undefined>(undefined);

    useEffect(() => {
        const fac = new FastAverageColor();

        if (src && srcLoaded) {
            fac.getColorAsync(src, {
                algorithm: algorithm || 'dominant',
                ignoredColor: [
                    [255, 255, 255, 255, 90], // White
                    [0, 0, 0, 255, 30], // Black
                    [0, 0, 0, 0, 40], // Transparent
                ],
                mode: 'precision',
            })
                .then((color) => {
                    idRef.current = id;
                    return setBackground(color.rgb);
                })
                .catch((e) => {
                    console.log('Error fetching average color', e);
                    idRef.current = id;
                    return setBackground('rgba(0, 0, 0, 0)');
                });
        } else if (srcLoaded) {
            idRef.current = id;
            return setBackground('var(--theme-colors-foreground-muted)');
        }

        return () => {
            fac.destroy();
        };
    }, [algorithm, srcLoaded, src, id]);

    return { background, colorId: idRef.current };
};
