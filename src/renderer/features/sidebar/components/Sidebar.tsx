import styled from 'styled-components';
import { Home, Notebook, Search } from 'tabler-icons-react';
import { UserMenu } from 'renderer/features/user-menu';
import { AppRoute } from 'renderer/router/utils/routes';
import { ListItem } from './ListItem';

const SidebarContainer = styled.div`
  width: 100%;
  height: 100%;
`;

const ItemGroup = styled.ul``;

const Item = styled.li``;

const StyledSidebar = styled.div``;

export const Sidebar = () => {

  return (
    <StyledSidebar>
      <ListItem icon={<Home />}>
        <ListItem.Link to={AppRoute.HOME}>
          <Home />
          Home
        </ListItem.Link>
      </ListItem>
      <ListItem>
        <ListItem.Link to={AppRoute.SEARCH}>
          <Search />
          Search
        </ListItem.Link>
      </ListItem>
      <ListItem>
        <ListItem.Link to={AppRoute.LIBRARY}>
          <Notebook />
          Your Library
        </ListItem.Link>
      </ListItem>
      <UserMenu />
    </StyledSidebar>
  );
};
