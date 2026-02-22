import { ItemDetailListCellProps } from './types';

export const CommentColumn = ({ song }: ItemDetailListCellProps) => song.comment ?? <>&nbsp;</>;
