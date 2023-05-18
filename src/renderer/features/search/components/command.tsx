import { Command as Cmdk } from 'cmdk';
import styled from 'styled-components';

export enum CommandPalettePages {
  GO_TO = 'go to',
  HOME = 'home',
}

export const Command = styled(Cmdk)`
  [cmdk-root] {
    font-family: var(--content-font-family);
    background-color: var(--background-color);
  }

  input[cmdk-input] {
    width: 100%;
    height: 2rem;
    margin-bottom: 1rem;
    padding: 0 0.5rem;
    color: var(--input-fg);
    font-size: 1.1rem;
    background: transparent;
    border: none;

    &::placeholder {
      color: var(--input-placeholder-fg);
    }
  }

  div[cmdk-group-heading] {
    margin: 1rem 0;
    font-size: 0.9rem;
    opacity: 0.8;
  }

  div[cmdk-item] {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    padding: 1rem 0.5rem;
    color: var(--btn-subtle-fg);
    background: var(--btn-subtle-bg);
    border-radius: 5px;

    svg {
      width: 1.2rem;
      height: 1.2rem;
    }

    &[data-selected] {
      color: var(--btn-subtle-fg-hover);
      background: rgba(255, 255, 255, 10%);
    }
  }

  div[cmdk-separator] {
    height: 1px;
    margin: 0 0 0.5rem;
    background: var(--generic-border-color);
  }
`;
