import { ItemTableListColumnConfig } from '/@/renderer/components/item-list/types';
import { TableColumn } from '/@/shared/types/types';

const MIN: Partial<Record<TableColumn, number>> = {
    [TableColumn.ACTIONS]: 24,
    [TableColumn.DURATION]: 52,
    [TableColumn.LAYOUT_FILL]: 0,
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

const fillFirst = (columns: ItemTableListColumnConfig[], order: number[]) => {
    const fill = order.find((j) => columns[j].id === TableColumn.LAYOUT_FILL);
    if (fill === undefined) return order;
    return [fill, ...order.filter((j) => j !== fill)];
};

// resize column i against its neighbors. last col pushes left instead of right.
// growth keeps the requested width (the table can scroll past the pane).
export const applyColumnResize = (
    columns: ItemTableListColumnConfig[],
    widths: number[],
    i: number,
    desired: number,
    containerWidth?: number,
): number[] => {
    if (!isResizable(columns[i])) return widths;

    const toRight: number[] = [];
    for (let j = i + 1; j < columns.length; j += 1) {
        if (isResizable(columns[j]) || columns[j]?.id === TableColumn.LAYOUT_FILL) {
            toRight.push(j);
        }
    }

    const toLeft: number[] = [];
    for (let j = i - 1; j >= 0; j -= 1) {
        if (isResizable(columns[j]) || columns[j]?.id === TableColumn.LAYOUT_FILL) {
            toLeft.push(j);
        }
    }

    const push = fillFirst(columns, toRight.length > 0 ? toRight : toLeft);
    if (push.length === 0) {
        const next = widths.slice();
        next[i] = Math.max(getColumnMinWidth(columns[i].id), Math.round(desired));
        return fitUnpinned(columns, next, i, containerWidth);
    }

    const delta = Math.round(desired) - widths[i];
    if (delta === 0) return widths;

    const next = widths.slice();
    const minI = getColumnMinWidth(columns[i].id);
    const sink = push[0];

    if (delta > 0) {
        steal(columns, next, push, delta);
        next[i] = Math.max(minI, Math.round(desired));
        return fitUnpinned(columns, next, i, containerWidth);
    }

    next[i] = Math.max(minI, Math.round(desired));
    next[sink] += widths[i] - next[i];
    return next;
};

const fitUnpinned = (
    columns: ItemTableListColumnConfig[],
    next: number[],
    i: number,
    containerWidth: number | undefined,
) => {
    if (!containerWidth || containerWidth <= 0 || (columns[i].pinned ?? null) !== null) {
        return next;
    }

    let total = 0;
    for (let j = 0; j < next.length; j += 1) {
        if ((columns[j].pinned ?? null) === null) total += next[j];
    }

    const overflow = Math.round(total - containerWidth);
    if (overflow > 0) {
        next[i] = Math.max(getColumnMinWidth(columns[i].id), next[i] - overflow);
    }
    return next;
};
