/* eslint-disable jsx-a11y/no-static-element-interactions */
import { useCallback } from 'react';
import { Rating as MantineRating, RatingProps } from '@mantine/core';
import debounce from 'lodash/debounce';
import styled from 'styled-components';

const StyledRating = styled(MantineRating)`
    & .mantine-Rating-symbolBody {
        svg {
            stroke: var(--main-fg-secondary);
        }
    }
`;

export const Rating = ({ onChange, ...props }: RatingProps) => {
    const valueChange = useCallback(
        (rating: number) => {
            if (onChange) {
                if (rating === props.value) {
                    onChange(0);
                } else {
                    onChange(rating);
                }
            }
        },
        [onChange, props.value],
    );

    const debouncedOnChange = debounce(valueChange, 100);

    return (
        <StyledRating
            {...props}
            onChange={(e) => {
                debouncedOnChange(e);
            }}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
            }}
        />
    );
};
