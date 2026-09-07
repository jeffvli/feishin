import { RefObject, useEffect, useRef } from 'react';
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

const getContentNode = (scrollRef: RefObject<HTMLDivElement | null>): HTMLElement | null => {
    const viewport = getScrollNode(scrollRef);
    const content = viewport?.firstElementChild;
    return content instanceof HTMLElement ? content : null;
};

// Persists vertical scroll offset for a NativeScrollArea, keyed by react-router
// location.key. Restores the saved offset only on POP navigation; PUSH/REPLACE
// continue to start at the top.
export const useNativeScrollPersist = ({ enabled, scrollRef }: UseNativeScrollPersistProps) => {
    const location = useLocation();
    const navigationType = useNavigationType();
    const setOffset = useScrollStore((s) => s.setOffset);
    const getOffset = useScrollStore((s) => s.getOffset);
    // Suppresses scroll→store writes while a POP restore is in progress so a
    // clamped partial scrollTop cannot overwrite the real saved offset.
    const isRestoringRef = useRef(false);

    // Restore after paint so OverlayScrollbars has initialized (child useEffect).
    // Viewport ResizeObserver misses scrollHeight-only growth, so also poll via
    // rAF and observe the inner content element whose size actually changes.
    useEffect(() => {
        const saved = getOffset(location.key);
        if (!enabled || navigationType !== 'POP' || typeof saved !== 'number') {
            return;
        }

        let restored = false;
        let rafId = 0;
        let frames = 0;
        const maxFrames = 120; // ~2s at 60fps

        isRestoringRef.current = true;

        const finish = () => {
            restored = true;
            isRestoringRef.current = false;
            cancelAnimationFrame(rafId);
            resizeObserver.disconnect();
            mutationObserver.disconnect();
        };

        const tryApply = () => {
            if (restored) return true;

            const node = getScrollNode(scrollRef);
            if (!node) return false;

            const maxScroll = node.scrollHeight - node.clientHeight;
            if (maxScroll <= 0) return false;

            node.scrollTop = saved;

            if (node.scrollTop >= saved - 1) {
                finish();
                return true;
            }

            return false;
        };

        const resizeObserver = new ResizeObserver(() => {
            tryApply();
        });

        const observeContent = () => {
            const content = getContentNode(scrollRef);
            if (content) {
                resizeObserver.observe(content);
            }
        };

        const mutationObserver = new MutationObserver(() => {
            observeContent();
            tryApply();
        });

        const root = scrollRef.current;
        if (root) {
            mutationObserver.observe(root, { childList: true, subtree: true });
        }
        observeContent();
        tryApply();

        const tick = () => {
            if (restored) return;
            if (tryApply() || frames++ >= maxFrames) {
                if (!restored) {
                    isRestoringRef.current = false;
                }
                return;
            }
            rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);

        return () => {
            cancelAnimationFrame(rafId);
            resizeObserver.disconnect();
            mutationObserver.disconnect();
            isRestoringRef.current = false;
        };
    }, [enabled, getOffset, location.key, navigationType, scrollRef]);

    useEffect(() => {
        const node = getScrollNode(scrollRef);
        if (!enabled || !node) {
            return;
        }

        const handleScroll = () => {
            if (isRestoringRef.current) return;
            setOffset(location.key, node.scrollTop);
        };

        node.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            node.removeEventListener('scroll', handleScroll);
        };
    }, [enabled, location.key, scrollRef, setOffset]);
};
