import type { BadgeProps as MantineBadgeProps } from '@mantine/core';
import { createPolymorphicComponent, Badge as MantineBadge } from '@mantine/core';
import styled from 'styled-components';

export type BadgeProps = MantineBadgeProps;

const StyledBadge = styled(MantineBadge)<BadgeProps>`
  .mantine-Badge-root {
    color: var(--badge-fg);
  }

  .mantine-Badge-inner {
    padding: 0 0.5rem;
    color: var(--badge-fg);
  }
`;

const _Badge = ({ children, ...props }: BadgeProps) => {
  return (
    <StyledBadge
      radius="md"
      size="sm"
      styles={{
        root: { background: 'var(--badge-bg)' },
      }}
      {...props}
    >
      {children}
    </StyledBadge>
  );
};

export const Badge = createPolymorphicComponent<'button', BadgeProps>(_Badge);
