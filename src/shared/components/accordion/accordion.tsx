import {
    Accordion as MantineAccordion,
    AccordionProps as MantineAccordionProps,
} from '@mantine/core';

import styles from './accordion.module.css';

interface AccordionProps extends MantineAccordionProps {}

export const Accordion = ({ children, classNames, ...props }: AccordionProps) => {
    return (
        <MantineAccordion
            {...props}
            classNames={{ control: styles.control, panel: styles.panel, ...classNames }}
        >
            {children}
        </MantineAccordion>
    );
};

Accordion.Control = MantineAccordion.Control;
Accordion.Item = MantineAccordion.Item;
Accordion.Panel = MantineAccordion.Panel;
