import { VirtualGridContainer, VirtualInfiniteGridRef } from '/@/renderer/components';
import { AnimatedPage } from '/@/renderer/features/shared';
import { AlbumListHeader } from '/@/renderer/features/albums/components/album-list-header';
import { AlbumListContent } from '/@/renderer/features/albums/components/album-list-content';
import { useRef } from 'react';

const AlbumListRoute = () => {
  const gridRef = useRef<VirtualInfiniteGridRef | null>(null);

  return (
    <AnimatedPage>
      <VirtualGridContainer>
        <AlbumListHeader gridRef={gridRef} />
        <AlbumListContent gridRef={gridRef} />
      </VirtualGridContainer>
    </AnimatedPage>
  );
};

export default AlbumListRoute;
