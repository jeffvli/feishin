import { useMergedRef } from '@mantine/hooks';
import { useOverlayScrollbars } from 'overlayscrollbars-react';
import { type JSXElementConstructor, useCallback, useEffect, useRef } from 'react';
import { type CellComponentProps, Grid, type GridProps } from 'react-window-v2';

export function VirtualizedTable<CellProps extends object>(props: {
    cell: JSXElementConstructor<CellComponentProps<CellProps>>;
    cellProps: GridProps<CellProps>['cellProps'];
    columnCount: number;
    columnWidth: ((index: number, cellProps: CellProps) => number) | number;
    onCellsRendered: GridProps<CellProps>['onCellsRendered'];
    overscanCount: number;
    rowCount: number;
    rowHeight: ((index: number, cellProps: CellProps) => number) | number;
    stickyColumnCount: number;
    stickyRowCount: number;
}) {
    const rowCount = props.rowCount - (props.stickyRowCount ?? 0);
    const columnCount = props.columnCount - (props.stickyColumnCount ?? 0);
    const stickyRowRef = useRef<HTMLDivElement>(null);
    const rowRef = useRef<HTMLDivElement>(null);
    const stickyColumnRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const mergedRowRef = useMergedRef(rowRef, scrollContainerRef);

    const [initialize] = useOverlayScrollbars({
        defer: true,
        events: {
            initialized(osInstance) {
                const { viewport } = osInstance.elements();
                viewport.style.overflowX = `var(--os-viewport-overflow-x)`;
                viewport.style.overflowY = `var(--os-viewport-overflow-y)`;
            },
        },
        options: {
            overflow: { x: 'scroll', y: 'scroll' },
            paddingAbsolute: true,
            scrollbars: {
                autoHide: 'leave',
                autoHideDelay: 500,
                pointers: ['mouse', 'pen', 'touch'],
                theme: 'feishin-os-scrollbar',
                visibility: 'visible',
            },
        },
    });

    useEffect(() => {
        const { current: root } = scrollContainerRef;

        if (root) {
            initialize({
                elements: { viewport: root.firstElementChild as HTMLElement },
                target: root,
            });
        }

        return undefined;
    }, [initialize]);

    useEffect(() => {
        const header = stickyRowRef.current?.childNodes[0] as HTMLDivElement;
        const row = rowRef.current?.childNodes[0] as HTMLDivElement;
        const sticky = stickyColumnRef.current?.childNodes[0] as HTMLDivElement;

        if (header && row && sticky) {
            // Ensure all containers have the same height
            const syncHeights = () => {
                const rowHeight = row.scrollHeight;
                const stickyHeight = sticky.scrollHeight;

                // Set consistent heights - use the larger of the two
                const targetHeight = Math.max(rowHeight, stickyHeight);
                if (sticky.style.height !== `${targetHeight}px`) {
                    sticky.style.height = `${targetHeight}px`;
                }
                if (row.style.height !== `${targetHeight}px`) {
                    row.style.height = `${targetHeight}px`;
                }
            };

            const activeElement = { element: null } as { element: HTMLDivElement | null };
            const setActiveElement = (e: HTMLElementEventMap['pointermove']) => {
                activeElement.element = e.currentTarget as HTMLDivElement;
            };

            const syncScroll = (e: HTMLElementEventMap['scroll']) => {
                if (e.currentTarget !== activeElement.element) {
                    return;
                }

                const scrollTop = (e.currentTarget as HTMLDivElement).scrollTop;
                const scrollLeft = (e.currentTarget as HTMLDivElement).scrollLeft;

                // Prevent recursive scroll events
                const isScrolling = { header: false, row: false, sticky: false };

                // Sync horizontal scroll between header and main content
                if (e.currentTarget === header && !isScrolling.row) {
                    isScrolling.row = true;
                    row.scrollTo({
                        behavior: 'instant',
                        left: scrollLeft,
                    });
                    setTimeout(() => {
                        isScrolling.row = false;
                    }, 0);
                }

                if (e.currentTarget === row && !isScrolling.header && !isScrolling.sticky) {
                    isScrolling.header = true;
                    isScrolling.sticky = true;
                    header.scrollTo({
                        behavior: 'instant',
                        left: scrollLeft,
                    });
                    sticky.scrollTo({
                        behavior: 'instant',
                        top: scrollTop,
                    });
                    setTimeout(() => {
                        isScrolling.header = false;
                        isScrolling.sticky = false;
                    }, 0);
                }

                // Sync vertical scroll between sticky column and main content
                if (e.currentTarget === sticky && !isScrolling.row) {
                    isScrolling.row = true;
                    row.scrollTo({
                        behavior: 'instant',
                        top: scrollTop,
                    });
                    setTimeout(() => {
                        isScrolling.row = false;
                    }, 0);
                }
            };

            // Add event listeners
            header.addEventListener('pointermove', setActiveElement);
            row.addEventListener('pointermove', setActiveElement);
            sticky.addEventListener('pointermove', setActiveElement);
            header.addEventListener('scroll', syncScroll);
            row.addEventListener('scroll', syncScroll);
            sticky.addEventListener('scroll', syncScroll);

            // Add resize observer to maintain height sync
            const resizeObserver = new ResizeObserver(() => {
                syncHeights();
            });

            resizeObserver.observe(row);
            resizeObserver.observe(sticky);

            return () => {
                header.removeEventListener('pointermove', setActiveElement);
                row.removeEventListener('pointermove', setActiveElement);
                sticky.removeEventListener('pointermove', setActiveElement);
                header.removeEventListener('scroll', syncScroll);
                row.removeEventListener('scroll', syncScroll);
                sticky.removeEventListener('scroll', syncScroll);
                resizeObserver.disconnect();
            };
        }

        return undefined;
    }, []);

    const StickyRowCell = useCallback(
        (cellProps: CellComponentProps & CellProps) => {
            return (
                <props.cell
                    {...cellProps}
                    columnIndex={cellProps.columnIndex + (props.stickyColumnCount ?? 0)}
                />
            );
        },
        [props.cell, props.stickyColumnCount],
    );

    const StickyColumnCell = useCallback(
        (cellProps: CellComponentProps & CellProps) => {
            return (
                <props.cell
                    {...cellProps}
                    rowIndex={cellProps.rowIndex + (props.stickyRowCount ?? 0)}
                />
            );
        },
        [props.cell, props.stickyRowCount],
    );

    const RowCell = useCallback(
        (cellProps: CellComponentProps & CellProps) => {
            return (
                <props.cell
                    {...cellProps}
                    columnIndex={cellProps.columnIndex + (props.stickyColumnCount ?? 0)}
                    rowIndex={cellProps.rowIndex + (props.stickyRowCount ?? 0)}
                />
            );
        },
        [props.cell, props.stickyColumnCount, props.stickyRowCount],
    );

    const minHeight = 0;
    const minWidth = 0;

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'row',
                height: '100%',
                minHeight,
                minWidth,
                width: '100%',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flex: '0 1 auto',
                    flexDirection: 'column',
                    minHeight,
                    minWidth: `${Array.from(
                        { length: props.stickyColumnCount ?? 0 },
                        () => 0,
                    ).reduce(
                        (a, _, i) =>
                            a +
                            (typeof props.columnWidth === 'number'
                                ? props.columnWidth
                                : props.columnWidth(i, props.cellProps)),
                        0,
                    )}px`,
                }}
            >
                {(props.stickyColumnCount || props.stickyRowCount) && (
                    <div
                        style={{
                            flex: '0 1 auto',
                            minHeight: `${Array.from(
                                { length: props.stickyRowCount ?? 0 },
                                () => 0,
                            ).reduce(
                                (a, _, i) =>
                                    a +
                                    (typeof props.rowHeight === 'number'
                                        ? props.rowHeight
                                        : props.rowHeight(i, props.cellProps)),
                                0,
                            )}px`,
                            minWidth,
                        }}
                    >
                        <Grid
                            cellComponent={props.cell as any}
                            cellProps={props.cellProps}
                            columnCount={props.stickyColumnCount}
                            columnWidth={props.columnWidth}
                            overscanCount={props.overscanCount}
                            rowCount={props.stickyRowCount}
                            rowHeight={props.rowHeight}
                            style={{
                                scrollbarWidth: 'none',
                            }}
                        />
                    </div>
                )}
                {props.stickyColumnCount && (
                    <div
                        ref={stickyColumnRef}
                        style={{
                            flex: '1 1 auto',
                            height: '100%',
                            minHeight,
                            minWidth,
                        }}
                    >
                        <Grid
                            cellComponent={StickyColumnCell}
                            cellProps={props.cellProps}
                            columnCount={props.stickyColumnCount}
                            columnWidth={props.columnWidth}
                            overscanCount={props.overscanCount}
                            rowCount={rowCount}
                            rowHeight={(index, cellProps) => {
                                return typeof props.rowHeight === 'number'
                                    ? props.rowHeight
                                    : props.rowHeight(
                                          index + (props.stickyRowCount ?? 0),
                                          cellProps,
                                      );
                            }}
                            style={{
                                height: '100%',
                                scrollbarWidth: 'none',
                            }}
                        />
                    </div>
                )}
            </div>
            <div
                style={{
                    display: 'flex',
                    flex: '1 1 auto',
                    flexDirection: 'column',
                    minHeight,
                    minWidth,
                }}
            >
                {props.stickyRowCount && (
                    <div
                        ref={stickyRowRef}
                        style={{
                            flex: '0 1 auto',
                            minHeight: `${Array.from(
                                { length: props.stickyRowCount ?? 0 },
                                () => 0,
                            ).reduce(
                                (a, _, i) =>
                                    a +
                                    (typeof props.rowHeight === 'number'
                                        ? props.rowHeight
                                        : props.rowHeight(i, props.cellProps)),
                                0,
                            )}px`,
                            minWidth,
                        }}
                    >
                        <Grid
                            cellComponent={StickyRowCell}
                            cellProps={props.cellProps}
                            columnCount={columnCount}
                            columnWidth={(index, cellProps) => {
                                return typeof props.columnWidth === 'number'
                                    ? props.columnWidth
                                    : props.columnWidth(
                                          index + (props.stickyColumnCount ?? 0),
                                          cellProps,
                                      );
                            }}
                            overscanCount={props.overscanCount}
                            rowCount={
                                Array.from({ length: props.stickyRowCount ?? 0 }, () => 0).length
                            }
                            rowHeight={(index, cellProps) => {
                                return typeof props.rowHeight === 'number'
                                    ? props.rowHeight
                                    : props.rowHeight(index, cellProps);
                            }}
                            style={{
                                scrollbarWidth: 'none',
                            }}
                        />
                    </div>
                )}
                <div
                    ref={mergedRowRef}
                    style={{ flex: '1 1 auto', height: '100%', minHeight, minWidth }}
                >
                    <Grid
                        cellComponent={RowCell}
                        cellProps={props.cellProps}
                        columnCount={columnCount}
                        columnWidth={(index, cellProps) => {
                            return typeof props.columnWidth === 'number'
                                ? props.columnWidth
                                : props.columnWidth(
                                      index + (props.stickyColumnCount ?? 0),
                                      cellProps,
                                  );
                        }}
                        onCellsRendered={
                            props.onCellsRendered
                                ? ({
                                      columnStartIndex,
                                      columnStopIndex,
                                      rowStartIndex,
                                      rowStopIndex,
                                  }) => {
                                      return props.onCellsRendered!({
                                          columnStartIndex:
                                              columnStartIndex + (props.stickyColumnCount ?? 0),
                                          columnStopIndex:
                                              columnStopIndex + (props.stickyColumnCount ?? 0),
                                          rowStartIndex:
                                              rowStartIndex + (props.stickyRowCount ?? 0),
                                          rowStopIndex: rowStopIndex + (props.stickyRowCount ?? 0),
                                      });
                                  }
                                : undefined
                        }
                        overscanCount={props.overscanCount}
                        rowCount={rowCount}
                        rowHeight={(index, cellProps) => {
                            return typeof props.rowHeight === 'number'
                                ? props.rowHeight
                                : props.rowHeight(index + (props.stickyRowCount ?? 0), cellProps);
                        }}
                        style={{
                            height: '100%',
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
