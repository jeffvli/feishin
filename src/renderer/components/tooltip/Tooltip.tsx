import { Tooltip as MantineTooltip, TooltipProps } from '@mantine/core';

export const Tooltip = ({ children, ...rest }: TooltipProps) => {
  return (
    <MantineTooltip
      radius="xs"
      styles={{
        arrow: {
          background: 'var(--tooltip-bg)',
        },
        root: {
          background: 'var(--tooltip-bg)',
          color: 'var(--tooltip-text-color)',
          padding: '5px',
        },
      }}
      {...rest}
    >
      {children}
    </MantineTooltip>
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
