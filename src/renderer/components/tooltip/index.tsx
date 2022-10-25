import styled from '@emotion/styled';
import { Tooltip as MantineTooltip, TooltipProps } from '@mantine/core';

const StyledTooltip = styled(MantineTooltip)`
  & .mantine-Tooltip-arrow {
    background: var(--tooltip-bg);
  }

  & .mantine-Tooltip-tooltip {
    margin: 20px;
    color: var(--tooltip-text-color);
    background: var(--tooltip-bg);
  }
`;

export const Tooltip = ({ children, ...rest }: TooltipProps) => {
  return (
    <StyledTooltip pl={10} pr={10} py={5} radius="xs" {...rest}>
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
