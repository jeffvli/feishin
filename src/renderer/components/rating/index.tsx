/* eslint-disable jsx-a11y/no-static-element-interactions */
import { MouseEvent } from 'react';
import { Rating as MantineRating, RatingProps as MantineRatingProps } from '@mantine/core';
import debounce from 'lodash/debounce';
import styled from 'styled-components';

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
  const debouncedOnClick = debounce(onClick, 100);

  return (
    <StyledRating
      {...props}
      onClick={(e) => debouncedOnClick(e, props.value)}
    />
  );
};
