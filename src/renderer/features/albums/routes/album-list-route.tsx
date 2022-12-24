import { VirtualGridContainer } from '/@/renderer/components';
import { AnimatedPage } from '/@/renderer/features/shared';
import { AlbumListHeader } from '/@/renderer/features/albums/components/album-list-header';
import { AlbumListContent } from '/@/renderer/features/albums/components/album-list-content';

const AlbumListRoute = () => {
  return (
    <AnimatedPage>
      <VirtualGridContainer>
        <AlbumListHeader />
        <AlbumListContent />
      </VirtualGridContainer>
    </AnimatedPage>
  );
};

export default AlbumListRoute;
