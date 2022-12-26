import { useElementSize } from '@mantine/hooks';

interface UseContainerQueryProps {
  lg?: number;
  md?: number;
  sm?: number;
  xl?: number;
}

export const useContainerQuery = (props?: UseContainerQueryProps) => {
  const { lg, md, sm, xl } = props || {};
  const { ref, width, height } = useElementSize();

  const isXs = width >= 0;
  const isSm = width >= (sm || 600);
  const isMd = width >= (md || 768);
  const isLg = width >= (lg || 1200);
  const isXl = width >= (xl || 1500);

  return { height, isLg, isMd, isSm, isXl, isXs, ref, width };
};
