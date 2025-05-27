import type { IHeaderParams } from '@ag-grid-community/core';
import type { ReactNode } from 'react';

import clsx from 'clsx';
import { AiOutlineNumber } from 'react-icons/ai';
import { FiClock } from 'react-icons/fi';
import { RiHeartLine, RiMoreFill, RiStarLine } from 'react-icons/ri';

import styles from './generic-table-header.module.css';

type Options = {
    children?: ReactNode;
    position?: 'center' | 'left' | 'right';
    preset?: Presets;
};

type Presets = 'actions' | 'duration' | 'rowIndex' | 'userFavorite' | 'userRating';

const headerPresets = {
    actions: (
        <RiMoreFill
            color="var(--theme-ag-header-foreground-color)"
            size="1em"
        />
    ),
    duration: (
        <FiClock
            color="var(--theme-ag-header-foreground-color)"
            size="1em"
        />
    ),
    rowIndex: (
        <AiOutlineNumber
            color="var(--theme-ag-header-foreground-color)"
            size="1em"
        />
    ),
    userFavorite: (
        <RiHeartLine
            color="var(--theme-ag-header-foreground-color)"
            size="1em"
        />
    ),
    userRating: (
        <RiStarLine
            color="var(--theme-ag-header-foreground-color)"
            size="1em"
        />
    ),
};

export const GenericTableHeader = (
    { displayName }: IHeaderParams,
    { children, position, preset }: Options,
) => {
    if (preset) {
        return (
            <div className={clsx(styles.headerWrapper, styles[position ?? 'left'])}>
                {headerPresets[preset]}
            </div>
        );
    }

    return (
        <div className={clsx(styles.headerWrapper, styles[position ?? 'left'])}>
            <div className={clsx(styles.headerText, styles[position ?? 'left'])}>
                {children || displayName}
            </div>
        </div>
    );
};
