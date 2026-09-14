import { ActionSheet } from '/@/remote/components/action-sheet';
import { PlaySubmenuItems } from '/@/remote/components/menus/play-submenu-items';
import { useAckedAction } from '/@/remote/hooks/use-acked-action';
import { useConfirmedSend } from '/@/remote/hooks/use-confirmed-send';
import { useQueueReplaceConfirm } from '/@/remote/store/library';
import { Play } from '/@/shared/types/types';

interface AlbumActionSheetProps {
    album: null | { id: string };
    onClose: () => void;
}

export const AlbumActionSheet = ({ album, onClose }: AlbumActionSheetProps) => {
    const confirmedSend = useConfirmedSend();
    const { pendingKey, run } = useAckedAction();
    // A play-type here can trigger the "discard the queue?" confirm sheet
    // (shell.tsx) — step aside while it's up instead of stacking two sheets.
    const queueReplaceConfirmPending = !!useQueueReplaceConfirm();

    return (
        <ActionSheet onClose={onClose} opened={!!album && !queueReplaceConfirmPending}>
            {album && (
                <PlaySubmenuItems
                    disabled={pendingKey !== null}
                    onSelect={(playType) =>
                        run(
                            playType,
                            confirmedSend({ event: 'play-album', id: album.id, playType }),
                            onClose,
                        )
                    }
                    pendingPlayType={pendingKey as null | Play}
                />
            )}
        </ActionSheet>
    );
};
