import { ipcMain } from 'electron';
import os from 'os';

import { getMainWindow } from '../../../index';
import { createLog } from '../../../utils';
import {
    DlnaDevice,
    getPositionInfo,
    getTransportInfo,
    getVolume,
    pause,
    play,
    seek,
    setAVTransportURI,
    setMute,
    setNextAVTransportURI,
    setVolume,
    stop,
    TrackMetadata,
} from './soap-client';
import { discoverDevices } from './ssdp-discovery';

let connectedDevice: DlnaDevice | null = null;
let positionPollingInterval: NodeJS.Timeout | null = null;
let lastKnownPosition = 0;
let hasStartedPlaying = false;
let trackLoadedAt = 0;

function getLanIp(): null | string {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name] || []) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return null;
}

function rewriteUrlForLan(url: string): string {
    const lanIp = getLanIp();
    if (!lanIp) return url;

    // Replace localhost, 127.0.0.1, [::1], or [::] with LAN IP
    return url
        .replace(/http:\/\/localhost(:\d+)/, `http://${lanIp}$1`)
        .replace(/http:\/\/127\.0\.0\.1(:\d+)/, `http://${lanIp}$1`)
        .replace(/http:\/\/\[::1\](:\d+)/, `http://${lanIp}$1`)
        .replace(/http:\/\/\[::\](:\d+)/, `http://${lanIp}$1`);
}

const dlnaLog = (action: string, err?: unknown) => {
    const message = `[DLNA] ${action}`;
    createLog({ message, type: err ? 'error' : 'info' });
    if (err) {
        console.error(message, err);
    }
};

function startPositionPolling() {
    stopPositionPolling();

    positionPollingInterval = setInterval(async () => {
        if (!connectedDevice) return;

        // Don't poll during the first few seconds after loading a track
        const timeSinceLoad = Date.now() - trackLoadedAt;
        if (timeSinceLoad < 2000) return;

        try {
            const [posInfo, transportInfo] = await Promise.all([
                getPositionInfo(connectedDevice),
                getTransportInfo(connectedDevice),
            ]);

            getMainWindow()?.webContents.send('renderer-dlna-current-time', posInfo.position);

            // Track that playback has started
            if (transportInfo.state === 'PLAYING' || transportInfo.state === 'TRANSITIONING') {
                hasStartedPlaying = true;
            }

            // Detect gapless transition: position jumped backward significantly
            if (
                hasStartedPlaying &&
                lastKnownPosition > 5 &&
                posInfo.position < lastKnownPosition - 3
            ) {
                dlnaLog(
                    `Gapless transition detected: ${lastKnownPosition}s -> ${posInfo.position}s`,
                );
                hasStartedPlaying = true; // Already playing the next track
                trackLoadedAt = Date.now(); // Reset grace period
                getMainWindow()?.webContents.send('renderer-dlna-track-ended');
            }

            lastKnownPosition = posInfo.position;

            // Detect track ended via STOPPED state (non-gapless / end of queue)
            if (hasStartedPlaying && transportInfo.state === 'STOPPED') {
                dlnaLog('Track ended (stopped), advancing queue');
                hasStartedPlaying = false;
                getMainWindow()?.webContents.send('renderer-dlna-track-ended');
            }
        } catch {
            // Polling errors are expected during track transitions
        }
    }, 1000);
}

function stopPositionPolling() {
    if (positionPollingInterval) {
        clearInterval(positionPollingInterval);
        positionPollingInterval = null;
    }
}

// Discover DLNA devices on the network
ipcMain.handle('dlna-discover', async () => {
    try {
        dlnaLog('Discovering devices...');
        const devices = await discoverDevices(5000);
        dlnaLog(`Found ${devices.length} device(s): ${JSON.stringify(devices.map((d) => d.name))}`);
        return devices;
    } catch (err) {
        dlnaLog('Discovery failed', err);
        return [];
    }
});

