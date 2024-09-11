import clsx from 'clsx';
import { HTMLAttributes, ReactNode, useRef, useState } from 'react';
import styles from './spoiler.module.scss';
import { useIsOverflow } from '/@/renderer/hooks';

interface SpoilerProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
    defaultOpened?: boolean;
    maxHeight?: number;
}

export const Spoiler = ({ maxHeight, defaultOpened, children, ...props }: SpoilerProps) => {
    const ref = useRef(null);
    const isOverflow = useIsOverflow(ref);
    const [isExpanded, setIsExpanded] = useState(!!defaultOpened);

    const spoilerClassNames = clsx(styles.spoiler, {
        [styles.canExpand]: isOverflow,
        [styles.isExpanded]: isExpanded,
    });

    const handleToggleExpand = () => {
        setIsExpanded((val) => !val);
    };

    return (
        <div
            ref={ref}
            className={spoilerClassNames}
            role="button"
            style={{ maxHeight: maxHeight ?? '100px', whiteSpace: 'pre-wrap' }}
            tabIndex={-1}
            onClick={handleToggleExpand}
            {...props}
        >
            {children}
        </div>
    );
};
