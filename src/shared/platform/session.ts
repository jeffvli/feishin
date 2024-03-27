export type Session = {
    accessToken: string;
    accessTokenExpirationTimestampMs: number;
    isAnonymous: boolean;
    locale: string;
    market: string;
    valid: boolean;
};
