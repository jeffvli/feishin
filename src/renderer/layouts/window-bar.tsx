import { useCallback, useState } from 'react';
import isElectron from 'is-electron';
import { RiCheckboxBlankLine, RiCloseLine, RiSubtractLine } from 'react-icons/ri';
import styled from 'styled-components';
import { useCurrentStatus, useQueueStatus } from '/@/renderer/store';
import { useWindowSettings } from '/@/renderer/store/settings.store';
import { Platform, PlayerStatus } from '/@/renderer/types';
import macCloseHover from './assets/close-mac-hover.png';
import macClose from './assets/close-mac.png';
import macMaxHover from './assets/max-mac-hover.png';
import macMax from './assets/max-mac.png';
import macMinHover from './assets/min-mac-hover.png';
import macMin from './assets/min-mac.png';
import appIcon from '../../../assets/icons/32x32.png';

const WindowsContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100vw;
    color: var(--window-bar-fg);
    background-color: var(--window-bar-bg);
    -webkit-app-region: drag;
`;

const WindowsButtonGroup = styled.div`
    display: flex;
    width: 130px;
    height: 100%;
    -webkit-app-region: no-drag;
`;

const WindowsButton = styled.div<{ $exit?: boolean }>`
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    -webkit-app-region: no-drag;
    width: 50px;
    height: 30px;

    img {
        width: 35%;
        height: 50%;
    }

    &:hover {
        background: ${({ $exit }) => ($exit ? 'var(--danger-color)' : 'rgba(125, 125, 125, 30%)')};
    }
`;

const PlayerStatusContainer = styled.div`
    display: flex;
    gap: 0.5rem;
    max-width: 45vw;
    padding-left: 1rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const browser = isElectron() ? window.electron.browser : null;
const close = () => browser?.exit();
const minimize = () => browser?.minimize();
const maximize = () => browser?.maximize();
const unmaximize = () => browser?.unmaximize();

interface WindowBarControlsProps {
    controls: {
        handleClose: () => void;
        handleMaximize: () => void;
        handleMinimize: () => void;
    };
    title: string;
}

const WindowsControls = ({ controls, title }: WindowBarControlsProps) => {
    const { handleClose, handleMaximize, handleMinimize } = controls;

    return (
        <WindowsContainer>
            <PlayerStatusContainer>
                <img
                    alt=""
                    height={18}
                    src={appIcon}
                    width={18}
                />
                {title}
            </PlayerStatusContainer>
            <WindowsButtonGroup>
                <WindowsButton
                    role="button"
                    onClick={handleMinimize}
                >
                    <RiSubtractLine size={19} />
                </WindowsButton>
                <WindowsButton
                    role="button"
                    onClick={handleMaximize}
                >
                    <RiCheckboxBlankLine size={13} />
                </WindowsButton>
                <WindowsButton
                    $exit
                    role="button"
                    onClick={handleClose}
                >
                    <RiCloseLine size={19} />
                </WindowsButton>
            </WindowsButtonGroup>
        </WindowsContainer>
    );
};

const MacOsContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100vw;
    -webkit-app-region: drag;
    color: var(--window-bar-fg);
    background-color: var(--window-bar-bg);
`;

const MacOsButtonGroup = styled.div`
    position: absolute;
    top: 5px;
    left: 0.5rem;
    display: grid;
    grid-template-columns: repeat(3, 20px);
    height: 100%;

    -webkit-app-region: no-drag;
`;

export const MacOsButton = styled.div<{
    $maxButton?: boolean;
    $minButton?: boolean;
    $restoreButton?: boolean;
}>`
    grid-row: 1 / span 1;
    grid-column: ${(props) =>
        props.$minButton ? 2 : props.$maxButton || props.$restoreButton ? 3 : 1};
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    user-select: none;

    img {
        width: 18px;
        height: 18px;
    }
`;

const MacOsControls = ({ controls, title }: WindowBarControlsProps) => {
    const { handleClose, handleMaximize, handleMinimize } = controls;

    const [hoverMin, setHoverMin] = useState(false);
    const [hoverMax, setHoverMax] = useState(false);
    const [hoverClose, setHoverClose] = useState(false);

    return (
        <MacOsContainer>
            <MacOsButtonGroup>
                <MacOsButton
                    $minButton
                    className="button"
                    id="min-button"
                    onClick={handleMinimize}
                    onMouseLeave={() => setHoverMin(false)}
                    onMouseOver={() => setHoverMin(true)}
                >
                    <img
                        alt=""
                        className="icon"
                        draggable="false"
                        src={hoverMin ? macMinHover : macMin}
                    />
                </MacOsButton>
                <MacOsButton
                    $maxButton
                    className="button"
                    id="max-button"
                    onClick={handleMaximize}
                    onMouseLeave={() => setHoverMax(false)}
                    onMouseOver={() => setHoverMax(true)}
                >
                    <img
                        alt=""
                        className="icon"
                        draggable="false"
                        src={hoverMax ? macMaxHover : macMax}
                    />
                </MacOsButton>
                <MacOsButton
                    className="button"
                    id="close-button"
                    onClick={handleClose}
                    onMouseLeave={() => setHoverClose(false)}
                    onMouseOver={() => setHoverClose(true)}
                >
                    <img
                        alt=""
                        className="icon"
                        draggable="false"
                        src={hoverClose ? macCloseHover : macClose}
                    />
                </MacOsButton>
            </MacOsButtonGroup>
            <PlayerStatusContainer>{title}</PlayerStatusContainer>
        </MacOsContainer>
    );
};

export const WindowBar = () => {
    const playerStatus = useCurrentStatus();
    const { currentSong, index, length } = useQueueStatus();
    const { windowBarStyle } = useWindowSettings();

    const statusString = playerStatus === PlayerStatus.PAUSED ? '(Paused) ' : '';
    const queueString = length ? `(${index + 1} / ${length}) ` : '';
    const title = length
        ? currentSong?.artistName
            ? `${statusString}${queueString}${currentSong?.name} — ${currentSong?.artistName}`
            : `${statusString}${queueString}${currentSong?.name}`
        : 'Feishin';
    document.title = title;

    const [max, setMax] = useState(false);

    const handleMinimize = () => minimize();

    const handleMaximize = useCallback(() => {
        if (max) {
            unmaximize();
        } else {
            maximize();
        }
        setMax(!max);
    }, [max]);

    const handleClose = useCallback(() => close(), []);

    return (
        <>
            {windowBarStyle === Platform.WINDOWS && (
                <WindowsControls
                    controls={{ handleClose, handleMaximize, handleMinimize }}
                    title={title}
                />
            )}
            {windowBarStyle === Platform.MACOS && (
                <MacOsControls
                    controls={{ handleClose, handleMaximize, handleMinimize }}
                    title={title}
                />
            )}
        </>
    );
};
