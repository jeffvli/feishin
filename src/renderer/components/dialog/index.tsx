import type { DialogProps as MantineDialogProps } from '@mantine/core';
import { Dialog as MantineDialog } from '@mantine/core';
import styled from 'styled-components';

const StyledDialog = styled(MantineDialog)`
    &.mantine-Dialog-root {
        background-color: var(--modal-bg);
        box-shadow: 2px 2px 10px 2px rgb(0 0 0 / 40%);
    }
`;

export const Dialog = ({ ...props }: MantineDialogProps) => {
    return <StyledDialog {...props} />;
};
