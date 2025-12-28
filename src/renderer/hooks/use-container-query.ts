import { useElementSize } from '/@/shared/hooks/use-element-size';

interface UseContainerQueryProps {
    '2xl'?: number;
    '3xl'?: number;
    '4xl'?: number;
    '5xl'?: number;
    lg?: number;
    md?: number;
    sm?: number;
    xl?: number;
    xs?: number;
}

export const useContainerQuery = (props?: UseContainerQueryProps) => {
    const {
        '2xl': xxl,
        '3xl': xxxl,
        '4xl': xxxxl,
        '5xl': xxxxxl,
        lg,
        md,
        sm,
        xl,
        xs,
    } = props || {};
    const { height, ref, width } = useElementSize();

    const isXs = width >= (xs || 360);
    const isSm = width >= (sm || 480);
    const isMd = width >= (md || 600);
    const isLg = width >= (lg || 768);
    const isXl = width >= (xl || 960);
    const is2xl = width >= (xxl || 1152);
    const is3xl = width >= (xxxl || 1280);
    const is4xl = width >= (xxxxl || 1440);
    const is5xl = width >= (xxxxxl || 1600);

    const isCalculated = width !== 0;

    return {
        height,
        is2xl,
        is3xl,
        is4xl,
        is5xl,
        isCalculated,
        isLg,
        isMd,
        isSm,
        isXl,
        isXs,
        ref,
        width,
    };
};
