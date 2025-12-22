import { useElementSize } from '/@/shared/hooks/use-element-size';

interface UseContainerQueryProps {
    '2xl'?: number;
    '3xl'?: number;
    lg?: number;
    md?: number;
    sm?: number;
    xl?: number;
    xs?: number;
}

export const useContainerQuery = (props?: UseContainerQueryProps) => {
    const { '2xl': xxl, '3xl': xxxl, lg, md, sm, xl, xs } = props || {};
    const { height, ref, width } = useElementSize();

    const isXs = width >= (xs || 360);
    const isSm = width >= (sm || 600);
    const isMd = width >= (md || 768);
    const isLg = width >= (lg || 1200);
    const isXl = width >= (xl || 1500);
    const is2xl = width >= (xxl || 1920);
    const is3xl = width >= (xxxl || 2560);

    const isCalculated = width !== 0;

    return { height, is2xl, is3xl, isCalculated, isLg, isMd, isSm, isXl, isXs, ref, width };
};
