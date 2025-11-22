import { FastAverageColor, FastAverageColorIgnoredColor } from 'fast-average-color';
import { useEffect, useRef, useState } from 'react';

const ignoredColors: FastAverageColorIgnoredColor = [
    [255, 255, 255, 255, 90], // White
    [255, 255, 255, 255, 50], // Light gray
    [255, 255, 255, 255, 30], // Very light gray
    [255, 255, 255, 255, 10], // Very very light gray
    [0, 0, 0, 255, 30], // Black
    [0, 0, 0, 0, 40], // Transparent
];

export const getFastAverageColor = async (args: {
    algorithm?: 'dominant' | 'simple' | 'sqrt';
    src: string;
}) => {
    const fac = new FastAverageColor();
    const background = await fac.getColorAsync(args.src, {
        algorithm: args.algorithm || 'dominant',
        ignoredColor: ignoredColors,
        mode: 'speed',
    });

    return background.rgb;
};

export const useFastAverageColor = (args: {
    algorithm?: 'dominant' | 'simple' | 'sqrt';
    default?: string;
    id?: string;
    src?: null | string;
    srcLoaded?: boolean;
}) => {
    const { algorithm, default: defaultColor, id, src, srcLoaded } = args;
    const idRef = useRef<string | undefined>(id);

    const [isLoading, setIsLoading] = useState(false);

    const [background, setBackground] = useState<{
        background: string | undefined;
        isDark: boolean;
        isLight: boolean;
    }>({
        background: defaultColor,
        isDark: true,
        isLight: false,
    });

    useEffect(() => {
        let isMounted = true;
        const fac = new FastAverageColor();

        if (src && srcLoaded) {
            setIsLoading(true);
            fac.getColorAsync(src, {
                algorithm: algorithm || 'dominant',
                ignoredColor: ignoredColors,
                mode: 'speed',
            })
                .then((color) => {
                    if (isMounted) {
                        idRef.current = id;
                        setBackground({
                            background: color.rgb,
                            isDark: color.isDark,
                            isLight: color.isLight,
                        });
                        setIsLoading(false);
                    }
                })
                .catch((e) => {
                    if (isMounted) {
                        console.error('Error fetching average color', e);
                        idRef.current = id;
                        setBackground({
                            background: 'rgba(0, 0, 0, 0)',
                            isDark: true,
                            isLight: false,
                        });
                        setIsLoading(false);
                    }
                });
        } else if (srcLoaded) {
            if (isMounted) {
                idRef.current = id;
                setBackground({
                    background: 'var(--theme-colors-foreground-muted)',
                    isDark: true,
                    isLight: false,
                });
            }
        }

        return () => {
            isMounted = false;
            fac.destroy();
        };
    }, [algorithm, srcLoaded, src, id]);

    return {
        background: background.background,
        colorId: idRef.current,
        isDark: background.isDark,
        isLight: background.isLight,
        isLoading,
    };
};