// Connect to a specific DLNA device
ipcMain.handle('dlna-connect', async (_event, device: DlnaDevice) => {
    try {
        connectedDevice = device;
        lastKnownPosition = 0;
        hasStartedPlaying = false;
        trackLoadedAt = Date.now();
        startPositionPolling();
        dlnaLog(`Connected to ${device.name}`);

        // Get current volume from device to sync UI
        let deviceVolume = 50;
        try {
            deviceVolume = await getVolume(device);
            dlnaLog(`Device volume: ${deviceVolume}`);
        } catch {
            // Use default
        }

        return { success: true, volume: deviceVolume };
    } catch (err) {
        dlnaLog(`Failed to connect to ${device.name}`, err);
        return { success: false, volume: 50 };
    }
});

// Disconnect from the current device
ipcMain.handle('dlna-disconnect', async () => {
    try {
        if (connectedDevice) {
            try {
                await stop(connectedDevice);
            } catch {
                // Ignore stop errors during disconnect
            }
            dlnaLog(`Disconnected from ${connectedDevice.name}`);
        }
        connectedDevice = null;
        stopPositionPolling();
        return true;
    } catch (err) {
        dlnaLog('Failed to disconnect', err);
        connectedDevice = null;
        stopPositionPolling();
        return false;
    }
});

// Play a track on the connected device
ipcMain.on('dlna-play-url', async (_event, data: { metadata: TrackMetadata; url: string }) => {
    if (!connectedDevice) return;

    try {
        hasStartedPlaying = false;
        trackLoadedAt = Date.now();
        const lanUrl = rewriteUrlForLan(data.url);
        const lanArtUrl = data.metadata.albumArtUrl
            ? rewriteUrlForLan(data.metadata.albumArtUrl)
            : undefined;
        const metadata = { ...data.metadata, albumArtUrl: lanArtUrl };
        await setAVTransportURI(connectedDevice, lanUrl, metadata);
        await play(connectedDevice);
        dlnaLog(`Playing: ${data.metadata.title}`);
    } catch (err) {
        dlnaLog(`Failed to play ${data.metadata.title}`, err);
    }
});

// Set the next track for gapless playback
ipcMain.on('dlna-set-next-url', async (_event, data: { metadata: TrackMetadata; url: string }) => {
    if (!connectedDevice) return;

    try {
        const lanUrl = rewriteUrlForLan(data.url);
        const lanArtUrl = data.metadata.albumArtUrl
            ? rewriteUrlForLan(data.metadata.albumArtUrl)
            : undefined;
        const metadata = { ...data.metadata, albumArtUrl: lanArtUrl };
        await setNextAVTransportURI(connectedDevice, lanUrl, metadata);
        dlnaLog(`Set next track: ${data.metadata.title}`);
    } catch (err) {
        dlnaLog(`Failed to set next track ${data.metadata.title}`, err);
    }
});

// Resume playback
ipcMain.on('dlna-play', async () => {
    if (!connectedDevice) return;
    try {
        await play(connectedDevice);
    } catch (err) {
        dlnaLog('Failed to resume playback', err);
    }
});

// Pause playback
ipcMain.on('dlna-pause', async () => {
    if (!connectedDevice) return;
    try {
        await pause(connectedDevice);
    } catch (err) {
        dlnaLog('Failed to pause', err);
    }
});

// Stop playback
ipcMain.on('dlna-stop', async () => {
    if (!connectedDevice) return;
    try {
        await stop(connectedDevice);
    } catch (err) {
        dlnaLog('Failed to stop', err);
    }
});

// Seek to position
ipcMain.on('dlna-seek', async (_event, seconds: number) => {
    if (!connectedDevice) return;
    try {
        await seek(connectedDevice, seconds);
    } catch (err) {
        dlnaLog(`Failed to seek to ${seconds}`, err);
    }
});

// Set volume (0-100)
ipcMain.on('dlna-volume', async (_event, value: number) => {
    if (!connectedDevice) return;
    try {
        await setVolume(connectedDevice, value);
    } catch (err) {
        dlnaLog(`Failed to set volume to ${value}`, err);
    }
});

// Set mute
ipcMain.on('dlna-mute', async (_event, muted: boolean) => {
    if (!connectedDevice) return;
    try {
        await setMute(connectedDevice, muted);
    } catch (err) {
        dlnaLog(`Failed to set mute to ${muted}`, err);
    }
});

// Get current position
ipcMain.handle('dlna-get-position', async () => {
    if (!connectedDevice) return 0;
    try {
        const info = await getPositionInfo(connectedDevice);
        return info.position;
    } catch {
        return lastKnownPosition;
    }
});
