export interface SonosDevice {
    id: string;
    householdId: string;
    name: string;
    ipAddress: string;
    model: string;
    modelNumber: string;
    serialNumber: string;
    softwareVersion: string;
    hardwareVersion: string;
    websocketUrl: string;
}

export interface SonosGroup {
    id: string;
    name: string;
    householdId: string;
    coordinatorId: string;
    playerIds: string[];
    areaIds: string[];
    playbackState?: string;
}

export interface SonosPlayerData {
    id: string;
    name: string;
    householdId: string;
    roomName?: string;
    icon?: string;
    model?: string;
    modelNumber?: string;
    serialNumber?: string;
    softwareVersion?: string;
    hardwareVersion?: string;
}

export interface TrackMetadata {
    title?: string;
    artist?: string;
    album?: string;
    duration?: number;
}

export interface DiscoveryResult {
    devices: SonosDevice[];
    error?: string | null;
    groups: SonosGroup[];
}
