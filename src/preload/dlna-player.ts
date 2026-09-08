import { ipcRenderer, IpcRendererEvent } from 'electron';

export interface DlnaDevice {
    controlUrl: string;
    groupCoordinatorId?: string;
    groupMembers?: DlnaDevice[];
    id: string;
    isPair?: boolean;
    location: string;
    name: string;
    renderingControlUrl: string;
}

export interface GroupMember {
    device: DlnaDevice;
    isCoordinator: boolean;
    volume: number;
}

export interface TrackMetadata {
    albumArtUrl?: string;
    albumName?: string;
    artistName?: string;
    autoPlay?: boolean;
    duration?: number;
    mimeType?: string;
    title: string;
}

const discover = (): Promise<DlnaDevice[]> => ipcRenderer.invoke('dlna-discover');
const connect = (
    device: DlnaDevice,
): Promise<{
    currentDuration: number;
    currentPosition: number;
    currentTransportState: string;
    currentUri: string;
    nextUri: string;
    success: boolean;
    volume: number;
}> => ipcRenderer.invoke('dlna-connect', device);
const disconnect = (): Promise<boolean> => ipcRenderer.invoke('dlna-disconnect');
const disconnectPassive = (): Promise<boolean> => ipcRenderer.invoke('dlna-disconnect-passive');
const playUrl = (
    url: string,
    metadata: TrackMetadata,
    options?: { isMuted?: boolean; positionOffset?: number; seekTo?: number },
) => ipcRenderer.send('dlna-play-url', { metadata, url, ...options });
const setNextUrl = (url: string, metadata: TrackMetadata) =>
    ipcRenderer.send('dlna-set-next-url', { metadata, url });
const clearNextUrl = () => ipcRenderer.send('dlna-clear-next');
const play = () => ipcRenderer.send('dlna-play');
const pause = () => ipcRenderer.send('dlna-pause');
const stop = () => ipcRenderer.send('dlna-stop');
const seek = (seconds: number) => ipcRenderer.send('dlna-seek', seconds);
const volume = (value: number) => ipcRenderer.send('dlna-volume', value);
const mute = (muted: boolean) => ipcRenderer.send('dlna-mute', muted);
const getPosition = (): Promise<number> => ipcRenderer.invoke('dlna-get-position');
const setRadioMode = (enabled: boolean) => ipcRenderer.send('dlna-set-radio-mode', enabled);
const addGroupMember = (device: DlnaDevice): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('dlna-group-add-member', device);
const removeGroupMember = (deviceId: string): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('dlna-group-remove-member', deviceId);
const setGroupMemberVolume = (deviceId: string, vol: number) =>
    ipcRenderer.send('dlna-group-member-volume', { deviceId, volume: vol });
const setGroupMemberMute = (deviceId: string, muted: boolean) =>
    ipcRenderer.send('dlna-group-member-mute', { deviceId, muted });
const getGroupState = (): Promise<GroupMember[]> => ipcRenderer.invoke('dlna-group-get-state');
function singleOn<T extends (...args: any[]) => void>(channel: string, cb: T): void {
    ipcRenderer.removeAllListeners(channel);
    ipcRenderer.on(channel, cb);
}

const rendererCurrentTime = (cb: (event: IpcRendererEvent, time: number) => void) =>
    singleOn('renderer-dlna-current-time', cb);
const rendererDlnaTrackEnded = (
    cb: (event: IpcRendererEvent, payload?: { gapless?: boolean }) => void,
) => singleOn('renderer-dlna-track-ended', cb);
const rendererTrackEnded = rendererDlnaTrackEnded;
const rendererDlnaConnectPlayback = (
    cb: (
        event: IpcRendererEvent,
        info: {
            duration: number;
            nextUri: string;
            position: number;
            transportState: string;
            uri: string;
        },
    ) => void,
) => singleOn('renderer-dlna-connect-playback', cb);
const rendererDlnaTransportState = (cb: (event: IpcRendererEvent, state: string) => void) =>
    singleOn('renderer-dlna-transport-state', cb);
