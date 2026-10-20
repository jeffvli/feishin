import type { MouseEvent } from 'react';

import { api } from '/@/renderer/api';
import { ContextMenuController } from '/@/renderer/features/context-menu/context-menu-controller';
import { useAuthStore } from '/@/renderer/store';
import { LibraryItem } from '/@/shared/types/domain-types';

// right-click an album that's only known by its id (pins, profile favourites): the normal album menu
export const albumMenuById = (id: string) => (e: MouseEvent) => {
    e.preventDefault();
    const serverId = useAuthStore.getState().currentServer?.id;
    if (!serverId) return;
    const { clientX, clientY } = e;
    api.controller
        .getAlbumDetail({ apiClientProps: { serverId }, query: { id } })
        .then((album) => {
            if (!album) return;
            ContextMenuController.call({
                cmd: { items: [album], type: LibraryItem.ALBUM },
                event: { clientX, clientY, preventDefault: () => {} } as unknown as MouseEvent,
            });
        })
        .catch(() => {});
};
