import { rem, Slider, SliderProps } from '@mantine/core';

export const PlayerbarSlider = ({ ...props }: SliderProps) => {
    return (
        <Slider
            styles={{
                bar: {
                    backgroundColor: 'var(--playerbar-slider-track-progress-bg)',
                    transition: 'background-color 0.2s ease',
                },
                label: {
                    backgroundColor: 'var(--tooltip-bg)',
                    color: 'var(--tooltip-fg)',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    padding: '0 1rem',
                },
                root: {
                    '&:hover': {
                        '& .mantine-Slider-bar': {
                            backgroundColor: 'var(--primary-color)',
                        },
                        '& .mantine-Slider-thumb': {
                            opacity: 1,
                        },
                    },
                },
                thumb: {
                    backgroundColor: 'var(--slider-thumb-bg)',
                    borderColor: 'var(--primary-color)',
                    borderWidth: rem(1),
                    height: '1rem',
                    opacity: 0,
                    width: '1rem',
                },
                track: {
                    '&::before': {
                        backgroundColor: 'var(--playerbar-slider-track-bg)',
                        right: 'calc(0.1rem * -1)',
                    },
                },
            }}
            {...props}
            onClick={(e) => {
                e?.stopPropagation();
            }}
        />
    );
};
