import {
    FileButton as MantineFileButton,
    FileButtonProps as MantineFileButtonProps,
} from '@mantine/core';
import { CSSProperties } from 'react';

export interface FileButtonProps extends MantineFileButtonProps {
    maxWidth?: CSSProperties['maxWidth'];
    width?: CSSProperties['width'];
}

export const FileButton = MantineFileButton;
