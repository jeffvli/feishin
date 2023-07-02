/* eslint-disable jsx-a11y/no-static-element-interactions */
import { MouseEvent } from 'react';
import { Rating as MantineRating, RatingProps as MantineRatingProps } from '@mantine/core';
import styled from 'styled-components';
import { Tooltip } from '/@/renderer/components/tooltip';

interface RatingProps extends Omit<MantineRatingProps, 'onClick'> {
    onClick: (e: MouseEvent<HTMLDivElement>, value: number | undefined) => void;
}

const StyledRating = styled(MantineRating)`
    & .mantine-Rating-symbolBody {
        svg {
            stroke: var(--main-fg-secondary);
        }
    }
`;

export const Rating = ({ onClick, ...props }: RatingProps) => {
    // const debouncedOnClick = debounce(onClick, 100);

    return (
        <Tooltip
            label="Double click to clear"
            openDelay={1000}
        >
            <StyledRating
                {...props}
                onDoubleClick={(e) => onClick(e, props.value)}
            />
        </Tooltip>
    );
};
