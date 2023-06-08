import { RiAddFill, RiSubtractFill } from 'react-icons/ri';
import { Button, NumberInput } from '/@/renderer/components';
import { openLyricSearchModal } from '/@/renderer/features/lyrics/components/lyrics-search-form';
import { useCurrentSong } from '/@/renderer/store';

export const LyricsActions = () => {
  const currentSong = useCurrentSong();

  return (
    <>
      <Button
        variant="default"
        onClick={() =>
          openLyricSearchModal({
            artist: currentSong?.artistName,
            name: currentSong?.name,
          })
        }
      >
        Search
      </Button>
      <Button
        tooltip={{ label: 'Decrease offset', openDelay: 500 }}
        variant="default"
      >
        <RiSubtractFill />
      </Button>
      <NumberInput
        styles={{ input: { textAlign: 'center' } }}
        width={55}
      />
      <Button
        tooltip={{ label: 'Increase offset', openDelay: 500 }}
        variant="default"
      >
        <RiAddFill />
      </Button>
      <Button
        variant="default"
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
