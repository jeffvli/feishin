import { IssuerDiscoveryResponse } from '../../../shared/types/domain-types';

type issuerMetadata = {
    issuer: string;
};

export async function discoverIssuer(url: string): Promise<IssuerDiscoveryResponse> {
    const issuerURL = new URL(url);
    issuerURL.pathname = issuerURL.pathname.replace(/\/$/, '');
    const wellKnownUrls = [
        `${issuerURL.origin}/.well-known/openid-configuration`,
        `${issuerURL.origin}`,
    ];
    if (issuerURL.pathname !== '') {
        wellKnownUrls.push(
            // RFC 8414 convetions for paths
            `${issuerURL.origin}${issuerURL.pathname}/.well-known/openid-configuration`,
        );
    }
    for (const wellKnownUrl of wellKnownUrls) {
        try {
            // Attempt to fetch the well-known configuration
            const res = await fetch(wellKnownUrl);
            if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
                // Parse the JSON response and return the issuer and metadata endpoint
                const jsonResponse: issuerMetadata = await res.json();
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
        issuer: '',
        metadataEndpoint: '',
    };
}

export function formatIssuerDiscoveryResponse(
    jsonResponse: issuerMetadata,
    metadataEndpoint: string,
): IssuerDiscoveryResponse {
    return {
        issuer: jsonResponse.issuer,
        metadataEndpoint: metadataEndpoint,
    };
}
