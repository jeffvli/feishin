export interface DlnaDevice {
    controlUrl: string;
    id: string;
    location: string;
    name: string;
    renderingControlUrl: string;
}

export interface GroupMember {
    device: DlnaDevice;
    isCoordinator: boolean;
    volume: number;
}

export interface SpeakerProperties {
    bass: number;
    crossfade: boolean;
    ledState: boolean;
    loudness: boolean;
    touchControls: boolean;
    treble: number;
}
export interface TrackMetadata {
    albumArtUrl?: string;
    albumName?: string;
    artistName?: string;
    duration?: number;
    mimeType?: string;
    title: string;
}
