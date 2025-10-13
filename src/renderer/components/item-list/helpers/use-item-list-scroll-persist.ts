import { parseAsInteger, useQueryState } from 'nuqs';

interface UseItemListScrollPersistProps {
    enabled: boolean;
}

export const useItemListScrollPersist = ({ enabled }: UseItemListScrollPersistProps) => {
    const [scrollOffset, setScrollOffset] = useQueryState('scrollOffset', parseAsInteger);

    const handleOnScrollEnd = (offset: number) => {
        if (!enabled) return;

        setScrollOffset(offset);
    };

    return { handleOnScrollEnd, scrollOffset };
};
