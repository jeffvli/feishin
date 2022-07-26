import styled from 'styled-components';
import { AnimatedPage } from 'renderer/features/shared/components/AnimatedPage';
import { AppRoute } from 'renderer/router/utils/routes';
import LibraryTab from '../components/LibraryTab';

const TabContainer = styled.div`
  display: flex;
  flex-flow: row wrap;
  gap: 1rem;
`;

export const LibraryRoute = () => {
  return (
    <AnimatedPage>
      <TabContainer>
        <LibraryTab to={AppRoute.LIBRARY_ALBUMS}>Albums</LibraryTab>
        <LibraryTab to={AppRoute.LIBRARY_ALBUMARTISTS}>
          Album Artists
        </LibraryTab>
        <LibraryTab to={AppRoute.LIBRARY_ARTISTS}>Artists</LibraryTab>
      </TabContainer>
    </AnimatedPage>
  );
};
