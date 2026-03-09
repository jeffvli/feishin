import type { Variants } from 'motion/react';
import type { ReactNode } from 'react';

import { AnimatePresence, motion } from 'motion/react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import styles from './grid-carousel.module.css';

import { DataRow, MemoizedItemCard } from '/@/renderer/components/item-card/item-card';
import { useContainerQuery } from '/@/renderer/hooks';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Group } from '/@/shared/components/group/group';
import { TextTitle } from '/@/shared/components/text-title/text-title';
import { LibraryItem } from '/@/shared/types/domain-types';

export const useGridCarouselContainerQuery = () => {
    return useContainerQuery({
        '2xl': 1280,
        '3xl': 1440,
        lg: 960,
        md: 720,
        sm: 520,
        xl: 1152,
        xs: 360,
    });
};

interface Card {
    content: ReactNode;
    id: string;
}

interface GridCarouselProps {
    cards: Card[];
    containerQuery?: ReturnType<typeof useGridCarouselContainerQuery>;
    enableRefresh?: boolean;
    hasNextPage?: boolean;
    isFetchingNextPage?: boolean;
    loadNextPage?: () => void;
    onNextPage: (page: number) => void;
    onPrevPage: (page: number) => void;
    onRefresh?: () => void;
    placeholderItemType?: LibraryItem;
    placeholderRows?: DataRow[];
    rowCount?: number;
    title?: ReactNode | string;
}

const MemoizedCard = memo(({ content }: { content: ReactNode }) => (
    <div className={styles.card}>{content}</div>
));

MemoizedCard.displayName = 'MemoizedCard';

const pageVariants: Variants = {
    animate: { opacity: 1, transition: { duration: 0.3, ease: 'easeOut' }, x: 0 },
    exit: (custom: { isNext: boolean }) => ({
        opacity: 0,
        transition: { duration: 0.3, ease: 'easeIn' },
        x: custom.isNext ? -100 : 100,
    }),
    initial: (custom: { isNext: boolean }) => ({ opacity: 0, x: custom.isNext ? 100 : -100 }),
};

