import React, { forwardRef } from 'react';
import styled from '@emotion/styled';
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

interface TextInputProps extends MantineTextInputProps {
  children?: React.ReactNode;
  width?: number | string;
}

interface NumberInputProps extends MantineNumberInputProps {
  children?: React.ReactNode;
  width?: number | string;
}

interface PasswordInputProps extends MantinePasswordInputProps {
  children?: React.ReactNode;
  width?: number | string;
}

interface FileInputProps extends MantineFileInputProps {
  children?: React.ReactNode;
  width?: number | string;
}

const StyledTextInput = styled(MantineTextInput)<TextInputProps>`
  &:focus,
  &:focus-within {
    border-color: var(--primary-color);
  }

  & .mantine-TextInput-wrapper {
    border-color: var(--primary-color);
  }

  & .mantine-TextInput-input {
    &:focus,
    &:focus-within {
      border-color: var(--primary-color);
    }

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
`;

const StyledNumberInput = styled(MantineNumberInput)<NumberInputProps>`
  &:focus,
  &:focus-within {
    border-color: var(--primary-color);
  }

  & .mantine-NumberInput-wrapper {
    border-color: var(--primary-color);
  }

  & .mantine-NumberInput-input {
    &:focus,
    &:focus-within {
      border-color: var(--primary-color);
    }

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
`;

const StyledPasswordInput = styled(MantinePasswordInput)<PasswordInputProps>`
  & .mantine-PasswordInput-input {
    &:focus,
    &:focus-within {
      border-color: var(--primary-color);
    }
  }

  & .mantine-PasswordInput-required {
    color: var(--secondary-color);
  }

  & .mantine-PasswordInput-label {
    font-family: var(--label-font-faimly);
  }
`;

const StyledFileInput = styled(MantineFileInput)<FileInputProps>`
  & .mantine-FileInput-input {
    &:focus,
    &:focus-within {
      border-color: var(--primary-color);
    }
  }

  & .mantine-FileInput-required {
    color: var(--secondary-color);
  }

  & .mantine-FileInput-label {
    font-family: var(--label-font-faimly);
  }
`;

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ children, width, ...props }: TextInputProps, ref) => {
    return (
      <StyledTextInput ref={ref} spellCheck={false} {...props} sx={{ width }}>
        {children}
      </StyledTextInput>
    );
  }
);

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ children, width, ...props }: NumberInputProps, ref) => {
    return (
      <StyledNumberInput ref={ref} spellCheck={false} {...props} sx={{ width }}>
        {children}
      </StyledNumberInput>
    );
  }
);

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ children, width, ...props }: PasswordInputProps, ref) => {
    return (
      <StyledPasswordInput
        ref={ref}
        spellCheck={false}
        {...props}
        sx={{ width }}
      >
        {children}
      </StyledPasswordInput>
    );
  }
);

export const FileInput = forwardRef<HTMLButtonElement, FileInputProps>(
  ({ children, width, ...props }: FileInputProps, ref) => {
    return (
      <StyledFileInput ref={ref} spellCheck={false} {...props} sx={{ width }}>
        {children}
      </StyledFileInput>
    );
  }
);

TextInput.defaultProps = {
  children: undefined,
  width: undefined,
};

NumberInput.defaultProps = {
  children: undefined,
  width: undefined,
};

PasswordInput.defaultProps = {
  children: undefined,
  width: undefined,
};

FileInput.defaultProps = {
  children: undefined,
  width: undefined,
};
