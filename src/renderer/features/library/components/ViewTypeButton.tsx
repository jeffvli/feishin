import { Dispatch } from 'react';
import { ActionIcon, Menu, MenuProps } from '@mantine/core';
import { LayoutGrid, LayoutList, Table } from 'tabler-icons-react';

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
          {type === ViewType.Grid ? (
            <LayoutGrid />
          ) : type === ViewType.Detail ? (
            <LayoutList />
          ) : (
            <Table />
          )}
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          icon={<LayoutGrid size={14} />}
          onClick={() => handler(ViewType.Grid)}
        >
          Grid
        </Menu.Item>
        <Menu.Item
          icon={<LayoutList size={14} />}
          onClick={() => handler(ViewType.Detail)}
        >
          Detail
        </Menu.Item>
        <Menu.Item
          icon={<Table size={14} />}
          onClick={() => handler(ViewType.Table)}
        >
          Table
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