function BaseGridCarousel(props: GridCarouselProps) {
    const {
        cards,
        containerQuery: providedContainerQuery,
        enableRefresh = false,
        hasNextPage,
        isFetchingNextPage,
        loadNextPage,
        onNextPage,
        onPrevPage,
        onRefresh,
        placeholderItemType,
        placeholderRows,
        rowCount = 1,
        title,
    } = props;
    const defaultContainerQuery = useGridCarouselContainerQuery();
    const containerQuery = providedContainerQuery || defaultContainerQuery;
    const { ref, ...cq } = containerQuery;

    const [currentPage, setCurrentPage] = useState({
        isNext: false,
        page: 0,
    });

    const handlePrevPage = useCallback(() => {
        setCurrentPage((prev) => ({
            isNext: false,
            page: prev.page > 0 ? prev.page - 1 : 0,
        }));
        onPrevPage(currentPage.page);
    }, [currentPage, onPrevPage]);

    const handleNextPage = useCallback(() => {
        setCurrentPage((prev) => ({
            isNext: true,
            page: prev.page + 1,
        }));
        onNextPage(currentPage.page);
    }, [currentPage, onNextPage]);

    const cardsToShow = getCardsToShow({
        isLargerThan2xl: cq.is2xl,
        isLargerThan3xl: cq.is3xl,
        isLargerThanLg: cq.isLg,
        isLargerThanMd: cq.isMd,
        isLargerThanSm: cq.isSm,
        isLargerThanXl: cq.isXl,
    });

    const visibleCards = useMemo(() => {
        const startIndex = currentPage.page * cardsToShow * rowCount;
        const endIndex = (currentPage.page + 1) * cardsToShow * rowCount;
        const slicedCards = cards.slice(startIndex, endIndex);
        const expectedCardCount = cardsToShow * rowCount;
        const missingCardCount = expectedCardCount - slicedCards.length;

        // Add placeholder cards during loading state
        if (
            missingCardCount > 0 &&
            hasNextPage &&
            isFetchingNextPage &&
            placeholderItemType &&
            placeholderRows
        ) {
            const placeholderCards: Card[] = Array.from(
                { length: missingCardCount },
                (_, index) => ({
                    content: (
                        <MemoizedItemCard
                            data={undefined}
                            itemType={placeholderItemType}
                            rows={placeholderRows}
                            type="poster"
                        />
                    ),
                    id: `placeholder-${startIndex + slicedCards.length + index}`,
                }),
            );
            return [...slicedCards, ...placeholderCards];
        }

        return slicedCards;
    }, [
        currentPage.page,
        cardsToShow,
        rowCount,
        cards,
        hasNextPage,
        isFetchingNextPage,
        placeholderItemType,
        placeholderRows,
    ]);

    const shouldLoadNextPage = visibleCards.length < cardsToShow * rowCount;

    useEffect(() => {
        if (shouldLoadNextPage) {
            loadNextPage?.();
        }
    }, [loadNextPage, shouldLoadNextPage]);

    const isPrevDisabled = currentPage.page === 0;
    const hasMoreCards = (currentPage.page + 1) * cardsToShow * rowCount < cards.length;
    const isNextDisabled = !hasMoreCards && (hasNextPage === false || hasNextPage === undefined);

    const wheelCooldownRef = useRef(0);
    const wheelThreshold = 10;
    const wheelCooldownMs = 250;

    const handleWheel = useCallback(
        (event: React.WheelEvent<HTMLDivElement>) => {
            if (!event.shiftKey) {
                return;
            }

            const now = Date.now();
            const elapsed = now - wheelCooldownRef.current;

            const horizontalDelta = Math.abs(event.deltaY);

            if (horizontalDelta < wheelThreshold || elapsed < wheelCooldownMs) {
                return;
            }

            if (event.deltaY > 0 && !isNextDisabled) {
                wheelCooldownRef.current = now;
                handleNextPage();
            } else if (event.deltaY < 0 && !isPrevDisabled) {
                wheelCooldownRef.current = now;
                handlePrevPage();
            }
        },
        [
            handleNextPage,
            handlePrevPage,
            isNextDisabled,
            isPrevDisabled,
            wheelCooldownMs,
            wheelThreshold,
        ],
    );

    const swipeCooldownRef = useRef(0);
    const dragStartTargetRef = useRef<HTMLElement | null>(null);
    const swipeCooldownMs = 300;
    const swipeThreshold = 50;
    const swipeVelocityThreshold = 500;

    const handleDragStart = useCallback((event: MouseEvent | PointerEvent | TouchEvent) => {
        dragStartTargetRef.current = (event.target as HTMLElement) || null;
    }, []);

    const handleDragEnd = useCallback(
        (
            _event: MouseEvent | PointerEvent | TouchEvent,
            info: { offset: { x: number }; velocity: { x: number } },
        ) => {
            const startTarget = dragStartTargetRef.current;
            if (startTarget) {
                if (startTarget.closest('button, a, input, select, textarea, [role="button"]')) {
                    dragStartTargetRef.current = null;
                    return;
                }
            }

            const now = Date.now();
            const elapsed = now - swipeCooldownRef.current;

            if (elapsed < swipeCooldownMs) {
                dragStartTargetRef.current = null;
                return;
            }

            const { offset, velocity } = info;
            const absOffset = Math.abs(offset.x);
            const absVelocity = Math.abs(velocity.x);

            if (absOffset > swipeThreshold || absVelocity > swipeVelocityThreshold) {
                swipeCooldownRef.current = now;

                if (offset.x > 0 && !isPrevDisabled) {
                    handlePrevPage();
                } else if (offset.x < 0 && !isNextDisabled) {
                    handleNextPage();
                }
            }

            dragStartTargetRef.current = null;
        },
        [handleNextPage, handlePrevPage, isNextDisabled, isPrevDisabled],
    );

    return (
        <div className={styles.gridCarousel} ref={ref}>
            {cq.isCalculated && (
                <>
                    <motion.div
                        className={styles.navigation}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0}
                        dragMomentum={false}
                        dragPropagation={false}
                        onDragEnd={handleDragEnd}
                        onDragStart={handleDragStart}
                    >
                        {typeof title === 'string' ? (
                            <Group gap="xs" justify="space-between" w="100%">
                                <Group gap="xs">
                                    <TextTitle fw={700} isNoSelect order={3}>
                                        {title}
                                    </TextTitle>
                                    {enableRefresh && onRefresh && (
                                        <ActionIcon
                                            icon="refresh"
                                            iconProps={{ size: 'xs' }}
                                            onClick={onRefresh}
                                            size="xs"
                                            tooltip={{ label: 'Refresh' }}
                                            variant="transparent"
                                        />
                                    )}
                                </Group>
                                <Group gap="xs" justify="end">
                                    <ActionIcon
                                        disabled={isPrevDisabled}
                                        icon="arrowLeftS"
                                        iconProps={{ size: 'lg' }}
                                        onClick={handlePrevPage}
                                        size="xs"
                                        variant="subtle"
                                    />
                                    <ActionIcon
                                        disabled={isNextDisabled}
                                        icon="arrowRightS"
                                        iconProps={{ size: 'lg' }}
                                        onClick={handleNextPage}
                                        size="xs"
                                        variant="subtle"
                                    />
                                </Group>
                            </Group>
                        ) : (
                            <div className={styles.customTitleContainer}>
                                <div className={styles.customTitleContent}>{title}</div>
                                <Group gap="xs" justify="end">
                                    <ActionIcon
                                        disabled={isPrevDisabled}
                                        icon="arrowLeftS"
                                        iconProps={{ size: 'lg' }}
                                        onClick={handlePrevPage}
                                        size="xs"
                                        variant="subtle"
                                    />
                                    <ActionIcon
                                        disabled={isNextDisabled}
                                        icon="arrowRightS"
                                        iconProps={{ size: 'lg' }}
                                        onClick={handleNextPage}
                                        size="xs"
                                        variant="subtle"
                                    />
                                </Group>
                            </div>
                        )}
                    </motion.div>
                    <AnimatePresence custom={currentPage} initial={false} mode="wait">
                        <motion.div
                            animate="animate"
                            className={styles.grid}
                            custom={currentPage}
                            exit="exit"
                            initial="initial"
                            key={currentPage.page}
                            onWheel={handleWheel}
                            style={
                                {
                                    '--cards-to-show': cardsToShow,
                                    '--row-count': rowCount,
                                } as React.CSSProperties
                            }
                            variants={pageVariants}
                        >
                            {visibleCards.map((card) => (
                                <MemoizedCard content={card.content} key={card.id} />
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </>
            )}
        </div>
    );
}

export const GridCarousel = memo(BaseGridCarousel);

GridCarousel.displayName = 'GridCarousel';

interface GridCarouselSkeletonProps {
    containerQuery?: ReturnType<typeof useGridCarouselContainerQuery>;
    enableRefresh?: boolean;
    placeholderItemType: LibraryItem;
    placeholderRound?: boolean;
    placeholderRows: DataRow[];
    rowCount?: number;
    title?: ReactNode | string;
}

const GridCarouselSkeleton = (props: GridCarouselSkeletonProps) => {
    const {
        containerQuery: providedContainerQuery,
        enableRefresh = false,
        placeholderItemType,
        placeholderRound = false,
        placeholderRows,
        rowCount = 1,
        title,
    } = props;

    const defaultContainerQuery = useGridCarouselContainerQuery();
    const containerQuery = providedContainerQuery ?? defaultContainerQuery;
    const { ...cq } = containerQuery;

    const cardsToShow = cq.isCalculated
        ? getCardsToShow({
              isLargerThan2xl: cq.is2xl,
              isLargerThan3xl: cq.is3xl,
              isLargerThanLg: cq.isLg,
              isLargerThanMd: cq.isMd,
              isLargerThanSm: cq.isSm,
              isLargerThanXl: cq.isXl,
          })
        : 6;

    const placeholderCards = useMemo(() => {
        const cardCount = cardsToShow * rowCount;
        return Array.from({ length: cardCount }, (_, index) => ({
            content: (
                <MemoizedItemCard
                    data={undefined}
                    isRound={placeholderRound}
                    itemType={placeholderItemType}
                    rows={placeholderRows}
                    type="poster"
                />
            ),
            id: `skeleton-${index}`,
        }));
    }, [cardsToShow, placeholderRound, rowCount, placeholderItemType, placeholderRows]);

    return (
        <GridCarousel
            cards={placeholderCards}
            containerQuery={containerQuery}
            enableRefresh={enableRefresh}
            hasNextPage={false}
            isFetchingNextPage={false}
            onNextPage={() => {}}
            onPrevPage={() => {}}
            placeholderItemType={placeholderItemType}
            placeholderRows={placeholderRows}
            rowCount={rowCount}
            title={title}
        />
    );
};

export const GridCarouselSkeletonFallback = memo(GridCarouselSkeleton);

GridCarouselSkeletonFallback.displayName = 'GridCarouselSkeletonFallback';

function getCardsToShow(breakpoints: {
    isLargerThan2xl: boolean;
    isLargerThan3xl: boolean;
    isLargerThanLg: boolean;
    isLargerThanMd: boolean;
    isLargerThanSm: boolean;
    isLargerThanXl: boolean;
}) {
    if (breakpoints.isLargerThan3xl) {
        return 8;
    }

    if (breakpoints.isLargerThan2xl) {
        return 7;
    }

    if (breakpoints.isLargerThanXl) {
        return 6;
    }

    if (breakpoints.isLargerThanLg) {
        return 5;
    }

    if (breakpoints.isLargerThanMd) {
        return 4;
    }

    if (breakpoints.isLargerThanSm) {
        return 3;
    }

    return 2;
}
