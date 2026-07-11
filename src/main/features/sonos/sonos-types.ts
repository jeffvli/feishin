import { SonosGroup, SonosPlayerData } from '/@/shared/types/sonos-types';

export type {
    DiscoveryResult,
    SonosDevice,
    SonosGroup,
    SonosPlayerData,
    TrackMetadata,
} from '/@/shared/types/sonos-types';

export interface SonosDiscoveryInfo {
    playerId: string;
    householdId: string;
    websocketUrl: string;
    apiVersion?: string;
}

export interface SonosGroupsResponse {
    groups: SonosGroup[];
    players: SonosPlayerData[];
}

export interface SessionInfo {
    sessionId: string;
    sessionState?: string;
    playerId: string;
    groupId: string;
}
