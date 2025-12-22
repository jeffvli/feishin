declare global {
    interface Window {
        umami?: {
            identify(unique_id: string): void;
            identify(unique_id: string, data: object): void;
            identify(data: object): void;
            track(): void;
            track(event_name: string, data: object): void;
            track(
                callback: (props: {
                    hostname: string;
                    language: string;
                    referrer: string;
                    screen: string;
                    title: string;
                    url: string;
                    website: string;
                }) => object,
            ): void;
        };
    }
}

export {};
