import clsx from 'clsx';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import styles from './row-play-control-popover.module.css';

interface RowPlayControlPopoverProps {
    children: ReactNode;
    className?: string;
    content: ReactNode;
    offset?: { crossAxis?: number; mainAxis?: number };
    openDelay?: number;
}

const CLOSE_DELAY = 150;
const DEFAULT_OFFSET = 10;

export const RowPlayControlPopover = ({
    children,
    className,
    content,
    offset: { crossAxis = 0, mainAxis = DEFAULT_OFFSET } = {},
    openDelay = 150,
}: RowPlayControlPopoverProps) => {
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState<null | { left: number; top: number }>(null);
    const targetRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const closeTimer = useRef<null | number>(null);
    const openTimer = useRef<null | number>(null);

    const cancelClose = useCallback(() => {
        if (closeTimer.current !== null) {
            window.clearTimeout(closeTimer.current);
            closeTimer.current = null;
        }
    }, []);

    const cancelOpen = useCallback(() => {
        if (openTimer.current !== null) {
            window.clearTimeout(openTimer.current);
            openTimer.current = null;
        }
    }, []);

    const openNow = useCallback(() => {
        cancelClose();
        const rect = targetRef.current?.getBoundingClientRect();
        if (!rect) {
            return;
        }
        setPosition({
            left: rect.left + rect.width / 2 + crossAxis,
            top: Math.max(rect.top - mainAxis, 0),
        });
        setOpen(true);
    }, [cancelClose, crossAxis, mainAxis]);

    const closeNow = useCallback(() => {
        cancelClose();
        setOpen(false);
    }, [cancelClose]);

    // Wait for hover before opening
    const scheduleOpen = useCallback(() => {
        cancelClose();
        cancelOpen();
        if (openDelay === 0) {
            openNow();
            return;
        }
        openTimer.current = window.setTimeout(openNow, openDelay);
    }, [cancelClose, cancelOpen, openDelay, openNow]);

    // Close a bit later so the pointer can travel to the popover without flicker.
    const scheduleClose = useCallback(() => {
        cancelOpen();
        cancelClose();
        closeTimer.current = window.setTimeout(closeNow, CLOSE_DELAY);
    }, [cancelClose, cancelOpen, closeNow]);

    useEffect(() => {
        return () => {
            if (closeTimer.current !== null) {
                window.clearTimeout(closeTimer.current);
            }
            if (openTimer.current !== null) {
                window.clearTimeout(openTimer.current);
            }
        };
    }, []);

    // A fixed-positioned popover goes stale as soon as anything scrolls or
    // resizes, and closing on scroll keeps the virtual list from recycling
    // the row underneath it.
    useEffect(() => {
        if (!open) {
            return;
        }

        const handlePointerDown = (event: PointerEvent) => {
            const target = event.target as Node;
            if (!targetRef.current?.contains(target) && !popoverRef.current?.contains(target)) {
                closeNow();
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                closeNow();
            }
        };

        window.addEventListener('scroll', closeNow, { capture: true, passive: true });
        window.addEventListener('resize', closeNow);
        document.addEventListener('pointerdown', handlePointerDown, true);
        document.addEventListener('keydown', handleKeyDown, true);

        return () => {
            window.removeEventListener('scroll', closeNow, true);
            window.removeEventListener('resize', closeNow);
            document.removeEventListener('pointerdown', handlePointerDown, true);
            document.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [open, closeNow]);

    return (
        <>
            <div
                className={clsx(styles.target, className)}
                onFocus={scheduleOpen}
                onMouseEnter={scheduleOpen}
                onMouseLeave={scheduleClose}
                ref={targetRef}
            >
                {children}
            </div>
            {open && position
                ? createPortal(
                      <div
                          className={styles.popover}
                          onClick={(e) => e.stopPropagation()}
                          onMouseEnter={cancelClose}
                          onMouseLeave={scheduleClose}
                          ref={popoverRef}
                          style={{ left: position.left, top: position.top }}
                      >
                          {content}
                      </div>,
                      document.body,
                  )
                : null}
        </>
    );
};
