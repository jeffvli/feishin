import axios from 'axios';

import { IssuerDiscoveryResponse } from '../../../shared/types/domain-types';

type issuerMetadata = {
    issuer: string;
};

export async function discoverIssuer(url: string): Promise<IssuerDiscoveryResponse> {
    const issuerURL = new URL(url);
    issuerURL.pathname = issuerURL.pathname.replace(/\/$/, '');
    const wellKnownUrls = [
        `${issuerURL.origin}/.well-known/openid-configuration`,
        `${issuerURL.origin}/.well-known/oauth-authorization-server`,
    ];
    if (issuerURL.pathname !== '') {
        wellKnownUrls.push(
            // RFC 8414 convetions for paths
            `${issuerURL.origin}${issuerURL.pathname}/.well-known/openid-configuration`,
            `${issuerURL.origin}/.well-known/oauth-authorization-server${issuerURL.pathname}`,
        );
    }
    console.info(`Attempting to discover OIDC/OAuth2 metadata`);
    for (const wellKnownUrl of wellKnownUrls) {
        try {
            const res = await fetch(wellKnownUrl);
            if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
                const jsonResponse: issuerMetadata = await res.json();
                console.info(`Successfully discovered OIDC/OAuth2 metadata`);
                return formatIssuerDiscoveryResponse(jsonResponse, wellKnownUrl);
            }
        } catch {
            //Ignore and try next URL
        }
    }

    console.warn(
        `Could not discover OIDC/OAuth2 metadata from ${issuerURL}. Provide Issuer URL manually.`,
    );
    return {
        found: false,
        issuer: '',
        metadataEndpoint: '',
    };
}

export function formatIssuerDiscoveryResponse(
    jsonResponse: issuerMetadata,
    metadataEndpoint: string,
): IssuerDiscoveryResponse {
    return {
        found: true,
        issuer: jsonResponse.issuer,
        metadataEndpoint: metadataEndpoint,
    };
}
