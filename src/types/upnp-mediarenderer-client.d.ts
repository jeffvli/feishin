declare module 'upnp-mediarenderer-client' {
    export default class UpnpMediaRendererClient {
        instanceId: number;

        constructor(url: string);
        callAction(
            serviceType: string,
            actionName: string,
            params: Record<string, any>,
            callback: (error: any, result?: any) => void,
        ): void;
        emit(event: EventType, data?: any): void;
        getDuration(callback: (err: Error, result: any) => void): void;
        getPosition(callback: (err: Error, result: any) => void): void;
        getVolume(callback?: (err: Error, result: number) => void): void;
        load(url: string, options: any, callback?: (err: Error, result: any) => void): void;
        on(event: EventType, callback: (value: any) => void): void;
        pause(callback?: (err: Error, result: any) => void): void;
        seek(seconds: number, callback?: (err: Error, result: any) => void): void;

        setVolume(volume: number, callback?: (err: Error, result: any) => void): void;
        stop(callback?: (err: Error, result: any) => void): void;
    }

    type EventType =
        | 'changedTrack'
        | 'loading'
        | 'paused'
        | 'playing'
        | 'speedChanged'
        | 'status'
        | 'stopped';
}
