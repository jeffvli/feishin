import { ActionSheet } from '/@/remote/components/action-sheet';
import { Play } from '/@/shared/types/types';

interface PlaySubmenuItemsProps {
    // Set while any of these items has an acked send in flight — every item
    // is disabled then, and pendingPlayType names which one shows a spinner
    // instead of its icon.
    disabled?: boolean;
    onSelect: (playType: Play) => void;
    pendingPlayType?: null | Play;
}

export const PlaySubmenuItems = ({
    disabled,
    onSelect,
    pendingPlayType,
}: PlaySubmenuItemsProps) => {
    return (
        <>
            <ActionSheet.Item
                disabled={disabled}
                leftIcon="mediaPlay"
                loading={pendingPlayType === Play.NOW}
                onClick={() => onSelect(Play.NOW)}
            >
                Play
            </ActionSheet.Item>
            <ActionSheet.Item
                disabled={disabled}
                leftIcon="mediaPlayNext"
                loading={pendingPlayType === Play.NEXT}
                onClick={() => onSelect(Play.NEXT)}
            >
                Next
            </ActionSheet.Item>
            <ActionSheet.Item
                disabled={disabled}
                leftIcon="mediaPlayLast"
                loading={pendingPlayType === Play.LAST}
                onClick={() => onSelect(Play.LAST)}
            >
                Last
            </ActionSheet.Item>
            <ActionSheet.Divider />
            <ActionSheet.Item
                disabled={disabled}
                leftIcon="mediaShuffle"
                loading={pendingPlayType === Play.SHUFFLE}
                onClick={() => onSelect(Play.SHUFFLE)}
            >
                Play (shuffled)
            </ActionSheet.Item>
            <ActionSheet.Item
                disabled={disabled}
                leftIcon="mediaPlayNext"
                loading={pendingPlayType === Play.NEXT_SHUFFLE}
                onClick={() => onSelect(Play.NEXT_SHUFFLE)}
            >
                Next (shuffled)
            </ActionSheet.Item>
            <ActionSheet.Item
                disabled={disabled}
                leftIcon="mediaPlayLast"
                loading={pendingPlayType === Play.LAST_SHUFFLE}
                onClick={() => onSelect(Play.LAST_SHUFFLE)}
            >
                Last (shuffled)
            </ActionSheet.Item>
        </>
    );
};
