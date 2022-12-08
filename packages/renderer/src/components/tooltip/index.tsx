import type { TooltipProps } from '@mantine/core';
import { Tooltip as MantineTooltip } from '@mantine/core';
import styled from 'styled-components';

const StyledTooltip = styled(MantineTooltip)`
  & .mantine-Tooltip-tooltip {
    margin: 20px;
  }
`;

export const Tooltip = ({ children, ...rest }: TooltipProps) => {
  return (
    <StyledTooltip
      multiline
      withinPortal
      pl={10}
      pr={10}
      py={5}
      radius="xs"
      styles={{
        tooltip: {
          background: 'var(--tooltip-bg)',
          boxShadow: '4px 4px 10px 0px rgba(0,0,0,0.2)',
          color: 'var(--tooltip-fg)',
          fontSize: '1.1rem',
          fontWeight: 550,
          maxWidth: '250px',
        },
      }}
      {...rest}
    >
      {children}
    </StyledTooltip>
  );
};

Tooltip.defaultProps = {
  openDelay: 0,
  position: 'top',
  transition: 'fade',
  transitionDuration: 250,
  withArrow: true,
  withinPortal: true,
};
