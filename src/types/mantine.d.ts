import { PillVariant } from '@mantine/core';

type ExtendedPillVariant = 'outline' | PillVariant;

declare module '@mantine/core' {
    export interface PillProps {
        variant?: ExtendedPillVariant;
    }
}
