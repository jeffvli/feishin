import type { ICellRendererParams } from '@ag-grid-community/core';

import clsx from 'clsx';
import { Link } from 'react-router-dom';

import styles from './generic-cell.module.css';

import { Skeleton } from '/@/shared/components/skeleton/skeleton';
import { Text } from '/@/shared/components/text/text';

type Options = {
    array?: boolean;
    isArray?: boolean;
    isLink?: boolean;
    position?: 'center' | 'left' | 'right';
    primary?: boolean;
};

export const GenericCell = (
    { value, valueFormatted }: ICellRendererParams,
    { isLink, position, primary }: Options,
) => {
    const displayedValue = valueFormatted || value;

    if (value === undefined) {
        return (
            <CellContainer position={position || 'left'}>
                <Skeleton
                    height="1rem"
                    width="80%"
                />
            </CellContainer>
        );
    }

    return (
        <CellContainer position={position || 'left'}>
            {isLink ? (
                <Text
                    component={Link}
                    isLink={isLink}
                    isMuted={!primary}
                    overflow="hidden"
                    size="md"
                    to={displayedValue.link}
                >
                    {isLink ? displayedValue.value : displayedValue}
                </Text>
            ) : (
                <Text
                    isMuted={!primary}
                    isNoSelect={false}
                    overflow="hidden"
                    size="md"
                >
                    {displayedValue}
                </Text>
            )}
        </CellContainer>
    );
};

export const CellContainer = ({
    children,
    position,
}: {
    children: React.ReactNode;
    position: 'center' | 'left' | 'right';
}) => {
    return (
        <div
            className={clsx({
                [styles.cellContainer]: true,
                [styles.center]: position === 'center',
                [styles.left]: position === 'left' || !position,
                [styles.right]: position === 'right',
            })}
        >
            {children}
        </div>
    );
};
