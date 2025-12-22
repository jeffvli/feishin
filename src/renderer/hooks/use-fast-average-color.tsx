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
    return new Promise<string>((resolve, reject) => {
        setTimeout(() => {
            const fac = new FastAverageColor();
            fac.getColorAsync(args.src, {
                algorithm: args.algorithm || 'dominant',
                ignoredColor: ignoredColors,
                mode: 'speed',
            })
                .then((background) => {
                    resolve(background.rgb);
                    fac.destroy();
                })
                .catch((error) => {
                    fac.destroy();
                    reject(error);
                });
        });
    });
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
    const processingSrcRef = useRef<null | string | undefined>(null);

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
        let fac: FastAverageColor | null = null;
        let timeoutId: NodeJS.Timeout | null = null;

        // Reset loading state when src changes or srcLoaded becomes false
        if (!src || !srcLoaded) {
            setIsLoading(false);
            processingSrcRef.current = null;
        }

        if (src && srcLoaded) {
            processingSrcRef.current = src;
            setIsLoading(true);

            timeoutId = setTimeout(() => {
                // Check if src has changed since we started processing
                if (!isMounted || processingSrcRef.current !== src) {
                    return;
                }

                fac = new FastAverageColor();
                fac.getColorAsync(src, {
                    algorithm: algorithm || 'dominant',
                    ignoredColor: ignoredColors,
                    mode: 'speed',
                })
                    .then((color) => {
                        // Only update if this is still the current src being processed
                        if (isMounted && processingSrcRef.current === src) {
                            idRef.current = id;
                            setBackground({
                                background: color.rgb,
                                isDark: color.isDark,
                                isLight: color.isLight,
                            });
                            setIsLoading(false);
                            processingSrcRef.current = null;
                        }
                        if (fac) {
                            fac.destroy();
                            fac = null;
                        }
                    })
                    .catch((e) => {
                        // Only update if this is still the current src being processed
                        if (isMounted && processingSrcRef.current === src) {
                            console.error('Error fetching average color', e);
                            idRef.current = id;
                            setBackground({
                                background: 'rgba(0, 0, 0, 0)',
                                isDark: true,
                                isLight: false,
                            });
                            setIsLoading(false);
                            processingSrcRef.current = null;
                        }
                        if (fac) {
                            fac.destroy();
                            fac = null;
                        }
                    });
            });
        } else if (srcLoaded) {
            if (isMounted) {
                idRef.current = id;
                setBackground({
                    background: 'var(--theme-colors-foreground-muted)',
                    isDark: true,
                    isLight: false,
                });
                setIsLoading(false);
                processingSrcRef.current = null;
            }
        }

        return () => {
            isMounted = false;
            processingSrcRef.current = null;
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
            if (fac) {
                fac.destroy();
                fac = null;
            }
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

export const useWaitForColorCalculation = (args: {
    hasImage: boolean;
    isLoading: boolean;
    routeId: string;
    showBlurredImage: boolean;
    timeoutMs?: number;
}) => {
    const { hasImage, isLoading, routeId, showBlurredImage, timeoutMs = 1000 } = args;
    const [timeoutReached, setTimeoutReached] = useState(false);

    const shouldWaitForColor = hasImage && !showBlurredImage;

    useEffect(() => {
        setTimeoutReached(false);

        if (!shouldWaitForColor) {
            return;
        }

        const timeoutId = setTimeout(() => {
            setTimeoutReached(true);
        }, timeoutMs);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [shouldWaitForColor, routeId, timeoutMs]);

    const isReady = !shouldWaitForColor || !isLoading || timeoutReached;

    return { isReady };
};
