import { RefObject, useEffect, useLayoutEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router';

import { useScrollStore } from '/@/renderer/store/scroll.store';

interface UseNativeScrollPersistProps {
    enabled: boolean;
    scrollRef: RefObject<HTMLDivElement | null>;
}

// OverlayScrollbars initializes on the NativeScrollArea container and moves the
// content into a viewport child element; that child is what actually scrolls,
// so scrollTop must be read from and written to it rather than the container
// the ref points at.
const getScrollNode = (scrollRef: RefObject<HTMLDivElement | null>): HTMLElement | null => {
    const node = scrollRef.current?.children[0];
    return node instanceof HTMLElement ? node : null;
};

// Persists vertical scroll offset for a NativeScrollArea, keyed by react-router
// location.key. Restores the saved offset only on POP navigation; PUSH/REPLACE
// continue to start at the top.
export const useNativeScrollPersist = ({ enabled, scrollRef }: UseNativeScrollPersistProps) => {
    const location = useLocation();
    const navigationType = useNavigationType();
    const setOffset = useScrollStore((s) => s.setOffset);
    const getOffset = useScrollStore((s) => s.getOffset);

    useLayoutEffect(() => {
        const saved = getOffset(location.key);
        if (!enabled || navigationType !== 'POP' || typeof saved !== 'number') {
            return;
        }

        const applyOffset = () => {
            const node = getScrollNode(scrollRef);
            if (node) {
                node.scrollTop = saved;
            }
        };

        applyOffset();
        const raf = requestAnimationFrame(applyOffset);
        return () => cancelAnimationFrame(raf);
    }, [enabled, getOffset, location.key, navigationType, scrollRef]);

    useEffect(() => {
        const node = getScrollNode(scrollRef);
        if (!enabled || !node) {
            return;
        }

        const handleScroll = () => {
            setOffset(location.key, node.scrollTop);
        };

        node.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            node.removeEventListener('scroll', handleScroll);
        };
    }, [enabled, location.key, scrollRef, setOffset]);
};
