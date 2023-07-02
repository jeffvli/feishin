import { useRef } from 'react';
import { Flex, FlexProps } from '@mantine/core';
import { AnimatePresence, motion, Variants } from 'framer-motion';
import styled from 'styled-components';
import { useShouldPadTitlebar, useTheme } from '/@/renderer/hooks';
import { useWindowSettings } from '/@/renderer/store/settings.store';
import { Platform } from '/@/renderer/types';

const Container = styled(motion(Flex))<{
    height?: string;
    position?: string;
}>`
    position: ${(props) => props.position || 'relative'};
    z-index: 2000;
    width: 100%;
    height: ${(props) => props.height || '65px'};
    background: var(--titlebar-bg);
`;

const Header = styled(motion.div)<{
    $isDraggable?: boolean;
    $isHidden?: boolean;
    $padRight?: boolean;
}>`
    position: relative;
    z-index: 15;
    width: 100%;
    height: 100%;
    margin-right: ${(props) => (props.$padRight ? '140px' : '1rem')};
    user-select: ${(props) => (props.$isHidden ? 'none' : 'auto')};
    pointer-events: ${(props) => (props.$isHidden ? 'none' : 'auto')};
    -webkit-app-region: ${(props) => props.$isDraggable && 'drag'};

    button {
        -webkit-app-region: no-drag;
    }

    input {
        -webkit-app-region: no-drag;
    }
`;

const BackgroundImage = styled.div<{ background: string }>`
    position: absolute;
    top: 0;
    z-index: 1;
    width: 100%;
    height: 100%;
    background: ${(props) => props.background || 'var(--titlebar-bg)'};
`;

const BackgroundImageOverlay = styled.div<{ theme: 'light' | 'dark' }>`
    position: absolute;
    top: 0;
    left: 0;
    z-index: 10;
    width: 100%;
    height: 100%;
    background: ${(props) =>
        props.theme === 'light'
            ? 'linear-gradient(rgba(255, 255, 255, 25%), rgba(255, 255, 255, 25%))'
            : 'linear-gradient(rgba(0, 0, 0, 50%), rgba(0, 0, 0, 50%))'};
`;

export interface PageHeaderProps
    extends Omit<FlexProps, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
    backgroundColor?: string;
    children?: React.ReactNode;
    height?: string;
    isHidden?: boolean;
    position?: string;
}

const TitleWrapper = styled(motion.div)`
    position: absolute;
    display: flex;
    width: 100%;
    height: 100%;
`;

const variants: Variants = {
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    initial: { opacity: 0 },
};

export const PageHeader = ({
    position,
    height,
    backgroundColor,
    isHidden,
    children,
    ...props
}: PageHeaderProps) => {
    const ref = useRef(null);
    const padRight = useShouldPadTitlebar();
    const { windowBarStyle } = useWindowSettings();
    const theme = useTheme();

    return (
        <Container
            ref={ref}
            height={height}
            position={position}
            {...props}
        >
            <Header
                $isDraggable={windowBarStyle === Platform.WEB}
                $isHidden={isHidden}
                $padRight={padRight}
            >
                <AnimatePresence initial={false}>
                    {!isHidden && (
                        <TitleWrapper
                            animate="animate"
                            exit="exit"
                            initial="initial"
                            variants={variants}
                        >
                            {children}
                        </TitleWrapper>
                    )}
                </AnimatePresence>
            </Header>
            {backgroundColor && (
                <>
                    <BackgroundImage background={backgroundColor || 'var(--titlebar-bg)'} />
                    <BackgroundImageOverlay theme={theme} />
                </>
            )}
        </Container>
    );
};
