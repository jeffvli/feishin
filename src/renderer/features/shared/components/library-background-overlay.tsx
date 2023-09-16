import styled from 'styled-components';

export const LibraryBackgroundOverlay = styled.div<{ backgroundColor?: string }>`
    position: absolute;
    z-index: -1;
    width: 100%;
    height: 20vh;
    min-height: 200px;
    pointer-events: none;
    user-select: none;
    background: ${(props) => props.backgroundColor};
    background-image: var(--bg-subheader-overlay);
    opacity: 0.3;
`;
