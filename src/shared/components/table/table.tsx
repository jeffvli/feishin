import { Table as MantineTable, TableProps as MantineTableProps } from '@mantine/core';

export interface TableProps extends MantineTableProps {}

export const Table = (props: TableProps) => {
    return <MantineTable {...props} />;
};

Table.Tr = MantineTable.Tr;
Table.Td = MantineTable.Td;
Table.Th = MantineTable.Th;
Table.Tbody = MantineTable.Tbody;
