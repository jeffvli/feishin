import { useEffect, useRef } from 'react';
import { useInView } from 'framer-motion';

export const useFixedTableHeader = () => {
  const intersectRef = useRef<HTMLDivElement | null>(null);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  const isNotPastTableIntersection = useInView(intersectRef, {
    margin: '-64px 0px 0px 0px',
  });

  const tableInView = useInView(tableContainerRef, {
    margin: '-128px 0px 0px 0px',
  });

  useEffect(() => {
    const header = document.querySelector('main .ag-header');
    const root = document.querySelector('main .ag-root');

    if (isNotPastTableIntersection || !tableInView) {
      header?.classList.remove('ag-header-fixed');
      root?.classList.remove('ag-header-fixed-margin');
    } else {
      header?.classList.add('ag-header-fixed');
      root?.classList.add('ag-header-fixed-margin');
    }
  }, [isNotPastTableIntersection, tableInView]);

  return { intersectRef, tableContainerRef };
};
