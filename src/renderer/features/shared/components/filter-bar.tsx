import { PaperProps } from '@mantine/core';
import styled from 'styled-components';
import { Paper } from '/@/renderer/components';

const StyledFilterBar = styled(Paper)`
    z-index: 1;
    padding: 1rem;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 65%);
`;

export const FilterBar = ({ children, ...props }: PaperProps) => {
    return <StyledFilterBar {...props}>{children}</StyledFilterBar>;
};
