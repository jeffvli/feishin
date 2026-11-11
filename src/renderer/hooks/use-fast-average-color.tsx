import { FastAverageColor, FastAverageColorIgnoredColor } from 'fast-average-color';
import { useEffect, useRef, useState } from 'react';

import { AccentCandidate, pickAccentClusters } from '/@/shared/themes/pick-accent-color';

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

const ART_SAMPLE_SIZE = 64;

// Decodes the cover into a small canvas so clustering can inspect the actual
// pixels; a tainted canvas (third-party art without CORS) or a dead url
// rejects so the collector logs it and stops retrying that cover.
const getCoverPixels = (src: string): Promise<Uint8ClampedArray> => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';

        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = ART_SAMPLE_SIZE;
            canvas.height = ART_SAMPLE_SIZE;

            const context = canvas.getContext('2d', { willReadFrequently: true });
            if (!context) {
                reject(new Error('no 2d canvas context'));
                return;
            }

            // Nearest neighbor on purpose: smooth scaling blends thin vivid
            // features (lettering, strokes) into the background and erases pops.
            context.imageSmoothingEnabled = false;
            context.drawImage(image, 0, 0, ART_SAMPLE_SIZE, ART_SAMPLE_SIZE);

            try {
                resolve(context.getImageData(0, 0, ART_SAMPLE_SIZE, ART_SAMPLE_SIZE).data);
            } catch (error) {
                reject(error);
            }
        };

        image.onerror = () => {
            reject(new Error(`album art failed to load: ${src}`));
        };

        image.src = src;
    });
};

// ponytail: one 64x64 decode per cover and coarse color bins, no palette
// library. The art accent collector dedupes by image key, so a cover is
// sampled once per play.
export const getArtColorCandidates = async (src: null | string): Promise<AccentCandidate[]> => {
    if (!src) {
        return [];
    }

    const pixels = await getCoverPixels(src);

    return pickAccentClusters(pixels);
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
