export const formatRefreshTokenKey = (sub: string, iss: string, clientId: string): string => {
    // For JSON storage
    return `refresh_token_${sub}-${iss}-${clientId}`;
};
