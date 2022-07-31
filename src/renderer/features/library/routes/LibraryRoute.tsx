import styled from 'styled-components';
import { AppRoute } from '../../../router/utils/routes';
import { AnimatedPage } from '../../shared/components/AnimatedPage';
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
