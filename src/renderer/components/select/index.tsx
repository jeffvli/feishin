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

    & .mantine-Select-label {
        margin-bottom: 0.5rem;
        font-family: var(--label-font-family);
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
            comboboxProps={{
                transitionProps: { duration: 100, transition: 'fade' },
                withinPortal: true,
            }}
            style={{ maxWidth, width }}
            styles={{
                dropdown: {
                    background: 'var(--dropdown-menu-bg)',
                    filter: 'drop-shadow(0 0 5px rgb(0, 0, 0, 20%))',
                },
                input: {
                    background: 'var(--input-bg)',
                    color: 'var(--input-fg)',
                },
                option: {
                    '&:hover': {
                        background: 'var(--dropdown-menu-bg-hover)',
                    },
                    '&[dataHovered]': {
                        background: 'var(--dropdown-menu-bg-hover)',
                    },
                    '&[dataSelected="true"]': {
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
            comboboxProps={{
                transitionProps: { duration: 100, transition: 'fade' },
                withinPortal: true,
            }}
            style={{ maxWidth, width }}
            styles={{
                dropdown: {
                    background: 'var(--dropdown-menu-bg)',
                    filter: 'drop-shadow(0 0 5px rgb(0, 0, 0, 20%))',
                },
                input: {
                    background: 'var(--input-bg)',
                    color: 'var(--input-fg)',
                },
                option: {
                    '&:hover': {
                        background: 'var(--dropdown-menu-bg-hover)',
                    },
                    '&[dataHovered]': {
                        background: 'var(--dropdown-menu-bg-hover)',
                    },
                    '&[dataSelected="true"]': {
                        '&:hover': {
                            background: 'var(--dropdown-menu-bg-hover)',
                        },
                        background: 'none',
                        color: 'var(--primary-color)',
                    },
                    color: 'var(--dropdown-menu-fg)',
                    padding: '.5rem .1rem',
                },
                pill: {
                    margin: '.2rem',
                    paddingBottom: '1rem',
                    paddingLeft: '1rem',
                    paddingTop: '1rem',
                },
            }}
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
