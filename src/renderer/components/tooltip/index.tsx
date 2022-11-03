import styled from '@emotion/styled';
import { Tooltip as MantineTooltip, TooltipProps } from '@mantine/core';

const StyledTooltip = styled(MantineTooltip)`
  & .mantine-Tooltip-tooltip {
    margin: 20px;
  }
`;

export const Tooltip = ({ children, ...rest }: TooltipProps) => {
  return (
    <StyledTooltip
      withinPortal
      pl={10}
      pr={10}
      py={5}
      radius="xs"
      styles={{
        tooltip: {
          background: 'var(--tooltip-bg)',
          color: 'var(--tooltip-fg)',
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
