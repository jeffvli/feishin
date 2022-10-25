import styled from '@emotion/styled';
import {
  RiDashboardFill,
  RiFileList2Fill,
  RiSearch2Line,
} from 'react-icons/ri';
import { AppRoute } from '../../../router/routes';
import { ListItem } from './list-item';

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
        <ListItem.Link to={AppRoute.LIBRARY}>
          <RiFileList2Fill size={20} />
          Library
        </ListItem.Link>
      </ListItem>
      <ListItem>
        <ListItem.Link to={AppRoute.SEARCH}>
          <RiSearch2Line size={20} />
          Search
        </ListItem.Link>
      </ListItem>
    </StyledSidebar>
  );
};
