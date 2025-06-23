import type { IHeaderParams } from '@ag-grid-community/core';
import type { ReactNode } from 'react';

import clsx from 'clsx';

import styles from './generic-table-header.module.css';

import { Icon } from '/@/shared/components/icon/icon';

type Options = {
    children?: ReactNode;
    position?: 'center' | 'left' | 'right';
    preset?: Presets;
};

type Presets = 'actions' | 'duration' | 'rowIndex' | 'userFavorite' | 'userRating';

const headerPresets = {
    actions: (
        <Icon
            icon="ellipsisHorizontal"
            size="sm"
        />
    ),
    duration: (
        <Icon
            icon="duration"
            size="sm"
        />
    ),
    rowIndex: (
        <Icon
            icon="hash"
            size="sm"
        />
    ),
    userFavorite: (
        <Icon
            icon="favorite"
            size="sm"
        />
    ),
    userRating: (
        <Icon
            icon="star"
            size="sm"
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
