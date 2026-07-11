export const SONOS_CONSTANTS = {
    API_TOKEN: '123e4567-e89b-12d3-a456-426655440000',
    API_VERSION: 1,
    DISCOVERY_PORT: 1443,
    WEBSOCKET_PROTOCOL: 'v1.api.smartspeaker.audio',
    WEBSOCKET_API_PATH: '/websocket/api',
    SONOS_SERVICE_TYPE: '_sonos._tcp',
    DISCOVERY_TIMEOUT_MS: 5000,
    HTTP_TIMEOUT_MS: 500,
    WEBSOCKET_TIMEOUT_MS: 5000,
} as const;

export function getDiscoveryUrl(ip: string): string {
    return `https://${ip}:${SONOS_CONSTANTS.DISCOVERY_PORT}/api/v1/players/local/info`;
}

export function getGroupsUrl(ip: string, householdId: string): string {
    return `https://${ip}:${SONOS_CONSTANTS.DISCOVERY_PORT}/api/v1/households/${householdId}/groups`;
}

export function getWebSocketUrl(ip: string): string {
    return `wss://${ip}:${SONOS_CONSTANTS.DISCOVERY_PORT}${SONOS_CONSTANTS.WEBSOCKET_API_PATH}`;
}
