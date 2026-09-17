import { ItemTableListColumnConfig } from '/@/renderer/components/item-list/types';
import { TableColumn } from '/@/shared/types/types';

const MIN: Partial<Record<TableColumn, number>> = {
    [TableColumn.ACTIONS]: 24,
    [TableColumn.DURATION]: 52,
    [TableColumn.ROW_INDEX]: 40,
    [TableColumn.TRACK_NUMBER]: 40,
    [TableColumn.USER_FAVORITE]: 24,
    [TableColumn.USER_RATING]: 48,
};

export const getColumnMinWidth = (id: TableColumn) => MIN[id] ?? 48;

const isResizable = (col: ItemTableListColumnConfig | undefined) =>
    !!col && col.id !== TableColumn.LAYOUT_FILL;

// pull need px out of order cols one by one as each hits its floor
const steal = (
    columns: ItemTableListColumnConfig[],
    next: number[],
    order: number[],
    need: number,
): number => {
    for (const j of order) {
        if (need <= 0) break;
        const take = Math.min(need, next[j] - getColumnMinWidth(columns[j].id));
        if (take <= 0) continue;
        next[j] -= take;
        need -= take;
    }
    return need;
};

// resize column i against its neighbors. keeps shoving the next col once
// the current one is bottomed out. last col pushes left instead of right.
export const applyColumnResize = (
    columns: ItemTableListColumnConfig[],
    widths: number[],
    i: number,
    desired: number,
): number[] => {
    if (!isResizable(columns[i])) return widths;

    const toRight: number[] = [];
    for (let j = i + 1; j < columns.length; j += 1) {
        if (isResizable(columns[j])) toRight.push(j);
    }

    const toLeft: number[] = [];
    for (let j = i - 1; j >= 0; j -= 1) {
        if (isResizable(columns[j])) toLeft.push(j);
    }

    const push = toRight.length > 0 ? toRight : toLeft;
    if (push.length === 0) return widths;

    const delta = Math.round(desired) - widths[i];
    if (delta === 0) return widths;

    const next = widths.slice();
    const minI = getColumnMinWidth(columns[i].id);
    const sink = push[0];

    if (delta > 0) {
        const leftover = steal(columns, next, push, delta);
        next[i] = widths[i] + (delta - leftover);
        return next;
    }

    let need = -delta;
    const shrinkI = Math.min(need, widths[i] - minI);
    next[i] = widths[i] - shrinkI;
    next[sink] += shrinkI;
    need -= shrinkI;

    if (need > 0) {
        const further = toRight.length > 0 ? toLeft : push.slice(1);
        const leftover = steal(columns, next, further, need);
        next[sink] += need - leftover;
    }

    return next;
};
