import {
    CopyButton as MantineCopyButton,
    CopyButtonProps as MantineCopyButtonProps,
} from '@mantine/core';

export interface CopyButtonProps extends MantineCopyButtonProps {}

export const CopyButton = ({ children, ...props }: CopyButtonProps) => {
    return <MantineCopyButton {...props}>{children}</MantineCopyButton>;
};
