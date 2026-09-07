import { ActionSheet } from '/@/remote/components/action-sheet';
import { Play } from '/@/shared/types/types';

interface TrackRadioSubmenuItemsProps {
    disabled?: boolean;
    onSelect: (playType: Play) => void;
    pendingPlayType?: null | Play;
}

export const TrackRadioSubmenuItems = ({
    disabled,
    onSelect,
    pendingPlayType,
}: TrackRadioSubmenuItemsProps) => {
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
        </>
    );
};
