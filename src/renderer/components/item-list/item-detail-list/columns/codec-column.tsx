import { ItemDetailListCellProps } from './types';

export const CodecColumn = ({ song }: ItemDetailListCellProps) =>
    song.codec ?? song.container ?? <>&nbsp;</>;
