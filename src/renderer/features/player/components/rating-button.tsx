import { useSetRating } from '/@/renderer/features/shared/hooks/use-set-rating';
import { useCurrentServer } from '/@/renderer/store/auth.store';
import { usePlayerSong } from '/@/renderer/store/player.store';
import { useHotkeySettings } from '/@/renderer/store/settings.store';
import { Rating } from '/@/shared/components/rating/rating';
import { useHotkeys } from '/@/shared/hooks/use-hotkeys';
import { LibraryItem, ServerType } from '/@/shared/types/domain-types';

export const RatingButton = () => {
    const server = useCurrentServer();
    const currentSong = usePlayerSong();
    const setRating = useSetRating();
    const { bindings } = useHotkeySettings();
    const isSongDefined = Boolean(currentSong?.id);
    const showRating =
        isSongDefined &&
        (server?.type === ServerType.NAVIDROME || server?.type === ServerType.SUBSONIC);
    const handleUpdateRating = (rating: number) => {
        if (!currentSong) return;
        setRating(currentSong._serverId, [currentSong.id], LibraryItem.SONG, rating);
    };
    useHotkeys([
        [bindings.rate0.isGlobal ? '' : bindings.rate0.hotkey, () => handleUpdateRating(0)],
        [bindings.rate1.isGlobal ? '' : bindings.rate1.hotkey, () => handleUpdateRating(1)],
        [bindings.rate2.isGlobal ? '' : bindings.rate2.hotkey, () => handleUpdateRating(2)],
        [bindings.rate3.isGlobal ? '' : bindings.rate3.hotkey, () => handleUpdateRating(3)],
        [bindings.rate4.isGlobal ? '' : bindings.rate4.hotkey, () => handleUpdateRating(4)],
        [bindings.rate5.isGlobal ? '' : bindings.rate5.hotkey, () => handleUpdateRating(5)],
    ]);
    return (
        <>
            {showRating && (
                <Rating
                    onChange={handleUpdateRating}
                    size="xs"
                    value={currentSong?.userRating || 0}
                />
            )}
        </>
    );
};
