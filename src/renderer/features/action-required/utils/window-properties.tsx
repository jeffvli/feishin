export const isLegacyAuth = () =>
    window.LEGACY_AUTHENTICATION === true || window.LEGACY_AUTHENTICATION === 'true';

export const isServerLock = () => window.SERVER_LOCK === true || window.SERVER_LOCK === 'true';
