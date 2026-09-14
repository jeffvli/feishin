import { ActionSheet } from '/@/remote/components/action-sheet';
import { PlaySubmenuItems } from '/@/remote/components/menus/play-submenu-items';
import { useAckedAction } from '/@/remote/hooks/use-acked-action';
import { useConfirmedSend } from '/@/remote/hooks/use-confirmed-send';
import { useQueueReplaceConfirm } from '/@/remote/store/library';
import { Play } from '/@/shared/types/types';

interface PlaylistActionSheetProps {
    onClose: () => void;
    playlist: null | { id: string };
}

export const PlaylistActionSheet = ({ onClose, playlist }: PlaylistActionSheetProps) => {
    const confirmedSend = useConfirmedSend();
    const { pendingKey, run } = useAckedAction();
    // A play-type here can trigger the "discard the queue?" confirm sheet
    // (shell.tsx) — step aside while it's up instead of stacking two sheets.
    const queueReplaceConfirmPending = !!useQueueReplaceConfirm();

    return (
        <ActionSheet onClose={onClose} opened={!!playlist && !queueReplaceConfirmPending}>
            {playlist && (
                <PlaySubmenuItems
                    disabled={pendingKey !== null}
                    onSelect={(playType) =>
                        run(
                            playType,
                            confirmedSend({ event: 'play-playlist', id: playlist.id, playType }),
                            onClose,
                        )
                    }
                    pendingPlayType={pendingKey as null | Play}
                />
            )}
        </ActionSheet>
    );
};