const rendererDlnaPrevTrack = (cb: (event: IpcRendererEvent) => void) =>
    singleOn('renderer-dlna-prev-track', cb);
const rendererDlnaVolume = (cb: (event: IpcRendererEvent, volume: number) => void) =>
    singleOn('renderer-dlna-volume', cb);
const rendererDlnaToast = (
    cb: (
        event: IpcRendererEvent,
        payload: { message: string; type: 'error' | 'info' | 'warning' },
    ) => void,
) => singleOn('renderer-dlna-toast', cb);
const rendererDlnaGroupState = (cb: (event: IpcRendererEvent, state: GroupMember[]) => void) =>
    singleOn('renderer-dlna-group-state', cb);
const rendererDlnaGroupMemberVolume = (
    cb: (event: IpcRendererEvent, payload: { deviceId: string; volume: number }) => void,
) => singleOn('renderer-dlna-group-member-volume', cb);
const rendererDlnaDiscoveryUpdate = (
    cb: (event: IpcRendererEvent, devices: DlnaDevice[]) => void,
) => singleOn('renderer-dlna-discovery-update', cb);
const prepareSpeedFile = (data: {
    offset: number;
    preservePitch: boolean;
    speed: number;
    url: string;
}) => ipcRenderer.invoke('dlna-prepare-speed-file', data);
const checkSpeedFile = (data: {
    preservePitch: boolean;
    speed: number;
    url: string;
}): Promise<null | string> => ipcRenderer.invoke('dlna-check-speed-file', data);
const cancelSpeedFile = (data: { preservePitch: boolean; speed: number; url: string }) =>
    ipcRenderer.send('dlna-cancel-speed-file', data);

const getSpeakerProperties = (deviceId: string): Promise<null | SpeakerProperties> =>
    ipcRenderer.invoke('dlna-get-speaker-properties', deviceId);
const createSpeedProxy = (data: {
    offset: number;
    preservePitch: boolean;
    speed: number;
    url: string;
}): Promise<null | string> => ipcRenderer.invoke('dlna-create-speed-proxy', data);
const destroySpeedProxy = () => ipcRenderer.send('dlna-destroy-speed-proxy');

const setSpeakerProperty = (
    deviceId: string,
    property: keyof SpeakerProperties,
    value: boolean | number,
) => ipcRenderer.send('dlna-set-speaker-property', { deviceId, property, value });

export const dlnaPlayer = {
    addGroupMember,
    cancelSpeedFile,
    checkSpeedFile,
    clearNextUrl,
    connect,
    createSpeedProxy,
    destroySpeedProxy,
    disconnect,
    disconnectPassive,
    discover,
    getGroupState,
    getPosition,
    getSpeakerProperties,
    mute,
    pause,
    play,
    playUrl,
    prepareSpeedFile,
    removeGroupMember,
    seek,
    setGroupMemberMute,
    setGroupMemberVolume,
    setNextUrl,
    setRadioMode,
    setSpeakerProperty,
    stop,
    volume,
};

export const dlnaPlayerListener = {
    rendererCurrentTime,
    rendererDlnaConnectPlayback,
    rendererDlnaDiscoveryUpdate,
    rendererDlnaGroupMemberVolume,
    rendererDlnaGroupState,
    rendererDlnaPrevTrack,
    rendererDlnaToast,
    rendererDlnaTrackEnded,
    rendererDlnaTransportState,
    rendererDlnaVolume,
    rendererTrackEnded,
};

export type DlnaPlayer = typeof dlnaPlayer;

export type DlnaPlayerListener = typeof dlnaPlayerListener;

export interface SpeakerProperties {
    bass: number;
    crossfade: boolean;
    ledState: boolean;
    loudness: boolean;
    touchControls: boolean;
    treble: number;
}
