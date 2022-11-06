import { useMemo, useState } from 'react';
import format from 'format-duration';
import ReactSlider, { ReactSliderProps } from 'react-slider';
import styled from 'styled-components';

interface SliderProps extends ReactSliderProps {
  hasTooltip?: boolean;
  height: string;
  tooltipType?: 'text' | 'time';
}

const StyledSlider = styled(ReactSlider)<SliderProps | any>`
  width: 100%;
  height: ${(props) => props.height};
  outline: none;

  .thumb {
    top: 37%;
    opacity: 1;

    &::after {
      position: absolute;
      top: -25px;
      left: -18px;
      display: ${(props) =>
        props.$isDragging && props.$hasToolTip ? 'block' : 'none'};
      padding: 2px 6px;
      color: var(--tooltip-fg);
      white-space: nowrap;
      background: var(--tooltip-bg);
      border-radius: 4px;
      content: attr(data-tooltip);
    }

    &:focus-visible {
      width: 13px;
      height: 13px;
      text-align: center;
      background-color: #fff;
      border: 1px var(--primary-color) solid;
      border-radius: 100%;
      outline: none;
      transform: translate(-12px, -4px);
      opacity: 1;
    }
  }

  .track-0 {
    background: ${(props) => props.$isDragging && 'var(--primary-color)'};
    transition: background 0.2s ease-in-out;
  }

  .track {
    top: 37%;
    border-radius: 5px;
  }

  &:hover {
    .track-0 {
      background: var(--primary-color);
    }
  }
`;

const MemoizedThumb = ({ props, state, toolTipType }: any) => {
  const { value } = state;
  const formattedValue = useMemo(() => {
    if (toolTipType === 'text') {
      return value;
    }

    return format(value * 1000);
  }, [toolTipType, value]);

  return <div {...props} data-tooltip={formattedValue} />;
};

const StyledTrack = styled.div<any>`
  top: 0;
  bottom: 0;
  height: 5px;
  background: ${(props) =>
    props.index === 1
      ? 'var(--playerbar-slider-track-bg)'
      : 'var(--playerbar-slider-track-progress-bg)'};
`;

const Track = (props: any, state: any) => (
  // eslint-disable-next-line react/destructuring-assignment
  <StyledTrack {...props} index={state.index} />
);
const Thumb = (props: any, state: any, toolTipType: any) => (
  <MemoizedThumb
    key="slider"
    props={props}
    state={state}
    tabIndex={0}
    toolTipType={toolTipType}
  />
);

export const Slider = ({
  height,
  tooltipType: toolTipType,
  hasTooltip: hasToolTip,
  ...rest
}: SliderProps) => {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <StyledSlider
      {...rest}
      $hasToolTip={hasToolTip}
      $isDragging={isDragging}
      className="player-slider"
      defaultValue={0}
      height={height}
      renderThumb={(props: any, state: any) => {
        return Thumb(props, state, toolTipType);
      }}
      renderTrack={Track}
      onAfterChange={(e: number, index: number) => {
        if (rest.onAfterChange) {
          rest.onAfterChange(e, index);
        }
        setIsDragging(false);
      }}
      onBeforeChange={(e: number, index: number) => {
        if (rest.onBeforeChange) {
          rest.onBeforeChange(e, index);
        }
        setIsDragging(true);
      }}
    />
  );
};

Slider.defaultProps = {
  hasTooltip: true,
  tooltipType: 'text',
};
