import { ItemDetailListCellProps } from './types';

interface DefaultColumnProps extends ItemDetailListCellProps {
    columnId: string;
}

export const DefaultColumn = ({ columnId, song }: DefaultColumnProps) => {
    const raw = (song as Record<string, unknown>)[columnId];
    if (raw === undefined || raw === null || typeof raw === 'object') return <>&nbsp;</>;
    return String(raw);
};
