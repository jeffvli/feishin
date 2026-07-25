export type DiscordImageProxyConfig = LitterboxImageProxyConfig | UguuImageProxyConfig;

export type DiscordImageProxyServerType = 'litterbox' | 'uguu';

export interface LitterboxImageProxyConfig {
    time: '1h' | '12h' | '24h' | '72h';
}

export interface UguuImageProxyConfig {}
