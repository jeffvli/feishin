import { MutableRefObject } from 'react';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { useClickOutside } from '@mantine/hooks';

export const useClickOutsideDeselect = (tableRef: MutableRefObject<AgGridReactType | null>) => {
  const handleDeselect = () => {
    if (tableRef.current) {
      tableRef.current.api.deselectAll();
    }
  };

  const ref = useClickOutside(handleDeselect);

  return ref;
};
