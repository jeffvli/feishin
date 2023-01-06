import { Rating as MantineRating, RatingProps as MantineRatingProps } from '@mantine/core';
import styled from 'styled-components';

type RatingProps = MantineRatingProps;

const StyledRating = styled(MantineRating)`
  & .mantine-Rating-symbolBody {
    svg {
      stroke: var(--main-fg-secondary);
    }
  }
`;

export const Rating = ({ ...props }: RatingProps) => {
  return <StyledRating {...props} />;
};
