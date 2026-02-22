import clsx from 'clsx';
import { memo, useCallback, useState } from 'react';

import styles from './read-only-rating.module.css';

const MAX_STARS = 5;

interface ReadOnlyRatingProps {
    className?: string;
    onChange?: (value: number) => void;
    size?: 'md' | 'sm' | 'xs';
    value?: null | number;
}

function ReadOnlyRatingComponent({ className, onChange, size = 'sm', value }: ReadOnlyRatingProps) {
    const [hoverIndex, setHoverIndex] = useState<null | number>(null);
    const rating = Math.min(MAX_STARS, Math.max(0, value ?? 0));
    const displayCount = hoverIndex !== null ? hoverIndex : Math.floor(rating);

    const handlePointerMove = useCallback(
        (e: React.PointerEvent) => {
            if (!onChange) return;
            const el = e.currentTarget;
            const width = (el as HTMLElement).offsetWidth;
            if (width <= 0) return;
            const x = e.clientX - el.getBoundingClientRect().left;
            const segment = Math.floor((x / width) * MAX_STARS);
            const filled = segment < 0 ? 0 : Math.min(MAX_STARS, segment + 1);
            setHoverIndex(filled);
        },
        [onChange],
    );

    const handlePointerLeave = useCallback(() => {
        setHoverIndex(null);
    }, []);

    const handleClick = useCallback(
        (e: React.MouseEvent) => {
            if (!onChange) return;
            e.preventDefault();
            e.stopPropagation();
            const el = e.currentTarget;
            const width = (el as HTMLElement).offsetWidth;
            if (width <= 0) return;
            const x = e.clientX - el.getBoundingClientRect().left;
            const segment = Math.floor((x / width) * MAX_STARS);
            const clicked = segment < 0 ? 0 : Math.min(MAX_STARS, segment + 1);
            onChange(clicked === rating ? 0 : clicked);
        },
        [onChange, rating],
    );

    const isInteractive = typeof onChange === 'function';

    return (
        <span
            aria-label={isInteractive ? undefined : `${rating} out of ${MAX_STARS} stars`}
            className={clsx(
                styles.root,
                size && styles[size],
                isInteractive && styles.interactive,
                className,
            )}
            onClick={isInteractive ? handleClick : undefined}
            onPointerLeave={isInteractive ? handlePointerLeave : undefined}
            onPointerMove={isInteractive ? handlePointerMove : undefined}
            role={isInteractive ? undefined : 'img'}
        >
            {Array.from({ length: MAX_STARS }, (_, i) => (
                <span className={i < displayCount ? styles.filled : styles.empty} key={i}>
                    ★
                </span>
            ))}
        </span>
    );
}

export const ReadOnlyRating = memo(ReadOnlyRatingComponent);

ReadOnlyRating.displayName = 'ReadOnlyRating';
