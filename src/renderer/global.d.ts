declare global {
    interface Window {
        ANALYTICS_DISABLED?: boolean | string;
        LEGACY_AUTHENTICATION?: boolean | string;
        SERVER_LOCK?: boolean | string;
        SERVER_NAME?: string;
        SERVER_TYPE?: string;
        SERVER_URL?: string;
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
