import type { SkeletonProps as MantineSkeletonProps } from '@mantine/core';
import { Skeleton as MantineSkeleton } from '@mantine/core';
import styled from 'styled-components';

const StyledSkeleton = styled(MantineSkeleton)`
  @keyframes run {
    0% {
      left: 0;
      transform: translateX(-100%);
    }

    80% {
      transform: translateX(100%);
    }

    100% {
      transform: translateX(100%);
    }
  }

  &::before {
    background: var(--skeleton-bg);
  }

  &::after {
    position: absolute;
    background: linear-gradient(90deg, transparent, var(--skeleton-bg), transparent);
    transform: translateX(-100%);
    animation-name: run;
    animation-duration: 1.5s;
    animation-timing-function: linear;
    animation-iteration-count: infinite;
    content: '';
    inset: 0;
  }
`;

export const Skeleton = ({ ...props }: MantineSkeletonProps) => {
  return (
    <StyledSkeleton
      animate={false}
      {...props}
    />
  );
};
