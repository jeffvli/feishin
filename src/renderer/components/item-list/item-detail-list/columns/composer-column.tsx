import { ItemDetailListCellProps } from './types';

export const ComposerColumn = ({ song }: ItemDetailListCellProps) => {
    const composers = song.participants?.composer;
    if (!composers?.length) return <>&nbsp;</>;
    return composers.map((a) => a.name).join(', ');
};
