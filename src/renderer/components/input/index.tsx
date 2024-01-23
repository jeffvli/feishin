import React, { forwardRef } from 'react';
import type {
    TextInputProps as MantineTextInputProps,
    NumberInputProps as MantineNumberInputProps,
    PasswordInputProps as MantinePasswordInputProps,
    FileInputProps as MantineFileInputProps,
    JsonInputProps as MantineJsonInputProps,
    TextareaProps as MantineTextareaProps,
} from '@mantine/core';
import {
    TextInput as MantineTextInput,
    NumberInput as MantineNumberInput,
    PasswordInput as MantinePasswordInput,
    FileInput as MantineFileInput,
    JsonInput as MantineJsonInput,
    Textarea as MantineTextarea,
} from '@mantine/core';
import styled from 'styled-components';

interface TextInputProps extends MantineTextInputProps {
    children?: React.ReactNode;
    maxWidth?: number | string;
    width?: number | string;
}

interface NumberInputProps extends MantineNumberInputProps {
    children?: React.ReactNode;
    maxWidth?: number | string;
    width?: number | string;
}

interface PasswordInputProps extends MantinePasswordInputProps {
    children?: React.ReactNode;
    maxWidth?: number | string;
    width?: number | string;
}

interface FileInputProps extends MantineFileInputProps {
    children?: React.ReactNode;
    maxWidth?: number | string;
    width?: number | string;
}

interface JsonInputProps extends MantineJsonInputProps {
    children?: React.ReactNode;
    maxWidth?: number | string;
    width?: number | string;
}

interface TextareaProps extends MantineTextareaProps {
    children?: React.ReactNode;
    maxWidth?: number | string;
    width?: number | string;
}

const StyledTextInput = styled(MantineTextInput)<TextInputProps>`
    & .mantine-TextInput-wrapper {
        border-color: var(--primary-color);
    }

    & .mantine-TextInput-input {
        color: var(--input-fg);
        background: var(--input-bg);

        &::placeholder {
            color: var(--input-placeholder-fg);
        }
    }

    & .mantine-Input-icon {
        color: var(--input-placeholder-fg);
    }

    & .mantine-TextInput-required {
        color: var(--secondary-color);
    }

    & .mantine-TextInput-label {
        margin-bottom: 0.5rem;
        font-family: var(--label-font-family);
    }

    & .mantine-TextInput-disabled {
        opacity: 0.6;
    }

    & [data-disabled='true'] {
        opacity: 0.6;
    }

    transition: width 0.3s ease-in-out;
`;

const StyledNumberInput = styled(MantineNumberInput)<NumberInputProps>`
    & .mantine-NumberInput-wrapper {
        border-color: var(--primary-color);
    }

    & .mantine-NumberInput-input {
        color: var(--input-fg);
        background: var(--input-bg);

        &::placeholder {
            color: var(--input-placeholder-fg);
        }
    }

    & .mantine-NumberInput-controlUp {
        svg {
            color: var(--btn-default-fg);
            fill: var(--btn-default-fg);
        }
    }

    & .mantine-NumberInput-controlDown {
        svg {
            color: var(--btn-default-fg);
            fill: var(--btn-default-fg);
        }
    }

    & .mantine-Input-icon {
        color: var(--input-placeholder-fg);
    }

    & .mantine-NumberInput-required {
        color: var(--secondary-color);
    }

    & .mantine-NumberInput-label {
        margin-bottom: 0.5rem;
        font-family: var(--label-font-family);
    }

    & .mantine-NumberInput-disabled {
        opacity: 0.6;
    }

    & [data-disabled='true'] {
        opacity: 0.6;
    }

    transition: width 0.3s ease-in-out;
`;

const StyledPasswordInput = styled(MantinePasswordInput)<PasswordInputProps>`
    & .mantine-PasswordInput-input {
        color: var(--input-fg);
        background: var(--input-bg);

        &::placeholder {
            color: var(--input-placeholder-fg);
        }
    }

    & .mantine-PasswordInput-icon {
        color: var(--input-placeholder-fg);
    }

    & .mantine-PasswordInput-required {
        color: var(--secondary-color);
    }

    & .mantine-PasswordInput-label {
        margin-bottom: 0.5rem;
        font-family: var(--label-font-family);
    }

    & .mantine-PasswordInput-disabled {
        opacity: 0.6;
    }

    & [data-disabled='true'] {
        opacity: 0.6;
    }

    transition: width 0.3s ease-in-out;
`;

