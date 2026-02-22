import clsx from 'clsx';
import { ComponentPropsWithoutRef } from 'react';

import styles from './explicit-indicator.module.css';

import { ExplicitStatus } from '/@/shared/types/domain-types';

const EXPLICIT_SYMBOL = '🅴';
const CLEAN_SYMBOL = '🅲';

export interface ExplicitIndicatorProps extends ComponentPropsWithoutRef<'span'> {
    explicitStatus: ExplicitStatus | null | undefined;
    size?: ExplicitIndicatorSize;
    withSpace?: boolean;
}

export type ExplicitIndicatorSize = '2xl' | '3xl' | '4xl' | 'lg' | 'md' | 'sm' | 'xl' | 'xs';

export const ExplicitIndicator = ({
    className,
    explicitStatus,
    size = 'lg',
    withSpace = true,
    ...rest
}: ExplicitIndicatorProps) => {
    if (explicitStatus !== ExplicitStatus.EXPLICIT && explicitStatus !== ExplicitStatus.CLEAN) {
        return null;
    }

    const symbol = explicitStatus === ExplicitStatus.EXPLICIT ? EXPLICIT_SYMBOL : CLEAN_SYMBOL;

    return (
        <span
            aria-label={explicitStatus === ExplicitStatus.EXPLICIT ? 'Explicit' : 'Clean'}
            className={clsx(styles.root, styles[`size-${size}`], className, {
                [styles.withSpace]: withSpace,
            })}
            {...rest}
        >
            {symbol}
        </span>
    );
};
