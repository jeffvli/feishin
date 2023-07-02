import React from 'react';
import styled from 'styled-components';
import { Text } from '/@/renderer/components';

interface ServerSectionProps {
    children: React.ReactNode;
    title: string | React.ReactNode;
}

const Container = styled.div``;

const Section = styled.div`
    padding: 1rem;
    border: 1px dashed var(--generic-border-color);
`;

export const ServerSection = ({ title, children }: ServerSectionProps) => {
    return (
        <Container>
            {React.isValidElement(title) ? title : <Text>{title}</Text>}
            <Section>{children}</Section>
        </Container>
    );
};
