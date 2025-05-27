import { Grid as MantineGrid, GridProps as MantineGridProps } from '@mantine/core';

export interface GridProps extends MantineGridProps {}

export const Grid = ({ classNames, style, ...props }: GridProps) => {
    return (
        <MantineGrid
            classNames={{ ...classNames }}
            style={{ ...style }}
            {...props}
        />
    );
};

Grid.Col = MantineGrid.Col;
