import { useMemo, useRef, useState } from 'react';
import { Variants, motion, useDragControls } from 'framer-motion';
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
    const lyricRef = useRef<HTMLDivElement>(null);

    const [x, setX] = useState((document.body.clientWidth - width) / 2);

    const variants: Variants = useMemo(
        () => ({
            closed: (windowBarStyle) => ({
                height:
                    windowBarStyle === Platform.WINDOWS || Platform.MACOS
                        ? 'calc(100vh - 205px)'
                        : 'calc(100vh - 175px)',
                position: 'absolute',
                top: '75px',
                transition: {
                    duration: 0.4,
                    ease: 'anticipate',
                },
                width,
                x,
            }),
            open: (windowBarStyle) => ({
                boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.8)',
                cursor: 'grab',
                height:
                    windowBarStyle === Platform.WINDOWS || Platform.MACOS
                        ? 'calc(100vh - 205px)'
                        : 'calc(100vh - 175px)',
                width,
                x,
                zIndex: 121,
            }),
        }),
        [width, x],
    );

    return (
        open && (
            <LyricsContainer
                // This key is here to force rerender when lyric width changes. Otherwise
                // the constraints are not updated properly
                key={width}
                ref={constraintsRef}
            >
                <LyricsDrawer
                    key="lyric-drawer"
                    ref={lyricRef}
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
                    onDragEnd={() => {
                        // bodge to save the current position, so that on resize
                        // window does not snap back to 0
                        setX(lyricRef.current!.getBoundingClientRect().x);
                    }}
                >
                    <Lyrics />
                </LyricsDrawer>
            </LyricsContainer>
        )
    );
};
