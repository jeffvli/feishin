/**
 * Returns true when the URL host is loopback or a private/LAN address.
 */
export const isLocalUrl = (value: string): boolean => {
    try {
        const { hostname } = new URL(value);

        if (
            hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            hostname === '::1' ||
            hostname === '[::1]' ||
            hostname === '0.0.0.0' ||
            hostname.endsWith('.local')
        ) {
            return true;
        }

        // IPv4 private / link-local ranges
        const ipv4 = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
        if (ipv4) {
            const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
            if (a === 10) return true;
            if (a === 127) return true;
            if (a === 192 && b === 168) return true;
            if (a === 169 && b === 254) return true;
            if (a === 172 && b >= 16 && b <= 31) return true;
        }

        // IPv6 unique local / link-local (fc00::/7, fe80::/10)
        const normalized = hostname.replace(/^\[|\]$/g, '').toLowerCase();
        if (normalized.startsWith('fc') || normalized.startsWith('fd')) {
            return true;
        }
        if (/^fe[89ab]/.test(normalized)) {
            return true;
        }

        return false;
    } catch {
        return false;
    }
};
