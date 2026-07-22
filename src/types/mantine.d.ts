import { ActionIconSize, PillVariant, TagsInputVariant } from '@mantine/core';

type ExtendedActionIconSize = 'compact-md' | 'compact-sm' | 'compact-xs' | ActionIconSize;
type ExtendedPillVariant = 'outline' | PillVariant;
type ExtendedTagsInputVariant = 'default' | 'filled' | TagsInputVariant;

declare module '@mantine/core' {
    export interface ActionIconProps {
        size?: ExtendedActionIconSize;
    }

    export interface PillProps {
        variant?: ExtendedPillVariant;
    }

    export interface TagsInputProps {
        variant?: ExtendedTagsInputVariant;
    }
}
