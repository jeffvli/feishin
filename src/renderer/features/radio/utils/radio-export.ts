import { z } from 'zod';

import { api } from '/@/renderer/api';
import { logger } from '/@/renderer/utils/logger';
import { InternetRadioStation, ServerListItem, ServerType } from '/@/shared/types/domain-types';

const ExportedRadioStationSchema = z.object({
    homepageUrl: z.string().nullish(),
    name: z.string().min(1),
    streamUrl: z.string().min(1),
});

const ExportedRadioServerSchema = z.object({
    server: z.object({
        name: z.string(),
        type: z.nativeEnum(ServerType),
        url: z.string(),
    }),
    stations: z.array(ExportedRadioStationSchema),
});

export const RadioStationsFileSchema = z.object({
    radioStations: z.array(ExportedRadioServerSchema),
    version: z.literal(1),
});

export type ExportedRadioServer = z.infer<typeof ExportedRadioServerSchema>;
export type ExportedRadioStation = z.infer<typeof ExportedRadioStationSchema>;
export type RadioStationsFile = z.infer<typeof RadioStationsFileSchema>;

const normalizeUrl = (url: string) => url.trim().replace(/\/+$/, '');

export const isSameServer = (exported: ExportedRadioServer['server'], server: ServerListItem) =>
    exported.type === server.type && normalizeUrl(exported.url) === normalizeUrl(server.url);

const toExportedStation = (station: InternetRadioStation): ExportedRadioStation => ({
    homepageUrl: station.homepageUrl,
    name: station.name,
    streamUrl: station.streamUrl,
});

// Stations are read through the API, so this works for servers that keep them remotely
// (Navidrome, Subsonic) and for Jellyfin, where Feishin keeps them locally
export const exportRadioStations = async (servers: ServerListItem[]) => {
    const failedServers: string[] = [];
    const radioStations: ExportedRadioServer[] = [];

    for (const server of servers) {
        try {
            const stations = await api.controller.getInternetRadioStations({
                apiClientProps: { serverId: server.id },
            });

            if (stations && stations.length > 0) {
                radioStations.push({
                    server: { name: server.name, type: server.type, url: server.url },
                    stations: stations.map(toExportedStation),
                });
            }
        } catch (error) {
            logger.warn('Could not read radio stations for export', { error, server: server.name });
            failedServers.push(server.name);
        }
    }

    const file: RadioStationsFile = { radioStations, version: 1 };

    return { failedServers, file };
};

export const downloadRadioStationsFile = (file: RadioStationsFile) => {
    const blob = new File([JSON.stringify(file, null, 2)], 'feishin-radio-stations.json', {
        type: 'application/json',
    });

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = blob.name;
    link.click();

    URL.revokeObjectURL(url);
};

export const importRadioStations = async (
    server: ServerListItem,
    stations: ExportedRadioStation[],
) => {
    const existing = await api.controller.getInternetRadioStations({
        apiClientProps: { serverId: server.id },
    });

    const knownUrls = new Set((existing || []).map((s) => normalizeUrl(s.streamUrl)));
    const result = { added: 0, failed: 0, skipped: 0 };

    for (const station of stations) {
        const key = normalizeUrl(station.streamUrl);

        if (knownUrls.has(key)) {
            result.skipped += 1;
            continue;
        }

        try {
            await api.controller.createInternetRadioStation({
                apiClientProps: { serverId: server.id },
                body: {
                    homepageUrl: station.homepageUrl || undefined,
                    name: station.name,
                    streamUrl: station.streamUrl,
                },
            });
            knownUrls.add(key);
            result.added += 1;
        } catch (error) {
            logger.error('Could not import radio station', { error, name: station.name });
            result.failed += 1;
        }
    }

    return result;
};
