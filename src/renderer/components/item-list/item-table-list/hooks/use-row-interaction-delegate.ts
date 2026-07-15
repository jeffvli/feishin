import { useEffect } from 'react';

interface UseRowInteractionDelegateProps {
    containerRef: React.RefObject<HTMLDivElement | null>;
    enableRowHoverHighlight: boolean;
}

/**
 * Hook to handle row hover and drag-over styling via delegated event listeners.
 * This is intentionally imperative to avoid React re-rendering the entire visible grid on hover.
 */
export const useRowInteractionDelegate = ({
    containerRef,
    enableRowHoverHighlight,
}: UseRowInteractionDelegateProps) => {
    // Row hover highlight: do one delegated listener per table rather than per cell
    useEffect(() => {
        if (!enableRowHoverHighlight) return;
        const root = containerRef.current;
        if (!root) return;

        let hoveredKey: null | string = null;
        let rafId: null | number = null;

        const getRowKey = (target: EventTarget | null): null | string => {
            const el = target instanceof Element ? target : null;
            const rowEl = el?.closest?.('[data-row-index]') as HTMLElement | null;
            return rowEl?.getAttribute('data-row-index') ?? null;
        };

        const apply = (prev: null | string, next: null | string) => {
            if (rafId !== null) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                if (prev) {
                    root.querySelectorAll(`[data-row-index="${prev}"]`).forEach((node) => {
                        (node as HTMLElement).removeAttribute('data-row-hovered');
                    });
                }
                if (next) {
                    root.querySelectorAll(`[data-row-index="${next}"]`).forEach((node) => {
                        (node as HTMLElement).setAttribute('data-row-hovered', 'true');
                    });
                }
            });
        };

        const setHovered = (next: null | string) => {
            if (next === hoveredKey) return;
            const prev = hoveredKey;
            hoveredKey = next;
            apply(prev, next);
        };

        const onPointerOver = (e: PointerEvent) => {
            setHovered(getRowKey(e.target));
        };

        const onPointerOut = (e: PointerEvent) => {
            // If moving within the same row, keep it hovered
            const relatedKey = getRowKey((e as any).relatedTarget);
            if (relatedKey === hoveredKey) return;
            setHovered(relatedKey);
        };

        root.addEventListener('pointerover', onPointerOver);
        root.addEventListener('pointerout', onPointerOut);

        return () => {
            root.removeEventListener('pointerover', onPointerOver);
            root.removeEventListener('pointerout', onPointerOut);
            if (rafId !== null) cancelAnimationFrame(rafId);
            // Ensure we don't leave stale attributes behind
            if (hoveredKey) apply(hoveredKey, null);
        };
    }, [containerRef, enableRowHoverHighlight]);

    // Dragged-over row border styling delegation
    useEffect(() => {
        const root = containerRef.current;
        if (!root) return;

        let current: null | { edge: 'bottom' | 'top'; rowKey: string } = null;
        let pending: null | { edge: 'bottom' | 'top' | null; rowKey: string } = null;
        let rafId: null | number = null;

        const isExcludedFromDragBorder = (el: HTMLElement) =>
            el.hasAttribute('data-exclude-row-drag-border');

        const clearRow = (rowKey: string) => {
            root.querySelectorAll(`[data-row-index="${rowKey}"]`).forEach((node) => {
                const el = node as HTMLElement;
                el.removeAttribute('data-row-dragged-over');
                el.removeAttribute('data-row-dragged-over-first');
                el.removeAttribute('data-exclude-row-drag-left');
            });
        };

        const applyRow = (rowKey: string, edge: 'bottom' | 'top') => {
            const nodes = Array.from(root.querySelectorAll(`[data-row-index="${rowKey}"]`));
            const eligibleNodes = nodes.filter(
                (node) => !isExcludedFromDragBorder(node as HTMLElement),
            );
            const hasExcludedBeforeFirst = eligibleNodes.length < nodes.length;

            nodes.forEach((node) => {
                if (!isExcludedFromDragBorder(node as HTMLElement)) return;
                const el = node as HTMLElement;
                el.removeAttribute('data-row-dragged-over');
                el.removeAttribute('data-row-dragged-over-first');
                el.removeAttribute('data-exclude-row-drag-left');
            });

            eligibleNodes.forEach((node, idx) => {
                const el = node as HTMLElement;
                el.setAttribute('data-row-dragged-over', edge);
                if (idx === 0) {
                    el.setAttribute('data-row-dragged-over-first', 'true');
                    if (hasExcludedBeforeFirst) {
                        el.setAttribute('data-exclude-row-drag-left', 'true');
                    } else {
                        el.removeAttribute('data-exclude-row-drag-left');
                    }
                } else {
                    el.removeAttribute('data-row-dragged-over-first');
                    el.removeAttribute('data-exclude-row-drag-left');
                }
            });
        };

        const flush = () => {
            rafId = null;
            const next = pending;
            pending = null;
            if (!next) return;

            // Clear previous row if we're moving rows or clearing.
            if (current && current.rowKey !== next.rowKey) {
                clearRow(current.rowKey);
                current = null;
            }

            if (!next.edge) {
                if (current) {
                    clearRow(current.rowKey);
                    current = null;
                }
                return;
            }

            // If same row + edge, no-op.
            if (current && current.rowKey === next.rowKey && current.edge === next.edge) return;

            if (current) clearRow(current.rowKey);
            applyRow(next.rowKey, next.edge);
            current = { edge: next.edge, rowKey: next.rowKey };
        };

        const scheduleFlush = () => {
            if (rafId !== null) return;
            rafId = requestAnimationFrame(flush);
        };

        const onRowDragOver = (e: Event) => {
            const ev = e as CustomEvent<{ edge?: 'bottom' | 'top' | null; rowKey?: string }>;
            const rowKey = ev.detail?.rowKey;
            const edge = ev.detail?.edge ?? null;
            if (!rowKey) return;

            pending = { edge, rowKey };
            scheduleFlush();
        };

        root.addEventListener('itl:row-drag-over', onRowDragOver as any);

        return () => {
            root.removeEventListener('itl:row-drag-over', onRowDragOver as any);
            if (rafId !== null) cancelAnimationFrame(rafId);
            if (current) clearRow(current.rowKey);
        };
    }, [containerRef]);
};
