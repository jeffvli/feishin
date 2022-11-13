import { useEffect, useState } from 'react';
import isElectron from 'is-electron';
import { FileInput, Text, Button } from '@/renderer/components';
import { localSettings } from '@/renderer/features/settings';

export const MpvRequired = () => {
  const [mpvPath, setMpvPath] = useState('');
  const handleSetMpvPath = (e: File) => {
    localSettings.set('mpv_path', e.path);
  };

  useEffect(() => {
    const getMpvPath = async () => {
      if (!isElectron()) return setMpvPath('');
      const mpvPath = await localSettings.get('mpv_path');
      return setMpvPath(mpvPath);
    };

    getMpvPath();
  }, []);

  return (
    <>
      <Text size="lg">
        Set your MPV executable location below and restart the application.
      </Text>
      <Text>
        MPV is available at the following:{' '}
        <a href="https://mpv.io/installation/" rel="noreferrer" target="_blank">
          https://mpv.io/
        </a>
      </Text>
      <FileInput placeholder={mpvPath} onChange={handleSetMpvPath} />
      <Button onClick={() => localSettings.restart()}>Restart</Button>
    </>
  );
};
