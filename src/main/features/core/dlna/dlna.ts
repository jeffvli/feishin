import axios from 'axios';
import { Bonjour } from 'bonjour-service';
import { ipcMain } from 'electron';
import { XMLParser } from 'fast-xml-parser';
import z from 'zod';

const parser = new XMLParser();

const deviceSchema = z.object({
    root: z.object({ device: z.object({ displayName: z.string(), roomName: z.string() }) }),
});

export const initializeDlna = () => {
    ipcMain.handle('dlna-discover', async () => {
        const bonjour = new Bonjour();
        const devices: Map<string, { name: string; url: string }> = new Map();

        return new Promise((resolve) => {
            bonjour.find({ type: 'sonos' }, async (aaa) => {
                if (!('location' in aaa.txt) || typeof aaa.txt.location !== 'string') {
                    return;
                }

                try {
                    // Fetch the device description XML to get the Friendly Name
                    const { data } = await axios.get(aaa.txt.location, { timeout: 2000 });
                    const result = await deviceSchema.safeParseAsync(parser.parse(data));

                    if (!result.success) {
                        console.log('Unable to parse description XML from AirPlay device');
                        return;
                    }

                    devices.set(aaa.txt.location, {
                        name: `${result.data.root.device.roomName} ⦁ ${result.data.root.device.displayName}`,
                        url: aaa.txt.location,
                    });
                } catch {
                    console.error(`Failed to get device info: ${aaa.txt}`);
                }
            });

            setTimeout(() => {
                bonjour.destroy();
                resolve(Array.from(devices.values()));
            }, 12 * 1000);
        });
    });
};
