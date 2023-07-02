import type { AccordionProps as MantineAccordionProps } from '@mantine/core';
import { Accordion as MantineAccordion } from '@mantine/core';
import styled from 'styled-components';

type AccordionProps = MantineAccordionProps;

const StyledAccordion = styled(MantineAccordion)`
    & .mantine-Accordion-panel {
        background: var(--paper-bg);
    }

    .mantine-Accordion-control {
        background: var(--paper-bg);
    }
`;

export const Accordion = ({ children, ...props }: AccordionProps) => {
    return <StyledAccordion {...props}>{children}</StyledAccordion>;
};

Accordion.Control = StyledAccordion.Control;
Accordion.Item = StyledAccordion.Item;
Accordion.Panel = StyledAccordion.Panel;
