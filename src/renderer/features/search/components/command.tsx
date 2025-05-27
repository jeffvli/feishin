import { Command as Cmdk } from 'cmdk';

import './command.css';

export enum CommandPalettePages {
    GO_TO = 'go',
    HOME = 'home',
    MANAGE_SERVERS = 'servers',
}

export const Command = Cmdk as typeof Cmdk;
