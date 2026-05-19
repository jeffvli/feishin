import { RefObject, useEffect, useLayoutEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router';

import { useScrollStore } from '/@/renderer/store/scroll.store';

interface UseNativeScrollPersistProps {
    enabled: boolean;
    scrollRef: RefObject<HTMLDivElement | null>;
}

// Persists vertical scroll offset for a NativeScrollArea, keyed by react-router
// location.key. Restores the saved offset only on POP navigation; PUSH/REPLACE
// continue to start at the top.
export const useNativeScrollPersist = ({ enabled, scrollRef }: UseNativeScrollPersistProps) => {
    const location = useLocation();
    const navigationType = useNavigationType();
    const setOffset = useScrollStore((s) => s.setOffset);
    const getOffset = useScrollStore((s) => s.getOffset);

    useLayoutEffect(() => {
        if (!enabled) return;
        if (navigationType !== 'POP') return;
        const node = scrollRef.current;
        if (!node) return;

        const saved = getOffset(location.key);
        if (typeof saved !== 'number') return;

        const applyOffset = () => {
            if (!scrollRef.current) return;
            scrollRef.current.scrollTop = saved;
        };

        applyOffset();
        const raf = requestAnimationFrame(applyOffset);
        return () => cancelAnimationFrame(raf);
    }, [enabled, getOffset, location.key, navigationType, scrollRef]);

    useEffect(() => {
        if (!enabled) return;
        const node = scrollRef.current;
        if (!node) return;

        const handleScroll = () => {
            setOffset(location.key, node.scrollTop);
        };

        node.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            node.removeEventListener('scroll', handleScroll);
        };
    }, [enabled, location.key, scrollRef, setOffset]);
};
