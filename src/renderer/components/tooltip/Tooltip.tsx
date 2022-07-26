import { Tooltip as MantineTooltip, TooltipProps } from '@mantine/core';
import styles from './Tooltip.module.scss';

export const Tooltip = ({ children, ...rest }: TooltipProps) => {
  return (
    <MantineTooltip
      classNames={{ arrow: styles.arrow, body: styles.body }}
      radius="xs"
      styles={{
        arrow: {
          background: 'var(--tooltip-bg)',
        },
        body: {
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
  placement: 'center',
  transition: 'fade',
  transitionDuration: 250,
  withArrow: true,
};
