import { Grid as MantineGrid, GridProps as MantineGridProps } from '@mantine/core';
import { memo, useMemo } from 'react';

export interface GridProps extends MantineGridProps {}

const BaseGrid = ({ classNames, style, ...props }: GridProps) => {
    const memoizedClassNames = useMemo(() => ({ ...classNames }), [classNames]);
    const memoizedStyle = useMemo(() => ({ ...style }), [style]);

    return <MantineGrid classNames={memoizedClassNames} style={memoizedStyle} {...props} />;
};

BaseGrid.displayName = 'Grid';

export const Grid = memo(BaseGrid) as unknown as typeof BaseGrid & { Col: typeof MantineGrid.Col };

(Grid as typeof Grid & { Col: typeof MantineGrid.Col }).Col = MantineGrid.Col;
