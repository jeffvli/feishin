import { Dispatch } from 'react';
import { ActionIcon, Menu, MenuProps } from '@mantine/core';
import { RiLayoutGridFill, RiLayoutTopFill } from 'react-icons/ri';

export enum ViewType {
  Detail = 'detail',
  Grid = 'grid',
  Table = 'table',
}

interface ViewTypeButtonProps {
  handler: Dispatch<ViewType>;
  menuProps: MenuProps;
  type: ViewType;
}

export const ViewTypeButton = ({
  type,
  menuProps,
  handler,
}: ViewTypeButtonProps) => {
  return (
    <Menu {...menuProps}>
      <Menu.Target>
        <ActionIcon variant="transparent">
          {type === ViewType.Grid ? <RiLayoutGridFill /> : <RiLayoutTopFill />}
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          icon={<RiLayoutGridFill />}
          onClick={() => handler(ViewType.Grid)}
        >
          Grid
        </Menu.Item>
        <Menu.Item
          icon={<RiLayoutTopFill />}
          onClick={() => handler(ViewType.Table)}
        >
          Table
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
