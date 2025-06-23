import { ICellRendererParams } from '@ag-grid-community/core';
import { useState } from 'react';

import styles from './full-width-disc-cell.module.css';

import { getNodesByDiscNumber, setNodeSelection } from '/@/renderer/components/virtual-table/utils';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';

export const FullWidthDiscCell = ({ api, data, node }: ICellRendererParams) => {
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
        <div className={styles.container}>
            <Group
                justify="space-between"
                w="100%"
            >
                <Button
                    leftSection={isSelected ? <Icon icon="squareCheck" /> : <Icon icon="square" />}
                    onClick={handleToggleDiscNodes}
                    size="compact-md"
                    variant="subtle"
                >
                    {data.name}
                </Button>
            </Group>
        </div>
    );
};
