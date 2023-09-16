import { Command as Cmdk } from 'cmdk';
import styled from 'styled-components';

export enum CommandPalettePages {
    GO_TO = 'go',
    HOME = 'home',
    MANAGE_SERVERS = 'servers',
}

export const Command = styled(Cmdk)`
    [cmdk-root] {
        background-color: var(--background-color);
    }

    input[cmdk-input] {
        width: 100%;
        height: 1.5rem;
        padding: 1.3rem 0.5rem;
        margin-bottom: 1rem;
        font-family: var(--content-font-family);
        color: var(--input-fg);
        background: var(--input-bg);
        border: none;
        border-radius: 5px;

        &::placeholder {
            color: var(--input-placeholder-fg);
        }
    }

    [cmdk-group-heading] {
        margin: 1rem 0;
        font-size: 0.9rem;
        opacity: 0.8;
    }

    [cmdk-group-items] {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }

    [cmdk-item] {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        padding: 0.5rem;
        font-family: var(--content-font-family);
        color: var(--btn-default-fg);
        cursor: pointer;
        background: var(--btn-default-bg);
        border-radius: 5px;

        svg {
            width: 1.2rem;
            height: 1.2rem;
        }

        &[data-selected] {
            color: var(--btn-default-fg-hover);
            background: var(--btn-default-bg-hover);
        }
    }

    [cmdk-separator] {
        height: 1px;
        margin: 0 0 0.5rem;
        background: var(--generic-border-color);
    }
`;
