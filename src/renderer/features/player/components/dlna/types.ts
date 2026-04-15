export interface DlnaDevice {
    controlUrl: string;
    groupCoordinatorId?: string;
    groupMembers?: DlnaDevice[];
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
