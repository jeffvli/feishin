import type { DropzoneProps as MantineDropzoneProps } from '@mantine/dropzone';
import { Dropzone as MantineDropzone } from '@mantine/dropzone';
import styled from 'styled-components';

export type DropzoneProps = MantineDropzoneProps;

const StyledDropzone = styled(MantineDropzone)`
  display: flex;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: var(--input-bg);
  border-radius: 5px;
  opacity: 0.8;
  transition: opacity 0.2s ease;

  &:hover {
    background: var(--input-bg);
    opacity: 1;
  }

  & .mantine-Dropzone-inner {
    display: flex;
  }
`;

export const Dropzone = ({ children, ...props }: DropzoneProps) => {
  return <StyledDropzone {...props}>{children}</StyledDropzone>;
};

Dropzone.Accept = StyledDropzone.Accept;
Dropzone.Idle = StyledDropzone.Idle;
Dropzone.Reject = StyledDropzone.Reject;
