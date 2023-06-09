import { RiAddFill, RiSubtractFill } from 'react-icons/ri';
import { LyricsOverride } from '/@/renderer/api/types';
import { Button, NumberInput } from '/@/renderer/components';
import { openLyricSearchModal } from '/@/renderer/features/lyrics/components/lyrics-search-form';
import { useCurrentSong } from '/@/renderer/store';

interface LyricsActionsProps {
  onSearchOverride?: (params: LyricsOverride) => void;
}

export const LyricsActions = ({ onSearchOverride }: LyricsActionsProps) => {
  const currentSong = useCurrentSong();

  return (
    <>
      <Button
        uppercase
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
      <Button
        tooltip={{ label: 'Decrease offset', openDelay: 500 }}
        variant="subtle"
      >
        <RiSubtractFill />
      </Button>
      <NumberInput
        styles={{ input: { textAlign: 'center' } }}
        width={55}
      />
      <Button
        tooltip={{ label: 'Increase offset', openDelay: 500 }}
        variant="subtle"
      >
        <RiAddFill />
      </Button>
      <Button
        uppercase
        variant="subtle"
        onClick={() =>
          openLyricSearchModal({
            artist: currentSong?.artistName,
            name: currentSong?.name,
          })
        }
      >
        Clear
      </Button>
    </>
  );
};
