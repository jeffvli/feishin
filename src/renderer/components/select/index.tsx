import type {
  SelectProps as MantineSelectProps,
  MultiSelectProps as MantineMultiSelectProps,
} from '@mantine/core';
import { Select as MantineSelect, MultiSelect as MantineMultiSelect } from '@mantine/core';
import styled from 'styled-components';

interface SelectProps extends MantineSelectProps {
  maxWidth?: number | string;
  width?: number | string;
}

export interface MultiSelectProps extends MantineMultiSelectProps {
  maxWidth?: number | string;
  width?: number | string;
}

const StyledSelect = styled(MantineSelect)`
  & [data-selected='true'] {
    background: var(--input-bg);
  }

  & [data-disabled='true'] {
    background: var(--input-bg);
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
      }}
      sx={{ maxWidth, width }}
      transitionProps={{ duration: 100, transition: 'fade' }}
      {...props}
    />
  );
};

const StyledMultiSelect = styled(MantineMultiSelect)`
  & [data-selected='true'] {
    background: var(--input-select-bg);
  }

  & [data-disabled='true'] {
    background: var(--input-bg);
    opacity: 0.6;
  }

  & .mantine-MultiSelect-itemsWrapper {
    & .mantine-Select-item {
      padding: 40px;
    }
  }
`;

export const MultiSelect = ({ width, maxWidth, ...props }: MultiSelectProps) => {
  return (
    <StyledMultiSelect
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
          padding: '.5rem .1rem',
        },
        value: {
          margin: '.2rem',
          paddingBottom: '1rem',
          paddingLeft: '1rem',
          paddingTop: '1rem',
        },
      }}
      sx={{ maxWidth, width }}
      transitionProps={{ duration: 100, transition: 'fade' }}
      {...props}
    />
  );
};

Select.defaultProps = {
  maxWidth: undefined,
  width: undefined,
};

MultiSelect.defaultProps = {
  maxWidth: undefined,
  width: undefined,
};
