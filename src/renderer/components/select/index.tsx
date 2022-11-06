import styled from '@emotion/styled';
import {
  Select as MantineSelect,
  SelectProps as MantineSelectProps,
} from '@mantine/core';

interface SelectProps extends MantineSelectProps {
  maxWidth?: number | string;
  width?: number | string;
}

const StyledSelect = styled(MantineSelect)`
  & [data-selected='true'] {
    background: black;
  }

  & .mantine-Select-itemsWrapper {
    & .mantine-Select-item {
      padding: 40px;
    }
  }
`;

export const Select = ({ width, maxWidth, ...props }: SelectProps) => {
  return (
    <StyledSelect
      withinPortal
      styles={{
        dropdown: {
          background: 'var(--dropdown-menu-bg)',
        },
        item: {
          '&:hover': {
            background: 'var(--dropdown-menu-bg-hover)',
          },
          '&[data-selected="true"]': {
            '&:hover': {
              background: 'var(--dropdown-menu-bg-hover)',
            },
            background: 'none',
            color: 'var(--primary-color)',
          },
          padding: '.3rem',
        },
        itemsWrapper: {
          background: 'var(--dropdown-menu-bg)',
        },
      }}
      sx={{ maxWidth, width }}
      transition="pop"
      transitionDuration={100}
      {...props}
    />
  );
};

Select.defaultProps = {
  maxWidth: undefined,
  width: undefined,
};
