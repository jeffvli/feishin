import { useEffect, useState } from 'react';
import { Group, NumberInputProps, Stack, rem } from '@mantine/core';
import { useMove, usePrevious } from '@mantine/hooks';
import { Text } from '/@/renderer/components/text';
import { NumberInput } from '/@/renderer/components';
import styled from 'styled-components';

interface VerticalSliderProps {
    onChange: (value: number) => void;

    title?: string;
    value: number;
}

export const DB_RADIUS = 6;
const DB_DIAMATER = 2 * DB_RADIUS;
const DB_SCALE = 100 / DB_DIAMATER;

const EqualizerNumberInput = styled(NumberInput)<NumberInputProps>`
    & .mantine-NumberInput-input {
        text-align: center;
    }
`;

export const EqualizerSlider = ({ value, title, onChange }: VerticalSliderProps) => {
    const [seekingValue, setValue] = useState(value);

    const { ref, active } = useMove(({ y }) => {
        const value = Math.round((0.5 - y) * DB_DIAMATER * 10) / 10;
        setValue(value);
    });

    const wasActive = usePrevious(active);

    useEffect(() => {
        if (wasActive && !active) {
            onChange(seekingValue);
        }
    }, [active, onChange, seekingValue, wasActive]);

    const displayValue = active ? seekingValue : value;

    return (
        <>
            <Stack align="center">
                {title && (
                    <Text
                        mt="sm"
                        ta="center"
                    >
                        {title}
                    </Text>
                )}
                <div
                    ref={ref}
                    style={{
                        backgroundColor: 'var(--input-bg)',
                        height: rem(120),
                        position: 'relative',
                        width: rem(16),
                    }}
                >
                    <div
                        style={{
                            backgroundColor: 'var(--primary-color)',
                            bottom: 0,
                            height: `${(displayValue + DB_RADIUS) * DB_SCALE}%`,
                            position: 'absolute',
                            width: rem(16),
                        }}
                    />
                    <div
                        style={{
                            backgroundColor: 'var(--input-active-fg)',
                            bottom: `calc(${(displayValue + DB_RADIUS) * DB_SCALE}% - ${rem(8)})`,
                            height: rem(16),
                            left: 0,
                            position: 'absolute',
                            width: rem(16),
                        }}
                    />
                </div>
                <Group spacing={5}>
                    <EqualizerNumberInput
                        // why a key? Apparently without it the number input would
                        // not update its value when the slider changed......
                        key={displayValue}
                        max={DB_RADIUS}
                        min={-DB_RADIUS}
                        precision={1}
                        radius="xs"
                        rightSection="db"
                        step={0.1}
                        value={displayValue}
                        variant="unstyled"
                        width={rem(74)}
                        onChange={(val) => {
                            onChange(Number(val));
                        }}
                    />
                </Group>
            </Stack>
        </>
    );
};
