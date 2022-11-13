import React, { forwardRef } from 'react';
import {
  TextInput as MantineTextInput,
  TextInputProps as MantineTextInputProps,
  NumberInput as MantineNumberInput,
  NumberInputProps as MantineNumberInputProps,
  PasswordInput as MantinePasswordInput,
  PasswordInputProps as MantinePasswordInputProps,
  FileInput as MantineFileInput,
  FileInputProps as MantineFileInputProps,
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
    font-family: var(--label-font-faimly);
  }

  & .mantine-TextInput-disabled {
    opacity: 0.6;
  }
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

  & .mantine-Input-icon {
    color: var(--input-placeholder-fg);
  }

  & .mantine-NumberInput-required {
    color: var(--secondary-color);
  }

  & .mantine-NumberInput-label {
    font-family: var(--label-font-faimly);
  }

  & .mantine-NumberInput-disabled {
    opacity: 0.6;
  }
`;

const StyledPasswordInput = styled(MantinePasswordInput)<PasswordInputProps>`
  & .mantine-PasswordInput-required {
    color: var(--secondary-color);
  }

  & .mantine-PasswordInput-label {
    font-family: var(--label-font-faimly);
  }

  & .mantine-PasswordInput-disabled {
    opacity: 0.6;
  }
`;

const StyledFileInput = styled(MantineFileInput)<FileInputProps>`
  & .mantine-FileInput-required {
    color: var(--secondary-color);
  }

  & .mantine-FileInput-label {
    font-family: var(--label-font-faimly);
  }

  & .mantine-PasswordInput-disabled {
    opacity: 0.6;
  }
`;

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ children, width, maxWidth, ...props }: TextInputProps, ref) => {
    return (
      <StyledTextInput
        ref={ref}
        spellCheck={false}
        {...props}
        sx={{ maxWidth, width }}
      >
        {children}
      </StyledTextInput>
    );
  }
);

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ children, width, maxWidth, ...props }: NumberInputProps, ref) => {
    return (
      <StyledNumberInput
        ref={ref}
        spellCheck={false}
        {...props}
        sx={{ maxWidth, width }}
      >
        {children}
      </StyledNumberInput>
    );
  }
);

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ children, width, maxWidth, ...props }: PasswordInputProps, ref) => {
    return (
      <StyledPasswordInput
        ref={ref}
        spellCheck={false}
        {...props}
        sx={{ maxWidth, width }}
      >
        {children}
      </StyledPasswordInput>
    );
  }
);

export const FileInput = forwardRef<HTMLButtonElement, FileInputProps>(
  ({ children, width, maxWidth, ...props }: FileInputProps, ref) => {
    return (
      <StyledFileInput
        ref={ref}
        spellCheck={false}
        {...props}
        sx={{ maxWidth, width }}
      >
        {children}
      </StyledFileInput>
    );
  }
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
