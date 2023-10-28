/* eslint-disable jsx-a11y/no-static-element-interactions */
import { Rating as MantineRating, RatingProps } from '@mantine/core';
import debounce from 'lodash/debounce';
import styled from 'styled-components';
import { Tooltip } from '/@/renderer/components/tooltip';
import { useCallback } from 'react';

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
        <Tooltip
            label="Click on the same value to clear"
            openDelay={1000}
            onClick={(e) => {
                // Why? For some reason, in prod, not having this results in scroll to top...
                e.preventDefault();
                e.stopPropagation();
            }}
        >
            <StyledRating
                {...props}
                onChange={(e) => {
                    debouncedOnChange(e);
                }}
            />
        </Tooltip>
    );
};
