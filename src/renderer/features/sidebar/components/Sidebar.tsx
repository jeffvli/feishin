import {
  RiDashboardFill,
  RiFileList2Fill,
  RiSearch2Fill,
} from 'react-icons/ri';
import styled from 'styled-components';
import { AppRoute } from 'renderer/router/utils/routes';
import { ListItem } from './ListItem';

const StyledSidebar = styled.div``;

export const Sidebar = () => {
  return (
    <StyledSidebar>
      <ListItem>
        <ListItem.Link to={AppRoute.HOME}>
          <RiDashboardFill size={20} />
          Home
        </ListItem.Link>
      </ListItem>
      <ListItem>
        <ListItem.Link to={AppRoute.SEARCH}>
          <RiSearch2Fill size={20} />
          Search
        </ListItem.Link>
      </ListItem>
      <ListItem>
        <ListItem.Link to={AppRoute.LIBRARY}>
          <RiFileList2Fill size={20} />
          Your Library
        </ListItem.Link>
      </ListItem>
    </StyledSidebar>
  );
};
