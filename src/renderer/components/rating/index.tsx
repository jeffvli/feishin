import { Rating as MantineRating, RatingProps as MantineRatingProps } from '@mantine/core';
import styled from 'styled-components';

type RatingProps = MantineRatingProps;

const StyledRating = styled(MantineRating)``;

export const Rating = ({ ...props }: RatingProps) => {
  return <StyledRating {...props} />;
};
