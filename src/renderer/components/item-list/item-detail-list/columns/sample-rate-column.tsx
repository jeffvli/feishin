import { ItemDetailListCellProps } from './types';

export const SampleRateColumn = ({ song }: ItemDetailListCellProps) =>
    song.sampleRate ? `${song.sampleRate} Hz` : <>&nbsp;</>;
