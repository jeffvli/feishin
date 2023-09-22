import styled from 'styled-components';

export const ResizeHandle = styled.div<{
    $isResizing: boolean;
    $placement: 'top' | 'left' | 'bottom' | 'right';
}>`
    position: absolute;
    top: ${(props) => props.$placement === 'top' && 0};
    right: ${(props) => props.$placement === 'right' && 0};
    bottom: ${(props) => props.$placement === 'bottom' && 0};
    left: ${(props) => props.$placement === 'left' && 0};
    z-index: 90;
    width: 4px;
    height: 100%;
    cursor: ew-resize;
    opacity: ${(props) => (props.$isResizing ? 1 : 0)};

    &:hover {
        opacity: 0.7;
    }

    &::before {
        position: absolute;
        top: ${(props) => props.$placement === 'top' && 0};
        right: ${(props) => props.$placement === 'right' && 0};
        bottom: ${(props) => props.$placement === 'bottom' && 0};
        left: ${(props) => props.$placement === 'left' && 0};
        width: 1px;
        height: 100%;
        content: '';
        background-color: var(--sidebar-handle-bg);
    }
`;
