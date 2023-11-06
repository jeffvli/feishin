import { AnimatePresence, Variants, motion, useDragControls } from 'framer-motion';
import { useMemo, useRef } from 'react';
import { Lyrics } from '/@/renderer/features/lyrics/lyrics';
import styled from 'styled-components';
import { Platform } from '/@/renderer/types';
import { useLyricsStore } from '/@/renderer/store';

const LyricsContainer = styled(motion.div)`
    position: absolute;
    width: 100%;
    height: 100%;
`;

const LyricsDrawer = styled(motion.div)`
    background: var(--main-bg);
    border: 3px solid var(--generic-border-color);
    border-radius: 10px;
`;

export const LyricsOverlay = () => {
    const dragControls = useDragControls();
    const constraintsRef = useRef(null);
    const { open, width } = useLyricsStore();

    const variants: Variants = useMemo(
        () => ({
            closed: (windowBarStyle) => ({
                height:
                    windowBarStyle === Platform.WINDOWS || Platform.MACOS
                        ? 'calc(100vh - 205px)'
                        : 'calc(100vh - 175px)',
                left: 'calc(50vw - 225px)',
                position: 'absolute',
                top: '75px',
                transition: {
                    duration: 0.4,
                    ease: 'anticipate',
                },
                width,
            }),
            open: (windowBarStyle) => ({
                boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.8)',
                cursor: 'grab',
                height:
                    windowBarStyle === Platform.WINDOWS || Platform.MACOS
                        ? 'calc(100vh - 205px)'
                        : 'calc(100vh - 175px)',
                transition: {
                    damping: 10,
                    delay: 0,
                    duration: 0.4,
                    ease: 'anticipate',
                    mass: 0.5,
                },
                width,
                zIndex: 121,
            }),
        }),
        [width],
    );

    return (
        <AnimatePresence
            key="lyric-drawer"
            presenceAffectsLayout
            initial={false}
            mode="sync"
        >
            {open && (
                <LyricsContainer ref={constraintsRef}>
                    <LyricsDrawer
                        key="lyric-drawer"
                        dragListener
                        animate="open"
                        drag="x"
                        dragConstraints={constraintsRef}
                        dragControls={dragControls}
                        dragElastic={0}
                        dragMomentum={false}
                        exit="closed"
                        id="drawer-lyric"
                        initial="closed"
                        variants={variants}
                    >
                        <Lyrics />
                    </LyricsDrawer>
                </LyricsContainer>
            )}
        </AnimatePresence>
    );
};
