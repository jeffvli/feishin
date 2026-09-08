import { createContext } from 'react';

import { WebAudio } from '/@/shared/types/types';

export const WebAudioContext = createContext<{
    setWebAudio?: (audio: undefined | WebAudio) => void;
    webAudio?: WebAudio;
}>({});
