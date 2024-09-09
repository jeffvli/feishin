import { createContext } from 'react';
import { WebAudio } from '/@/renderer/types';

export const WebAudioContext = createContext<{
    setWebAudio?: (audio: WebAudio) => void;
    webAudio?: WebAudio;
}>({});