const StyledFileInput = styled(MantineFileInput)<FileInputProps>`
    & .mantine-FileInput-input {
        color: var(--input-fg);
        background: var(--input-bg);

        &::placeholder {
            color: var(--input-placeholder-fg);
        }
    }

    & .mantine-FileInput-icon {
        color: var(--input-placeholder-fg);
    }

    & .mantine-FileInput-required {
        color: var(--secondary-color);
    }

    & .mantine-FileInput-label {
        margin-bottom: 0.5rem;
        font-family: var(--label-font-family);
    }

    & .mantine-FileInput-disabled {
        opacity: 0.6;
    }

    & [data-disabled='true'] {
        opacity: 0.6;
    }

    transition: width 0.3s ease-in-out;
`;

const StyledJsonInput = styled(MantineJsonInput)<JsonInputProps>`
    & .mantine-JsonInput-input {
        color: var(--input-fg);
        background: var(--input-bg);

        &::placeholder {
            color: var(--input-placeholder-fg);
        }
    }

    & .mantine-JsonInput-icon {
        color: var(--input-placeholder-fg);
    }

    & .mantine-JsonInput-required {
        color: var(--secondary-color);
    }

    & .mantine-JsonInput-label {
        margin-bottom: 0.5rem;
        font-family: var(--label-font-family);
    }

    & .mantine-JsonInput-disabled {
        opacity: 0.6;
    }

    & [data-disabled='true'] {
        opacity: 0.6;
    }

    transition: width 0.3s ease-in-out;
`;

const StyledTextarea = styled(MantineTextarea)<TextareaProps>`
    & .mantine-Textarea-input {
        color: var(--input-fg);
        background: var(--input-bg);
    }

    & .mantine-Textarea-icon {
        color: var(--input-placeholder-fg);
    }

    & .mantine-Textarea-required {
        color: var(--secondary-color);
    }

    & .mantine-Textarea-label {
        margin-bottom: 0.5rem;
        font-family: var(--label-font-family);
    }

    & .mantine-Textarea-disabled {
        opacity: 0.6;
    }

    & [data-disabled='true'] {
        opacity: 0.6;
    }

    transition: width 0.3s ease-in-out;
`;

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
    ({ children, width, maxWidth, ...props }: TextInputProps, ref) => {
        return (
            <StyledTextInput
                ref={ref}
                spellCheck={false}
                {...props}
                style={{ maxWidth, width }}
            >
                {children}
            </StyledTextInput>
        );
    },
);

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
    ({ children, width, maxWidth, ...props }: NumberInputProps, ref) => {
        return (
            <StyledNumberInput
                ref={ref}
                hideControls
                spellCheck={false}
                {...props}
                style={{ maxWidth, width }}
            >
                {children}
            </StyledNumberInput>
        );
    },
);

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
    ({ children, width, maxWidth, ...props }: PasswordInputProps, ref) => {
        return (
            <StyledPasswordInput
                ref={ref}
                {...props}
                style={{ maxWidth, width }}
            >
                {children}
            </StyledPasswordInput>
        );
    },
);

export const FileInput = forwardRef<HTMLButtonElement, FileInputProps>(
    ({ children, width, maxWidth, ...props }: FileInputProps, ref) => {
        return (
            <StyledFileInput
                ref={ref}
                {...props}
                style={{ maxWidth, width }}
                styles={{
                    placeholder: {
                        color: 'var(--input-placeholder-fg)',
                    },
                }}
            >
                {children}
            </StyledFileInput>
        );
    },
);

export const JsonInput = forwardRef<HTMLTextAreaElement, JsonInputProps>(
    ({ children, width, maxWidth, ...props }: JsonInputProps, ref) => {
        return (
            <StyledJsonInput
                ref={ref}
                {...props}
                style={{ maxWidth, width }}
            >
                {children}
            </StyledJsonInput>
        );
    },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ children, width, maxWidth, ...props }: TextareaProps, ref) => {
        return (
            <StyledTextarea
                ref={ref}
                {...props}
                style={{ maxWidth, width }}
            >
                {children}
            </StyledTextarea>
        );
    },
);

TextInput.defaultProps = {
    children: undefined,
    maxWidth: undefined,
    width: undefined,
};

NumberInput.defaultProps = {
    children: undefined,
    maxWidth: undefined,
    width: undefined,
};

PasswordInput.defaultProps = {
    children: undefined,
    maxWidth: undefined,
    width: undefined,
};

FileInput.defaultProps = {
    children: undefined,
    maxWidth: undefined,
    width: undefined,
};

JsonInput.defaultProps = {
    children: undefined,
    maxWidth: undefined,
    width: undefined,
};

Textarea.defaultProps = {
    children: undefined,
    maxWidth: undefined,
    width: undefined,
};
