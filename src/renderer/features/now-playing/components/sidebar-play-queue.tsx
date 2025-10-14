import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { useRef, useState } from 'react';

import { useWindowSettings } from '/@/renderer/store/settings.store';
import { Song } from '/@/shared/types/domain-types';
import { Platform } from '/@/shared/types/types';

export const SidebarPlayQueue = () => {
    const queueRef = useRef<null | { grid: AgGridReactType<Song> }>(null);
    const [search, setSearch] = useState<string | undefined>(undefined);
    const { windowBarStyle } = useWindowSettings();

    const isWeb = windowBarStyle === Platform.WEB;

    return null;
};
