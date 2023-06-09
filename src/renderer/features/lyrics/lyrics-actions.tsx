import isElectron from 'is-electron';
import { RiAddFill, RiSubtractFill } from 'react-icons/ri';
import { LyricsOverride } from '/@/renderer/api/types';
import { Button, NumberInput, Tooltip } from '/@/renderer/components';
import { openLyricSearchModal } from '/@/renderer/features/lyrics/components/lyrics-search-form';
import {
  useCurrentSong,
  useLyricsSettings,
  useSettingsStore,
  useSettingsStoreActions,
} from '/@/renderer/store';

interface LyricsActionsProps {
  onRemoveLyric: () => void;
  onSearchOverride: (params: LyricsOverride) => void;
}

export const LyricsActions = ({ onRemoveLyric, onSearchOverride }: LyricsActionsProps) => {
  const currentSong = useCurrentSong();
  const { setSettings } = useSettingsStoreActions();
  const { delayMs } = useLyricsSettings();

  const handleLyricOffset = (e: number) => {
    setSettings({
      lyrics: {
        ...useSettingsStore.getState().lyrics,
        delayMs: e,
      },
    });
  };

  const isActionsDisabled = !currentSong;
  const isDesktop = isElectron();

  return (
    <>
      {isDesktop ? (
        <Button
          uppercase
          disabled={isActionsDisabled}
          variant="subtle"
          onClick={() =>
            openLyricSearchModal({
              artist: currentSong?.artistName,
              name: currentSong?.name,
              onSearchOverride,
            })
          }
        >
          Search
        </Button>
      ) : null}
      <Button
        aria-label="Decrease lyric offset"
        variant="subtle"
        onClick={() => handleLyricOffset(delayMs - 50)}
      >
        <RiSubtractFill />
      </Button>
      <Tooltip
        label="Offset (ms)"
        openDelay={500}
      >
        <NumberInput
          aria-label="Lyric offset"
          styles={{ input: { textAlign: 'center' } }}
          value={delayMs || 0}
          width={55}
          onChange={handleLyricOffset}
        />
      </Tooltip>
      <Button
        aria-label="Increase lyric offset"
        variant="subtle"
        onClick={() => handleLyricOffset(delayMs + 50)}
      >
        <RiAddFill />
      </Button>
      {isDesktop ? (
        <Button
          uppercase
          disabled={isActionsDisabled}
          variant="subtle"
          onClick={onRemoveLyric}
        >
          Clear
        </Button>
      ) : null}
    </>
  );
};
