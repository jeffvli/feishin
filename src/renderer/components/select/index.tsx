import {
  Select as MantineSelect,
  SelectProps as MantineSelectProps,
} from '@mantine/core';
import styled from 'styled-components';

interface SelectProps extends MantineSelectProps {
  maxWidth?: number | string;
  width?: number | string;
}

const StyledSelect = styled(MantineSelect)`
  & [data-selected='true'] {
    background: var(--input-select-bg);
  }

  & .mantine-Select-disabled {
    background: var(--input-select-bg);
    opacity: 0.6;
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
          filter: 'drop-shadow(0 0 5px rgb(0, 0, 0, 20%))',
        },
        input: {
          background: 'var(--input-bg)',
          color: 'var(--input-fg)',
        },
        item: {
          '&:hover': {
            background: 'var(--dropdown-menu-bg-hover)',
          },
          '&[data-hovered]': {
            background: 'var(--dropdown-menu-bg-hover)',
          },
          '&[data-selected="true"]': {
            '&:hover': {
              background: 'var(--dropdown-menu-bg-hover)',
            },
            background: 'none',
            color: 'var(--primary-color)',
          },
          color: 'var(--dropdown-menu-fg)',
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
