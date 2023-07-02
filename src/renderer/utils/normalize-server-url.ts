export const normalizeServerUrl = (url: string) => {
    // Remove trailing slash
    return url.endsWith('/') ? url.slice(0, -1) : url;
};
