import { useState } from 'react';
import isElectron from 'is-electron';
import { RiCheckboxBlankLine, RiCloseLine, RiSubtractLine } from 'react-icons/ri';
import styled from 'styled-components';
import { browser } from '#preload';

interface WindowControlsProps {
  style?: 'macos' | 'windows' | 'linux';
}

const WindowsButtonGroup = styled.div`
  display: flex;
  width: 130px;
  height: 100%;
  -webkit-app-region: no-drag;
`;

export const WindowsButton = styled.div<{ $exit?: boolean }>`
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
    background: ${({ $exit }) => ($exit ? 'rgba(200, 50, 0, 30%)' : 'rgba(125, 125, 125, 30%)')};
  }
`;

const close = () => browser.exit();

const minimize = () => browser.minimize();

const maximize = () => browser.maximize();

const unmaximize = () => browser.unmaximize();

export const WindowControls = ({ style }: WindowControlsProps) => {
  const [max, setMax] = useState(false);

  const handleMinimize = () => minimize();

  const handleMaximize = () => {
    if (max) {
      unmaximize();
    } else {
      maximize();
    }
    setMax(!max);
  };

  const handleClose = () => close();

  return (
    <>
      {isElectron() && (
        <>
          {style === 'windows' && (
            <WindowsButtonGroup>
              <WindowsButton
                role="button"
                onClick={handleMinimize}
              >
                <RiSubtractLine size={20} />
              </WindowsButton>
              <WindowsButton
                role="button"
                onClick={handleMaximize}
              >
                <RiCheckboxBlankLine size={15} />
              </WindowsButton>
              <WindowsButton
                $exit
                role="button"
                onClick={handleClose}
              >
                <RiCloseLine size={20} />
              </WindowsButton>
            </WindowsButtonGroup>
          )}
        </>
      )}
    </>
  );
};

WindowControls.defaultProps = {
  style: 'windows',
};
