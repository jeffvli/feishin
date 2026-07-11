import { ipcMain } from 'electron';

import log from 'electron-log/main';

import { discoverSonosDevices } from './sonos-discovery';
import type { DiscoveryResult, SessionInfo, SonosDevice, TrackMetadata } from './sonos-types';
import { SonosWebSocketApi } from './sonos-websocket';

let currentApi: SonosWebSocketApi | null = null;
let currentDevice: SonosDevice | null = null;
let currentGroupId: string | null = null;
let currentSession: SessionInfo | null = null;

export function registerSonosIpc(): void {
    log.info('[sonos] Registering IPC handlers...');

    ipcMain.handle('sonos:discover', async (): Promise<DiscoveryResult> => {
        log.info('[sonos] IPC: discover');
        return discoverSonosDevices();
    });

    ipcMain.handle(
        'sonos:connect',
        async (
            _event,
            deviceId: string,
            groupId?: string,
        ): Promise<boolean> => {
            log.info(`[sonos] IPC: connect device=${deviceId} group=${groupId}`);

            // Disconnect existing
            if (currentApi) {
                currentApi.disconnect();
                currentApi = null;
                currentDevice = null;
                currentGroupId = null;
                currentSession = null;
            }

            const { devices, groups } = await discoverSonosDevices();
            const device = devices.find((d) => d.id === deviceId);
            if (!device) {
                log.warn(`[sonos] Device not found: ${deviceId}`);
                return false;
            }

            const effectiveGroupId = groupId || groups.find((g) => g.playerIds.includes(deviceId))?.id;
            if (!effectiveGroupId) {
                log.warn(`[sonos] No group found for device: ${deviceId}`);
                return false;
            }

            const api = new SonosWebSocketApi(device.websocketUrl);
            const connected = await api.connect();
            if (!connected) {
                return false;
            }

            currentApi = api;
            currentDevice = device;
            currentGroupId = effectiveGroupId;

            // Auto-reconnect on connection drop
            api.setOnDisconnected(() => {
                log.info('[sonos] Connection lost, attempting reconnect...');
                let attempt = 0;
                const tryReconnect = async () => {
                    attempt++;
                    const delay = Math.min(5000 * Math.pow(2, attempt - 1), 60000); // Backoff: 5s, 10s, 20s, 40s, 60s...
                    log.info(`[sonos] Reconnect attempt ${attempt} in ${delay}ms`);
                    await new Promise((r) => setTimeout(r, delay));
                    if (!currentApi || currentApi.isConnected) return; // Already reconnected or disconnected
                    const connected = await currentApi.connect();
                    if (connected) {
                        log.info('[sonos] Reconnected successfully');
                    } else if (attempt < 10) {
                        tryReconnect();
                    }
                };
                tryReconnect();
            });

            log.info(`[sonos] Connected to ${device.name} (group: ${effectiveGroupId})`);
            return true;
        },
    );

    ipcMain.handle('sonos:disconnect', async (): Promise<void> => {
        log.info('[sonos] IPC: disconnect');

        if (currentSession) {
            try {
                await currentApi?.sendCommand(
                    'playback',
                    'pause',
                    currentGroupId!,
                );
            } catch {
                // ignore
            }
            try {
                await currentApi?.sendCommand(
                    'playbackSession',
                    'suspend',
                    currentSession.sessionId,
                );
            } catch {
                // ignore
            }
        }

        currentApi?.disconnect();
        currentApi = null;
        currentDevice = null;
        currentGroupId = null;
        currentSession = null;
    });

    ipcMain.handle('sonos:get-connection-status', async (): Promise<boolean> => {
        return currentApi?.isConnected ?? false;
    });

    ipcMain.handle(
        'sonos:load-track',
        async (
            _event,
            streamUrl: string,
            metadata?: TrackMetadata,
        ): Promise<void> => {
            if (!currentApi || !currentDevice || !currentGroupId) {
                throw new Error('Not connected to Sonos');
            }

            // Force MP3 transcoding for Sonos compatibility
            const url = streamUrl.includes('?')
                ? `${streamUrl}&format=mp3&maxBitRate=320`
                : `${streamUrl}?format=mp3&maxBitRate=320`;

            log.info(`[sonos] Loading track: ${url}`);

            // Suspend existing session if any
            if (currentSession) {
                try {
                    await currentApi.sendCommand(
                        'playbackSession',
                        'suspend',
                        currentSession.sessionId,
                    );
                } catch {
                    // ignore
                }
                currentSession = null;
            }

            // Create new session
            const sessionResponse = await currentApi.sendCommand(
                'playbackSession',
                'createSession',
                currentDevice.id,
                {
                    appContext: 'Feishin',
                    appId: 'com.jeffvli.feishin',
                    contextId: currentGroupId,
                },
                { groupId: currentGroupId },
            );

            const sessionId = extractSessionId(sessionResponse, currentDevice.id, currentGroupId);
            if (!sessionId) {
                throw new Error('Failed to create playback session');
            }

            currentSession = {
                groupId: currentGroupId,
                playerId: currentDevice.id,
                sessionId,
            };

            log.info(`[sonos] Created session: ${sessionId}`);

            // Load stream URL
            const stationMetadata: Record<string, any> = {};
            if (metadata?.title) {
                stationMetadata.title = metadata.title;
            }
            if (metadata?.artist) {
                stationMetadata.artist = metadata.artist;
            }
            if (metadata?.album) {
                stationMetadata.album = metadata.album;
            }
            if (metadata?.duration) {
                stationMetadata.durationMillis = metadata.duration * 1000;
            }

            await currentApi.sendCommand(
                'playbackSession',
                'loadStreamUrl',
                currentGroupId,
                {
                    playOnCompletion: true,
                    sessionId,
                    stationMetadata: Object.keys(stationMetadata).length > 0 ? stationMetadata : undefined,
                    streamUrl: url,
                },
                { sessionId },
            );

            log.info(`[sonos] Track loaded: ${sessionId}`);

            // Give Sonos a moment before sending play
            await new Promise((r) => setTimeout(r, 1000));

            await currentApi.sendCommand('playback', 'play', currentGroupId);

            log.info('[sonos] Track loaded and playing');
        },
    );

    ipcMain.handle('sonos:play', async (): Promise<void> => {
        if (!currentApi || !currentGroupId) {
            log.warn('[sonos] play ignored: not connected to Sonos');
            return;
        }
        await currentApi.sendCommand('playback', 'play', currentGroupId);
    });

    ipcMain.handle('sonos:pause', async (): Promise<void> => {
        if (!currentApi || !currentGroupId) {
            log.warn('[sonos] pause ignored: not connected to Sonos');
            return;
        }
        await currentApi.sendCommand('playback', 'pause', currentGroupId);
    });

    ipcMain.handle('sonos:stop', async (): Promise<void> => {
        if (!currentApi || !currentGroupId) {
            log.warn('[sonos] stop ignored: not connected to Sonos');
            return;
        }
        await currentApi.sendCommand('playback', 'pause', currentGroupId);
    });

    ipcMain.handle('sonos:seek', async (_event, positionMillis: number): Promise<void> => {
        if (!currentApi || !currentGroupId) {
            log.warn('[sonos] seek ignored: not connected to Sonos');
            return;
        }

        if (currentSession) {
            await currentApi.sendCommand(
                'playbackSession',
                'seek',
                currentSession.sessionId,
                { positionMillis },
            );
        } else {
            await currentApi.sendCommand('playback', 'seek', currentGroupId, {
                positionMillis,
            });
        }
    });

    ipcMain.handle('sonos:skip-next', async (): Promise<void> => {
        if (!currentApi || !currentGroupId) {
            log.warn('[sonos] skip-next ignored: not connected to Sonos');
            return;
        }
        await currentApi.sendCommand('playback', 'skipToNextTrack', currentGroupId);
    });

    ipcMain.handle('sonos:skip-prev', async (): Promise<void> => {
        if (!currentApi || !currentGroupId) {
            log.warn('[sonos] skip-prev ignored: not connected to Sonos');
            return;
        }
        await currentApi.sendCommand('playback', 'skipToPreviousTrack', currentGroupId);
    });

    ipcMain.handle('sonos:set-volume', async (_event, volume: number): Promise<void> => {
        if (!currentApi || !currentGroupId) {
            log.warn('[sonos] set-volume ignored: not connected to Sonos');
            return;
        }
        // Volume is 0-100
        const clamped = Math.max(0, Math.min(100, Math.round(volume)));
        await currentApi.sendCommand('groupVolume', 'setVolume', currentGroupId, {
            volume: clamped,
        });
    });

    ipcMain.handle('sonos:get-playback-status', async (): Promise<string> => {
        if (!currentApi || !currentGroupId) return 'IDLE';
        try {
            const result = await currentApi.sendCommand('playback', 'getPlaybackStatus', currentGroupId);
            const state = result?.playbackState || result?.state || result?.PlaybackState || 'IDLE';
            return state;
        } catch (e) {
            log.warn(`[sonos] getPlaybackStatus failed: ${(e as Error).message}`);
            return 'IDLE';
        }
    });

    ipcMain.handle('sonos:log', async (_event, msg: string): Promise<void> => {
        log.info(`[sonos:renderer] ${msg}`);
    });
    log.info('[sonos] All IPC handlers registered');
}

function extractSessionId(
    response: any,
    _playerId: string,
    _groupId: string,
): string | null {
    if (response && typeof response === 'object') {
        if (response.sessionId) {
            return response.sessionId as string;
        }
    }
    return null;
}
