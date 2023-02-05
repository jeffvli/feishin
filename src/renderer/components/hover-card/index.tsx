import { HoverCard as MantineHoverCard, HoverCardProps } from '@mantine/core';

export const HoverCard = ({ children, ...props }: HoverCardProps) => {
  return (
    <MantineHoverCard
      styles={{
        dropdown: {
          background: 'var(--dropdown-menu-bg)',
          border: 'none',
          boxShadow: '2px 2px 10px 2px rgba(0, 0, 0, 40%)',
          margin: 0,
          padding: 0,
        },
      }}
      {...props}
    >
      {children}
    </MantineHoverCard>
  );
};

HoverCard.Target = MantineHoverCard.Target;
HoverCard.Dropdown = MantineHoverCard.Dropdown;
