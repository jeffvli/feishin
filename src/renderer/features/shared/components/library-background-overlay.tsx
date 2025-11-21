import { useEffect, useState } from 'react';

import styles from './library-background-overlay.module.css';

interface LibraryBackgroundOverlayProps {
    backgroundColor?: string;
    headerRef: React.RefObject<HTMLDivElement | null>;
}

export const LibraryBackgroundOverlay = ({
    backgroundColor,
    headerRef,
}: LibraryBackgroundOverlayProps) => {
    const height = useHeaderHeight(headerRef);
    return (
        <div
            className={styles.overlay}
            style={{
                backgroundColor,
                height: height ? `${height + 64}px` : undefined,
            }}
        />
    );
};

interface LibraryBackgroundProps {
    blur?: number;
    headerRef: React.RefObject<HTMLDivElement | null>;
    imageUrl?: string;
}

export const LibraryBackgroundImage = ({ blur, headerRef, imageUrl }: LibraryBackgroundProps) => {
    const url = `url(${imageUrl})`;
    const height = useHeaderHeight(headerRef);
    return (
        <>
            <div
                className={styles.backgroundImage}
                style={{
                    background: url,
                    filter: `blur(${blur ?? 0}rem)`,
                    height: height ? `${height - 64}px` : undefined,
                }}
            />
            <div
                className={styles.backgroundImageOverlay}
                style={{
                    height: height ? `${height + 64}px` : undefined,
                }}
            />
        </>
    );
};

const useHeaderHeight = (headerRef: React.RefObject<HTMLDivElement | null>) => {
    const [headerHeight, setHeaderHeight] = useState<number>(0);

    useEffect(() => {
        if (!headerRef?.current) return;

        const updateHeight = () => {
            if (headerRef?.current) {
                setHeaderHeight(headerRef.current.offsetHeight);
            }
        };

        updateHeight();

        const resizeObserver = new ResizeObserver(updateHeight);
        resizeObserver.observe(headerRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, [headerRef]);

    return headerHeight;
};
