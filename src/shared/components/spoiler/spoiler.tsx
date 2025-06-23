import clsx from 'clsx';
import { HTMLAttributes, ReactNode, useRef, useState } from 'react';

import styles from './spoiler.module.css';

import { Text } from '/@/shared/components/text/text';
import { useIsOverflow } from '/@/shared/hooks/use-is-overflow';

interface SpoilerProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
    defaultOpened?: boolean;
    maxHeight?: number;
}

export const Spoiler = ({ children, defaultOpened, maxHeight, ...props }: SpoilerProps) => {
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
        <Text
            className={spoilerClassNames}
            onClick={handleToggleExpand}
            ref={ref}
            role="button"
            style={{ maxHeight: maxHeight ?? '100px', whiteSpace: 'pre-wrap' }}
            tabIndex={-1}
            {...props}
        >
            {children}
        </Text>
    );
};
