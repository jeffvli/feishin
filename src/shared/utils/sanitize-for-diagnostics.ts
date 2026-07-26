const SENSITIVE_KEY_PATTERN = /password|token|credential|authorization|secret|cookie/i;
const MAX_DEPTH = 20;

/**
 * Deep-clone a value for diagnostics exports, redacting sensitive keys.
 * Does not truncate arrays/strings — intended for config dumps, not log lines.
 */
export const sanitizeForDiagnostics = (value: unknown, depth = 0): unknown => {
    if (value === null || value === undefined) {
        return value;
    }

    if (typeof value !== 'object') {
        return value;
    }

    if (depth >= MAX_DEPTH) {
        return '[Truncated]';
    }

    if (Array.isArray(value)) {
        return value.map((item) => sanitizeForDiagnostics(item, depth + 1));
    }

    const result: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
        if (SENSITIVE_KEY_PATTERN.test(key)) {
            result[key] = '[Redacted]';
            continue;
        }

        // Main-process electron-store password map: { [serverId]: encryptedHex }
        if (
            key === 'server' &&
            nested &&
            typeof nested === 'object' &&
            !Array.isArray(nested) &&
            Object.values(nested as Record<string, unknown>).every((v) => typeof v === 'string')
        ) {
            result[key] = Object.fromEntries(
                Object.keys(nested as Record<string, unknown>).map((id) => [id, '[Redacted]']),
            );
            continue;
        }

        result[key] = sanitizeForDiagnostics(nested, depth + 1);
    }

    return result;
};
