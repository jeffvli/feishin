import {
    Accordion as MantineAccordion,
    AccordionProps as MantineAccordionProps,
} from '@mantine/core';

import styles from './accordion.module.css';

import { Icon } from '/@/shared/components/icon/icon';

export interface AccordionProps
    extends Omit<MantineAccordionProps, 'defaultValue' | 'multiple' | 'onChange'> {
    defaultValue?: string | string[];
    multiple?: boolean;
    onChange?: (value: null | string | string[]) => void;
}

export const Accordion = ({ children, classNames, ...props }: AccordionProps) => {
    return (
        <MantineAccordion
            chevron={
                <Icon
                    icon="arrowUpS"
                    size="lg"
                />
            }
            classNames={{
                chevron: styles.chevron,
                control: styles.control,
                panel: styles.panel,
                ...classNames,
            }}
            {...props}
        >
            {children}
        </MantineAccordion>
    );
};

Accordion.Control = MantineAccordion.Control;
Accordion.Item = MantineAccordion.Item;
Accordion.Panel = MantineAccordion.Panel;
