import { Pagination as MantinePagination, PaginationProps } from '@mantine/core';
import styled from 'styled-components';

const StyledPagination = styled(MantinePagination)`
  & .mantine-Pagination-item {
    color: var(--btn-default-fg);
    background-color: var(--btn-default-bg);
    border: none;
    transition: background 0.2s ease-in-out, color 0.2s ease-in-out;

    &:hover {
      color: var(--btn-default-fg-hover);
      background-color: var(--btn-default-bg-hover);
    }

    &[data-active] {
      color: var(--btn-primary-fg);
      background-color: var(--btn-primary-bg);
    }

    &:hover &[data-active] {
      color: var(--btn-primary-fg-hover);
      background-color: var(--btn-primary-bg-hover);
    }

    &[data-dots] {
      background-color: transparent;
    }
  }
`;

export const Pagination = ({ ...props }: PaginationProps) => {
  return (
    <StyledPagination
      radius="xl"
      size="md"
      {...props}
    />
  );
};
