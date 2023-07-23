import { useEffect, useRef, useState } from 'react';
import { FastAverageColor } from 'fast-average-color';

export const useFastAverageColor = (args: {
    algorithm?: 'dominant' | 'simple' | 'sqrt';
    id?: string;
    src?: string | null;
    srcLoaded?: boolean;
}) => {
    const { algorithm, src, srcLoaded, id } = args;
    const idRef = useRef<string | undefined>(id);

    const [color, setColor] = useState<string | undefined>(undefined);

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
                    return setColor(color.rgb);
                })
                .catch((e) => {
                    console.log('Error fetching average color', e);
                    idRef.current = id;
                    return setColor('rgba(0, 0, 0, 0)');
                });
        } else if (srcLoaded) {
            idRef.current = id;
            return setColor('var(--placeholder-bg)');
        }

        return () => {
            fac.destroy();
        };
    }, [algorithm, srcLoaded, src, id]);

    return { color, colorId: idRef.current };
};
