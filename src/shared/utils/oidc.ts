import { OIDCConfigResponse } from '/@/shared/types/domain-types';

type OIDCDiscoveryDocument = {
    authorization_endpoint?: string;
    issuer?: string;
    token_endpoint?: string;
    token_endpoint_auth_methods_supported?: string[];
};

export async function discoverOIDCConfig(url: string): Promise<OIDCConfigResponse> {
    const issuerURL = new URL(url);
    issuerURL.pathname = issuerURL.pathname.replace(/\/$/, '');
    const baseURLs = [`${issuerURL.origin}`, `${issuerURL.origin}/${issuerURL.pathname}`];

    for (const baseUrl of baseURLs) {
        const wellKnownUrl = `${baseUrl}/.well-known/openid-configuration`;
        console.info(`Attempting to discover OIDC config from ${wellKnownUrl}`);
        try {
            const res = await fetch(wellKnownUrl);
            console.info(`Received response from ${wellKnownUrl}: ${res.status} ${res.statusText}`);
            if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
                const jsonResponse: OIDCDiscoveryDocument = await res.json();
                console.info(
                    `Successfully discovered OIDC config from ${wellKnownUrl}:`,
                    jsonResponse,
                );
                return formatOIDCConfigResponse(jsonResponse);
            }
        } catch (e) {
            //console.info(`Not found OIDC config from ${url}: ${e}`);
            throw new Error(`Failed to discover OIDC config from ${url}: ${e}`);
        }
    }
    return {
        found: false,
    };
}

export function formatOIDCConfigResponse(jsonResponse: OIDCDiscoveryDocument): OIDCConfigResponse {
    return {
        authorizationEndpoint: jsonResponse.authorization_endpoint,
        found: true,
        issuer: jsonResponse.issuer,
        tokenAuthMethods: jsonResponse.token_endpoint_auth_methods_supported,
        tokenEndpoint: jsonResponse.token_endpoint,
    };
}
