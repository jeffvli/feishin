export interface UserResponse {
    beets_port: number;
    filebrowser_port: number;
    password: string;
    subsonic_port: number;
    username: string;
}

export interface PyMixUserResponse {
    reason: string;
    success: boolean;
    user: UserResponse;
}
