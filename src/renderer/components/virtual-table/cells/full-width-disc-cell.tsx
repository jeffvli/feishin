import { useState } from 'react';
import { ICellRendererParams } from '@ag-grid-community/core';
import { Group } from '@mantine/core';
import { RiCheckboxBlankLine, RiCheckboxLine } from 'react-icons/ri';
import styled from 'styled-components';
import { Button } from '/@/renderer/components/button';
import { Paper } from '/@/renderer/components/paper';
import { getNodesByDiscNumber, setNodeSelection } from '../utils';

const Container = styled(Paper)`
    display: flex;
    height: 100%;
    padding: 0.5rem 1rem;
    border: 1px solid transparent;
`;

export const FullWidthDiscCell = ({ node, data, api }: ICellRendererParams) => {
    const [isSelected, setIsSelected] = useState(false);

    const handleToggleDiscNodes = () => {
        if (!data) return;
        const split: string[] = node.data.id.split('-');
        const discNumber = Number(split[1]);
        // the subtitle could have '-' in it; make sure to have all remaining items
        const subtitle = split.length === 3 ? split.slice(2).join('-') : null;
        const nodes = getNodesByDiscNumber({ api, discNumber, subtitle });

        setNodeSelection({ isSelected: !isSelected, nodes });
        setIsSelected((prev) => !prev);
    };

    return (
        <Container>
            <Group
                position="apart"
                w="100%"
            >
                <Button
                    compact
                    leftIcon={isSelected ? <RiCheckboxLine /> : <RiCheckboxBlankLine />}
                    size="md"
                    variant="subtle"
                    onClick={handleToggleDiscNodes}
                >
                    {data.name}
                </Button>
            </Group>
        </Container>
    );
};
